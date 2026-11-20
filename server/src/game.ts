import crypto from 'node:crypto';
import type { Server } from 'socket.io';
import { getRatings, getUserById, type User } from './db';
import { RATING_TRACKS, type RatingTrack } from './domains';
import { Duel, type RatingSnap, type RoundPlan, type SlotInit } from './duel/Duel';
import { Matchmaker, type QueueEntry } from './matchmaking';
import { getMode, pickDomains } from './modes';
import { createRng } from './rng';

function snapshot(userId: number): Record<RatingTrack, RatingSnap> {
  const rows = getRatings(userId);
  const out = {} as Record<RatingTrack, RatingSnap>;
  for (const t of RATING_TRACKS) out[t] = { rating: rows[t].rating, rd: rows[t].rd, vol: rows[t].vol };
  return out;
}

/** Orchestrates queue → duel → results. */
export class GameServer {
  private mm: Matchmaker;
  /** Active duel per user (humans only). */
  private duels = new Map<number, Duel>();

  constructor(private io: Server) {
    this.mm = new Matchmaker(
      (a, b) => this.startHumanDuel(a, b),
      (a) => this.startGhostDuel(a),
    );
    this.mm.start();
  }

  private emit(userId: number, event: string, data?: unknown) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  onConnect(user: User) {
    const duel = this.duels.get(user.id);
    if (duel) duel.reconnected(user.id);
  }

  onDisconnect(user: User) {
    this.mm.leave(user.id);
    this.duels.get(user.id)?.disconnected(user.id);
  }

  joinQueue(user: User) {
    if (this.duels.has(user.id)) {
      this.duels.get(user.id)!.reconnected(user.id);
      return;
    }
    const rating = getRatings(user.id).general.rating;
    const entry = this.mm.join(user.id, rating);
    if (this.mm.has(user.id)) this.emit(user.id, 'queue:joined', { since: entry.joinedAt });
  }

  leaveQueue(user: User) {
    if (this.mm.leave(user.id)) this.emit(user.id, 'queue:left');
  }

  answer(user: User, payload: unknown) {
    this.duels.get(user.id)?.answer(user.id, payload);
  }

  forfeit(user: User) {
    this.duels.get(user.id)?.forfeit(user.id);
  }

  private humanSlot(userId: number): SlotInit {
    return { kind: 'human', userId, name: getUserById(userId)!.nickname, ratings: snapshot(userId) };
  }

  private launch(slots: [SlotInit, SlotInit], plans: RoundPlan[]) {
    const id = crypto.randomUUID();
    const humans = slots.filter((s) => s.kind === 'human').map((s) => s.userId!);
    const duel: Duel = new Duel(id, slots, plans, {
      emit: (userId, event, data) => this.emit(userId, event, data),
      onRoundRecorded: () => {},
      onFinish: () => [null, null],
      onClosed: () => {
        for (const u of humans) if (this.duels.get(u) === duel) this.duels.delete(u);
      },
    });
    for (const u of humans) this.duels.set(u, duel);
    duel.start();
    return duel;
  }

  private startHumanDuel(a: QueueEntry, b: QueueEntry) {
    const rng = createRng();
    const plans: RoundPlan[] = pickDomains(rng).map((domain) => ({
      domain,
      content: getMode(domain).generateRound(rng),
      scripts: [null, null],
    }));
    this.launch([this.humanSlot(a.userId), this.humanSlot(b.userId)], plans);
  }

  private startGhostDuel(a: QueueEntry) {
    const rng = createRng();
    const me = this.humanSlot(a.userId);
    const botRating = me.ratings.general.rating;
    const ratings = {} as Record<RatingTrack, RatingSnap>;
    for (const t of RATING_TRACKS) ratings[t] = { rating: botRating, rd: 120, vol: 0.06 };
    const bot: SlotInit = { kind: 'bot', userId: null, name: 'Bot', ratings };
    const plans: RoundPlan[] = pickDomains(rng).map((domain) => {
      const mode = getMode(domain);
      const content = mode.generateRound(rng);
      return { domain, content, scripts: [null, mode.simulateBot(content, botRating, rng)] };
    });
    this.launch([me, bot], plans);
  }
}
