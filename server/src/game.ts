import crypto from 'node:crypto';
import type { Server } from 'socket.io';
import { avatarUrl, db, getQuestionStats, getRating, getRatings, getRecentResults, getUserById, recordQuestionAnswer, saveDuel, saveRating, type DuelPlayerRecord, type User } from './db';
import { RATING_TRACKS, isDomain, type DomainId, type RatingTrack } from './domains';
import { Duel, type DuelSummary, type RatingSnap, type RoundPlan, type Slot, type SlotInit } from './duel/Duel';
import { computeRatingUpdates } from './duel/results';
import { buildBotDuel, buildGhostDuel, recordRound } from './ghost';
import { leagueFor } from './leagues';
import { capture } from './analytics';
import { Matchmaker, type QueueEntry } from './matchmaking';
import { availableDomains, getMode, pickDomains } from './modes';
import { createRng } from './rng';
import { starsFromRate } from './modes/scoring';
import { setLiveStars, type TriviaContent } from './modes/trivia';

/** Recompute each trivia question's live star difficulty from real answer rates. */
function refreshLiveStars() {
  const m = new Map<string, number>();
  for (const s of getQuestionStats()) {
    const st = starsFromRate(s.seen, s.correct);
    if (st !== null) m.set(s.qid, st);
  }
  setLiveStars(m);
}
import { Rooms } from './rooms';

function snapshot(userId: number): Record<RatingTrack, RatingSnap> {
  const rows = getRatings(userId);
  const out = {} as Record<RatingTrack, RatingSnap>;
  for (const t of RATING_TRACKS) out[t] = { rating: rows[t].rating, rd: rows[t].rd, vol: rows[t].vol };
  return out;
}

/** How a duel came about, for analytics. */
interface DuelMeta {
  mode: 'live' | 'ghost' | 'bot' | 'friend' | 'practice';
  /** ms each human spent in the queue (ranked duels) */
  waitMs?: Record<number, number>;
}

type DuelExtra = {
  friendly?: boolean;
  /** Practice duel against a bot on one chosen game. */
  practice?: DomainId;
  ratingChanges?: Record<string, { before: number; after: number }>;
  league?: { before: string; after: string };
  ratingFactors?: { streak: number };
} | null;

/** Orchestrates queue → duel → results. */
export class GameServer {
  private mm: Matchmaker;
  /** Active duel per user (humans only). */
  private duels = new Map<number, Duel>();
  readonly rooms: Rooms;

  constructor(private io: Server) {
    this.rooms = new Rooms({
      emit: (userId, event, data) => this.emit(userId, event, data),
      nameOf: (userId) => getUserById(userId)?.nickname ?? 'Player',
      startDuel: (hostId, guestId, onEnd) => this.startFriendDuel(hostId, guestId, onEnd),
    });
    setInterval(() => this.rooms.sweep(), 10_000).unref();
    this.mm = new Matchmaker(
      (a, b) => this.startHumanDuel(a, b),
      (a) => this.startGhostDuel(a),
    );
    this.mm.start();
    refreshLiveStars();
    setInterval(refreshLiveStars, 10 * 60_000).unref();
  }

  private emit(userId: number, event: string, data?: unknown) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /** Returns false when the user has no duel in progress (the client may hold a stale one, e.g. after a server restart). */
  onConnect(user: User): boolean {
    const duel = this.duels.get(user.id);
    if (duel) duel.reconnected(user.id);
    this.rooms.online(user.id);
    return !!duel;
  }

  onDisconnect(user: User) {
    if (this.mm.has(user.id)) capture(user.id, 'queue_abandoned', { reason: 'disconnect' });
    if (this.duels.has(user.id)) capture(user.id, 'duel_disconnected');
    this.mm.leave(user.id);
    this.duels.get(user.id)?.disconnected(user.id);
    this.rooms.offline(user.id);
  }

  joinQueue(user: User) {
    if (this.duels.has(user.id)) {
      this.duels.get(user.id)!.reconnected(user.id);
      return;
    }
    // Searching for a random opponent means leaving any private room.
    this.rooms.leave(user.id);
    const rating = getRatings(user.id).general.rating;
    const wasQueued = this.mm.has(user.id);
    const entry = this.mm.join(user.id, rating);
    if (!wasQueued) capture(user.id, 'queue_joined', { rating: Math.round(rating), queue_size: this.mm.size, is_guest: !!user.is_guest });
    if (this.mm.has(user.id)) this.emit(user.id, 'queue:joined', { since: entry.joinedAt });
  }

  leaveQueue(user: User) {
    if (this.mm.leave(user.id)) {
      capture(user.id, 'queue_abandoned', { reason: 'cancel' });
      this.emit(user.id, 'queue:left');
    }
  }

  answer(user: User, payload: unknown) {
    this.duels.get(user.id)?.answer(user.id, payload);
  }

