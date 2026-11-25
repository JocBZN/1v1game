import { describe, expect, it } from 'vitest';
import type { DuelSummary, SlotInit } from '../src/duel/Duel';
import { computeRatingUpdates } from '../src/duel/results';
import { RATING_TRACKS } from '../src/domains';

function slot(kind: SlotInit['kind'], rating: number, rd = 200): SlotInit {
  const ratings = Object.fromEntries(RATING_TRACKS.map((t) => [t, { rating, rd, vol: 0.06 }])) as SlotInit['ratings'];
  return { kind, userId: kind === 'human' ? 1 : null, name: kind, ratings };
}

const summary: DuelSummary = {
  rounds: [
    { domain: 'color', scores: [900, 500], winner: 0 },
    { domain: 'trivia', scores: [1200, 2500], winner: 1 },
    { domain: 'flags', scores: [4000, 3000], winner: 0 },
  ],
  roundWins: [2, 1],
  totals: [6100, 6000],
  winner: 0,
  forfeitSlot: null,
};

describe('computeRatingUpdates', () => {
  const slots: [SlotInit, SlotInit] = [slot('human', 1500), slot('human', 1500)];

  it('updates general from the duel and each played domain from its round', () => {
    const a = computeRatingUpdates(slots, 0, summary);
    expect(Object.keys(a).sort()).toEqual(['color', 'flags', 'general', 'trivia']);
    expect(a.general!.after.rating).toBeGreaterThan(1500);
    expect(a.color!.after.rating).toBeGreaterThan(1500);
    expect(a.trivia!.after.rating).toBeLessThan(1500);
    expect(a.chess).toBeUndefined();
    expect(a.general).toMatchObject({ wins: 1, losses: 0, draws: 0 });
    expect(a.trivia).toMatchObject({ wins: 0, losses: 1 });
  });

  it('is mirrored for the loser', () => {
    const b = computeRatingUpdates(slots, 1, summary);
    expect(b.general!.after.rating).toBeLessThan(1500);
    expect(b.trivia!.after.rating).toBeGreaterThan(1500);
  });

  it('against a ghost uses the ghost’s fixed rating as the opponent', () => {
    const vsStrong = computeRatingUpdates([slot('human', 1500), slot('ghost', 1900, 80)], 0, summary);
    const vsWeak = computeRatingUpdates([slot('human', 1500), slot('ghost', 1100, 80)], 0, summary);
    expect(vsStrong.general!.after.rating - 1500).toBeGreaterThan(vsWeak.general!.after.rating - 1500);
  });

  it('a forfeit with no completed rounds only touches general', () => {
    const f: DuelSummary = { rounds: [], roundWins: [0, 0], totals: [0, 0], winner: 1, forfeitSlot: 0 };
    const a = computeRatingUpdates(slots, 0, f);
    expect(Object.keys(a)).toEqual(['general']);
    expect(a.general!.after.rating).toBeLessThan(1500);
  });
});
