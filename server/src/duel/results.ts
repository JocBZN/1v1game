import type { DomainId, RatingTrack } from '../domains';
import { rate, type GameResult, type Rating } from '../rating';
import { outcomeFor } from './logic';
import type { DuelSummary, Slot, SlotInit } from './Duel';

export interface RatingFactors {
  /** win/loss streak including this duel (+3 = third win in a row, −2 = second loss in a row) */
  streak: number;
  streakX: number;
  /** how decisive the points were */
  marginX: number;
  /** the player's win rate so far */
  recordX: number;
  /** product of the three */
  total: number;
}

export interface TrackUpdate {
  before: Rating;
  after: Rating;
  /** W/L/D added on this track */
  wins: number;
  losses: number;
  draws: number;
  factors?: RatingFactors;
}

export interface RatingContext {
  /** latest duel results before this one, newest first */
  recent: readonly ('W' | 'L' | 'D')[];
  /** the player's overall record before this duel */
  general: { wins: number; losses: number; games: number };
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * Multipliers applied on top of Glicko-2 (which already weighs the opponent's rating):
 *  - streak: every extra win (or loss) in a row adds 10 %, up to +50 %
 *  - margin: a close duel moves the rating less than a one-sided one (×0.8 … ×1.4)
 *  - record: players with a good win rate gain a little more and lose a little less (×0.85 … ×1.15)
 */
export function ratingFactors(result: 'W' | 'L' | 'D', margin: number, ctx: RatingContext): RatingFactors {
  let streak = 0;
  if (result !== 'D') {
    streak = 1;
    for (const r of ctx.recent) {
      if (r !== result) break;
      streak++;
    }
    if (result === 'L') streak = -streak;
  }
  const streakX = 1 + 0.1 * Math.min(Math.abs(streak) - 1, 5) * (streak === 0 ? 0 : 1);
  const marginX = result === 'D' ? 1 : clamp(0.8 + 0.6 * margin, 0.8, 1.4);
  const g = ctx.general;
  const winRate = g.games >= 5 ? g.wins / Math.max(1, g.wins + g.losses) : 0.5;
  const recordX = result === 'D' ? 1 : clamp(1 + (result === 'W' ? 1 : -1) * 0.3 * (winRate - 0.5), 0.85, 1.15);
  return { streak, streakX: round2(Math.max(1, streakX)), marginX: round2(marginX), recordX: round2(recordX), total: round2(Math.max(1, streakX) * marginX * recordX) };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Score margin 0..1: |a − b| / (a + b). */
export const scoreMargin = (a: number, b: number) => (a + b > 0 ? Math.abs(a - b) / (a + b) : 0);

function scaled(before: Rating, after: Rating, k: number): Rating {
  return { ...after, rating: before.rating + (after.rating - before.rating) * k };
}

/**
 * New ratings for one slot after a duel:
 *  - general: one game, the duel result, scaled by streak, margin and record
 *  - each domain played: one game per round in that domain, scaled by that round's margin
 * The opponent's rating is taken from its snapshot (fixed for ghosts/bots).
 */
export function computeRatingUpdates(
  slots: readonly [SlotInit, SlotInit],
  slot: Slot,
  summary: DuelSummary,
  ctx: RatingContext = { recent: [], general: { wins: 0, losses: 0, games: 0 } },
): Partial<Record<RatingTrack, TrackUpdate>> {
  const me = slots[slot];
  const opp = slots[1 - slot];
  const out: Partial<Record<RatingTrack, TrackUpdate>> = {};

  const tally = (results: GameResult[]) => ({
    wins: results.filter((r) => r.score === 1).length,
    losses: results.filter((r) => r.score === 0).length,
    draws: results.filter((r) => r.score === 0.5).length,
  });

  const score = outcomeFor(slot, summary.winner);
  const result = score === 1 ? 'W' : score === 0 ? 'L' : 'D';
  const factors = ratingFactors(result, scoreMargin(summary.totals[0], summary.totals[1]), ctx);
  const general: GameResult[] = [{ opponent: opp.ratings.general, score }];
  out.general = {
    before: me.ratings.general,
    after: scaled(me.ratings.general, rate(me.ratings.general, general), factors.total),
    ...tally(general),
    factors,
  };

  const perDomain = new Map<DomainId, { results: GameResult[]; margins: number[] }>();
  for (const r of summary.rounds) {
    const e = perDomain.get(r.domain) ?? { results: [], margins: [] };
    e.results.push({ opponent: opp.ratings[r.domain], score: outcomeFor(slot, r.winner) });
    e.margins.push(scoreMargin(r.scores[0], r.scores[1]));
    perDomain.set(r.domain, e);
  }
  for (const [domain, { results, margins }] of perDomain) {
    const m = margins.reduce((a, b) => a + b, 0) / margins.length;
    const k = clamp(0.8 + 0.6 * m, 0.8, 1.4);
    out[domain] = { before: me.ratings[domain], after: scaled(me.ratings[domain], rate(me.ratings[domain], results), k), ...tally(results) };
  }
  return out;
}