  createRoom(user: User) {
    if (this.duels.has(user.id)) return this.duels.get(user.id)!.reconnected(user.id);
    this.mm.leave(user.id);
    this.rooms.create(user.id);
  }

  joinRoom(user: User, code: unknown) {
    if (this.duels.has(user.id)) return this.duels.get(user.id)!.reconnected(user.id);
    this.mm.leave(user.id);
    const r = this.rooms.join(user.id, code);
    if (!r.ok) this.emit(user.id, 'room:error', { error: r.error });
  }

  rematch(user: User) {
    if (!this.duels.has(user.id)) this.rooms.rematch(user.id);
  }

  leaveRoom(user: User) {
    this.rooms.leave(user.id);
  }

  /** "Select game": a duel against a bot where every round is the chosen game. Never rated. */
  practice(user: User, domain: unknown) {
    if (this.duels.has(user.id)) return this.duels.get(user.id)!.reconnected(user.id);
    if (!isDomain(domain) || !availableDomains().includes(domain)) return this.emit(user.id, 'duel:none');
    this.mm.leave(user.id);
    this.rooms.leave(user.id);
    const rng = createRng();
    const me = this.humanSlot(user.id);
    const { opponent, plans } = buildBotDuel(me.ratings.general.rating, rng, [domain, domain, domain]);
    this.launch([me, opponent], plans, { mode: 'practice' }, { rated: false, practice: domain });
  }

  forfeit(user: User) {
    const duel = this.duels.get(user.id);
    if (duel) capture(user.id, 'duel_forfeit_clicked');
    if (duel) duel.forfeit(user.id);
    else this.emit(user.id, 'duel:none');
  }

  private humanSlot(userId: number): SlotInit {
    const u = getUserById(userId)!;
    return { kind: 'human', userId, name: u.nickname, avatar: avatarUrl(u.id, u.avatar_v), ratings: snapshot(userId) };
  }

