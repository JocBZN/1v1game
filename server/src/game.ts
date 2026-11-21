import crypto from 'node:crypto';
import type { Server } from 'socket.io';
import { db, getRating, getRatings, getUserById, saveDuel, saveRating, type DuelPlayerRecord, type User } from './db';
import { RATING_TRACKS, type RatingTrack } from './domains';
import { Duel, type DuelSummary, type RatingSnap, type RoundPlan, type Slot, type SlotInit } from './duel/Duel';
import { computeRatingUpdates } from './duel/results';
import { buildBotDuel, buildGhostDuel, recordRound } from './ghost';
import { leagueFor } from './leagues';
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

  /** Returns false when the user has no duel in progress (the client may hold a stale one, e.g. after a server restart). */
  onConnect(user: User): boolean {
    const duel = this.duels.get(user.id);
    if (duel) duel.reconnected(user.id);
    return !!duel;
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
    const duel = this.duels.get(user.id);
    if (duel) duel.forfeit(user.id);
    else this.emit(user.id, 'duel:none');
  }

  private humanSlot(userId: number): SlotInit {
    return { kind: 'human', userId, name: getUserById(userId)!.nickname, ratings: snapshot(userId) };
  }

  /** Persist ratings + duel; returns the per-slot extra payload for `duel:end`. */
  private finalize(slots: [SlotInit, SlotInit], summary: DuelSummary): [unknown, unknown] {
    const extras: [unknown, unknown] = [null, null];
    const records: DuelPlayerRecord[] = [];

    const tx = db.transaction(() => {
      for (const slot of [0, 1] as Slot[]) {
        const s = slots[slot];
        const result: 'W' | 'L' | 'D' = summary.winner === null ? 'D' : summary.winner === slot ? 'W' : 'L';
        const changes: Record<string, { before: number; after: number }> = {};
        let generalAfter = s.ratings.general.rating;

        if (s.kind === 'human' && s.userId !== null) {
          const updates = computeRatingUpdates(slots, slot, summary);
          for (const [track, u] of Object.entries(updates) as [RatingTrack, NonNullable<(typeof updates)[RatingTrack]>][]) {
            const row = getRating(s.userId, track);
            saveRating({
              ...row,
              rating: u.after.rating, rd: u.after.rd, vol: u.after.vol,
              wins: row.wins + u.wins, losses: row.losses + u.losses, draws: row.draws + u.draws,
              games: row.games + u.wins + u.losses + u.draws,
            });
            changes[track] = { before: Math.round(u.before.rating), after: Math.round(u.after.rating) };
          }
          generalAfter = updates.general!.after.rating;
          extras[slot] = {
            ratingChanges: changes,
            league: { before: leagueFor(s.ratings.general.rating).id, after: leagueFor(generalAfter).id },
          };
        }

        records.push({
          slot,
          userId: s.kind === 'human' ? s.userId : null,
          kind: s.kind,
          name: s.name,
          result,
          roundsWon: summary.roundWins[slot],
          totalScore: summary.totals[slot],
          ratingBefore: s.ratings.general.rating,
          ratingAfter: generalAfter,
          changes,
        });
      }
      saveDuel(summary.rounds.map((r) => r.domain), summary.rounds, summary.forfeitSlot !== null, records);
    });
    tx();
    return extras;
  }

  private launch(slots: [SlotInit, SlotInit], plans: RoundPlan[]) {
    const id = crypto.randomUUID();
    const humans = slots.filter((s) => s.kind === 'human').map((s) => s.userId!);
    const duel: Duel = new Duel(id, slots, plans, {
      emit: (userId, event, data) => this.emit(userId, event, data),
      onRoundRecorded: (slot, rec) => {
        const s = slots[slot];
        if (s.kind === 'human' && s.userId !== null) recordRound(s.userId, s.ratings, rec);
      },
      onFinish: (summary) => this.finalize(slots, summary),
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

  /** Nobody live after 5 s: replay a real player's recorded rounds (ghost), or a bot if there are none. */
  private startGhostDuel(a: QueueEntry) {
    const rng = createRng();
    const me = this.humanSlot(a.userId);
    const myGeneral = me.ratings.general.rating;
    let built: ReturnType<typeof buildGhostDuel> = null;
    try {
      built = buildGhostDuel(a.userId, myGeneral, rng);
    } catch (e) {
      console.error('[ghost] failed, falling back to bot', e);
    }
    const { opponent, plans } = built ?? buildBotDuel(myGeneral, rng);
    this.launch([me, opponent], plans);
  }
}
