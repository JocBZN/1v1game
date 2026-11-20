import type { DomainId, RatingTrack } from '../domains';
import { rate, type GameResult, type Rating } from '../rating';
import { outcomeFor } from './logic';
import type { DuelSummary, Slot, SlotInit } from './Duel';

export interface TrackUpdate {
  before: Rating;
  after: Rating;
  /** W/L/D added on this track */
  wins: number;
  losses: number;
  draws: number;
}

/**
 * New ratings for one slot after a duel:
 *  - general: one game, the duel result
 *  - each domain played: one game per round in that domain, the round result
 * The opponent's rating is taken from its snapshot (fixed for ghosts/bots).
 */
export function computeRatingUpdates(slots: readonly [SlotInit, SlotInit], slot: Slot, summary: DuelSummary): Partial<Record<RatingTrack, TrackUpdate>> {
  const me = slots[slot];
  const opp = slots[1 - slot];
  const out: Partial<Record<RatingTrack, TrackUpdate>> = {};

  const tally = (results: GameResult[]) => ({
    wins: results.filter((r) => r.score === 1).length,
    losses: results.filter((r) => r.score === 0).length,
    draws: results.filter((r) => r.score === 0.5).length,
  });

  const general: GameResult[] = [{ opponent: opp.ratings.general, score: outcomeFor(slot, summary.winner) }];
  out.general = { before: me.ratings.general, after: rate(me.ratings.general, general), ...tally(general) };

  const perDomain = new Map<DomainId, GameResult[]>();
  for (const r of summary.rounds) {
    const list = perDomain.get(r.domain) ?? [];
    list.push({ opponent: opp.ratings[r.domain], score: outcomeFor(slot, r.winner) });
    perDomain.set(r.domain, list);
  }
  for (const [domain, results] of perDomain) {
    out[domain] = { before: me.ratings[domain], after: rate(me.ratings[domain], results), ...tally(results) };
  }
  return out;
}