  /** Persist ratings + duel; returns the per-slot extra payload for `duel:end`. */
  private finalize(slots: [SlotInit, SlotInit], summary: DuelSummary, rated: boolean): [unknown, unknown] {
    const extras: [unknown, unknown] = [null, null];
    const records: DuelPlayerRecord[] = [];

    const tx = db.transaction(() => {
      for (const slot of [0, 1] as Slot[]) {
        const s = slots[slot];
        const result: 'W' | 'L' | 'D' = summary.winner === null ? 'D' : summary.winner === slot ? 'W' : 'L';
        const changes: Record<string, { before: number; after: number }> = {};
        let generalAfter = s.ratings.general.rating;

        if (!rated) {
          // Friendly duel: no rating change for anyone.
          extras[slot] = { friendly: true };
        } else if (s.kind === 'human' && s.userId !== null) {
          const updates = computeRatingUpdates(slots, slot, summary, {
            recent: getRecentResults(s.userId),
            general: getRating(s.userId, 'general'),
          });
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
            ratingFactors: updates.general!.factors,
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

  private launch(slots: [SlotInit, SlotInit], plans: RoundPlan[], meta: DuelMeta, opts: { rated?: boolean; practice?: DomainId; onEnd?: (s: DuelSummary) => void } = {}) {
    const rated = opts.rated ?? true;
    const id = crypto.randomUUID();
    const humans = slots.filter((s) => s.kind === 'human').map((s) => s.userId!);
    const startedAt = Date.now();
    const domains = plans.map((p) => p.domain);
    for (const slot of [0, 1] as Slot[]) {
      const s = slots[slot];
      if (s.kind !== 'human' || s.userId === null) continue;
      const o = slots[1 - slot];
      capture(s.userId, 'duel_started', {
        duel_id: id,
        mode: meta.mode,
        opponent_kind: o.kind,
        rated,
        wait_ms: meta.waitMs?.[s.userId],
        rating: Math.round(s.ratings.general.rating),
        opponent_rating: Math.round(o.ratings.general.rating),
        rating_gap: Math.round(o.ratings.general.rating - s.ratings.general.rating),
        domains,
      });
    }
    const duel: Duel = new Duel(id, slots, plans, {
      emit: (userId, event, data) => this.emit(userId, event, data),
      onRoundRecorded: (slot, rec) => {
        const s = slots[slot];
        if (s.kind === 'human' && s.userId !== null) {
          capture(s.userId, 'round_played', {
            duel_id: id,
            mode: meta.mode,
            domain: rec.domain,
            score: rec.score,
            duration_ms: rec.durationMs,
            answers: rec.events.filter((e) => (e as { done?: boolean }).done).length,
          });
          recordRound(s.userId, s.ratings, rec);
          if (rec.domain === 'trivia') {
            const items = (rec.content as TriviaContent).items;
            for (const ev of rec.events) if (ev.done && items[ev.item]) recordQuestionAnswer(items[ev.item].qid, ev.correct);
          }
        }
      },
      onFinish: (summary) => {
        try {
          const extras = this.finalize(slots, summary, rated);
          if (opts.practice) for (const e of extras as DuelExtra[]) if (e) e.practice = opts.practice;
          try {
            this.trackFinish(id, slots, summary, extras as [DuelExtra, DuelExtra], meta, Date.now() - startedAt);
          } catch (e) {
            console.warn('[posthog] duel_finished', e);
          }
          return extras;
        } finally {
          opts.onEnd?.(summary);
        }
      },
      onClosed: () => {
        for (const u of humans) if (this.duels.get(u) === duel) this.duels.delete(u);
      },
    });
    for (const u of humans) this.duels.set(u, duel);
    duel.start();
    return duel;
  }

  /** One `duel_finished` per human, plus person properties (rating, league, games) for cohorts. */
  private trackFinish(id: string, slots: [SlotInit, SlotInit], summary: DuelSummary, extras: [DuelExtra, DuelExtra], meta: DuelMeta, durationMs: number) {
    for (const slot of [0, 1] as Slot[]) {
      const s = slots[slot];
      if (s.kind !== 'human' || s.userId === null) continue;
      const other = (1 - slot) as Slot;
      const result = summary.winner === null ? 'draw' : summary.winner === slot ? 'win' : 'loss';
      const x = extras[slot];
      const g = x?.ratingChanges?.general;
      const user = getUserById(s.userId);
      const general = getRating(s.userId, 'general');
      capture(s.userId, 'duel_finished', {
        duel_id: id,
        mode: meta.mode,
        opponent_kind: slots[other].kind,
        result,
        forfeit: summary.forfeitSlot === null ? 'none' : summary.forfeitSlot === slot ? 'self' : 'opponent',
        rounds_won: summary.roundWins[slot],
        rounds_lost: summary.roundWins[other],
        score: summary.totals[slot],
        opponent_score: summary.totals[other],
        duration_ms: durationMs,
        domains: summary.rounds.map((r) => r.domain),
        rounds: summary.rounds.map((r) => ({ domain: r.domain, score: r.scores[slot], opponent: r.scores[other], won: r.winner === slot })),
        rating_before: g?.before,
        rating_after: g?.after,
        rating_delta: g ? g.after - g.before : undefined,
        league_before: x?.league?.before,
        league_after: x?.league?.after,
        promoted: x?.league ? x.league.before !== x.league.after && (g?.after ?? 0) > (g?.before ?? 0) : undefined,
        streak: x?.ratingFactors?.streak,
        $set: {
          nickname: user?.nickname,
          is_guest: !!user?.is_guest,
          rating: Math.round(general.rating),
          league: leagueFor(general.rating).id,
          games: general.games,
          wins: general.wins,
          losses: general.losses,
          last_duel_at: new Date().toISOString(),
        },
        $set_once: { first_duel_at: new Date().toISOString() },
      });
      // Per-game outcome, for "which games do players win / lose" breakdowns.
      for (const r of summary.rounds) {
        capture(s.userId, 'round_result', {
          duel_id: id,
          mode: meta.mode,
          domain: r.domain,
          score: r.scores[slot],
          opponent_score: r.scores[other],
          outcome: r.winner === null ? 'tie' : r.winner === slot ? 'won' : 'lost',
        });
      }
    }
  }

  private startHumanDuel(a: QueueEntry, b: QueueEntry) {
    const rng = createRng();
    const plans: RoundPlan[] = pickDomains(rng).map((domain) => ({
      domain,
      content: getMode(domain).generateRound(rng),
      scripts: [null, null],
    }));
    const now = Date.now();
    this.launch([this.humanSlot(a.userId), this.humanSlot(b.userId)], plans, {
      mode: 'live',
      waitMs: { [a.userId]: now - a.joinedAt, [b.userId]: now - b.joinedAt },
    });
  }

  /** Private room: two friends, same rounds as a normal duel, no rating change. */
  private startFriendDuel(hostId: number, guestId: number, onEnd: (winner: 0 | 1 | null) => void) {
    const rng = createRng();
    const plans: RoundPlan[] = pickDomains(rng).map((domain) => ({
      domain,
      content: getMode(domain).generateRound(rng),
      scripts: [null, null],
    }));
    this.launch([this.humanSlot(hostId), this.humanSlot(guestId)], plans, { mode: 'friend' }, {
      rated: false,
      onEnd: (summary) => onEnd(summary.winner),
    });
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
    if (opponent.kind === 'ghost' && opponent.userId !== null) {
      const g = getUserById(opponent.userId);
      opponent.avatar = g ? avatarUrl(g.id, g.avatar_v) : null;
    }
    this.launch([me, opponent], plans, { mode: opponent.kind === 'ghost' ? 'ghost' : 'bot', waitMs: { [a.userId]: Date.now() - a.joinedAt } });
  }
}
