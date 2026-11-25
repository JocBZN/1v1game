import { describe, expect, it } from 'vitest';
import { estimatePoints, followersMode, opinionMode, priceMode, yearMode } from '../src/modes/estimate';
import { opinionQuestions } from '../src/modes/estimate-data';
import { ratingFactors } from '../src/duel/results';
import { createRng } from '../src/rng';

const ctx = { elapsedMs: 1000, itemState: {} };

describe('estimate games', () => {
  it('log scoring: exact = 1000, 10× off = 0 (zeroAt 10), symmetric', () => {
    const inp = { kind: 'log', min: 1, max: 1e9 } as const;
    expect(estimatePoints(inp, 1000, 1000)).toBe(1000);
    expect(estimatePoints(inp, 1000, 10_000)).toBe(0);
    expect(estimatePoints(inp, 1000, 2000)).toBe(estimatePoints(inp, 1000, 500));
  });

  it('year scoring: exact = 1000, 3 years off = 750, 12+ off = 0', () => {
    const inp = { kind: 'year', min: 1980, max: 2026 } as const;
    expect(estimatePoints(inp, 2004, 2004)).toBe(1000);
    expect(estimatePoints(inp, 2004, 2007)).toBe(750);
    expect(estimatePoints(inp, 2004, 1990)).toBe(0);
  });

  it('Opinion has at least 200 different questions and no answer leaks to the client', () => {
    expect(new Set(opinionQuestions().map((q) => q.q)).size).toBeGreaterThanOrEqual(200);
    for (const m of [opinionMode, yearMode, priceMode, followersMode]) {
      const c = m.generateRound(createRng(4));
      expect(new Set(c.items.map((i) => i.q)).size).toBe(c.items.length);
      expect(JSON.stringify(m.publicItem(c, 0))).not.toMatch(/"answer"/);
      const r = m.validateAnswer(c, 0, c.items[0].answer, ctx);
      expect(r.points).toBe(1000);
      expect(m.validateAnswer(c, 0, 'abc', ctx).points).toBe(0);
    }
  });
});

describe('rating multipliers', () => {
  const fresh = { recent: [], general: { wins: 0, losses: 0, games: 0 } };
  it('streaks add 10 % per extra result in a row, capped at +50 %', () => {
    expect(ratingFactors('W', 0.3, { ...fresh, recent: ['W', 'W', 'L'] }).streak).toBe(3);
    expect(ratingFactors('W', 0.3, { ...fresh, recent: ['W', 'W', 'L'] }).streakX).toBe(1.2);
    expect(ratingFactors('L', 0.3, { ...fresh, recent: Array(9).fill('L') }).streakX).toBe(1.5);
    expect(ratingFactors('W', 0.3, fresh).streakX).toBe(1);
  });
  it('one-sided duels move more than close ones; good records gain more and lose less', () => {
    expect(ratingFactors('W', 0.9, fresh).marginX).toBeGreaterThan(ratingFactors('W', 0.05, fresh).marginX);
    const good = { recent: [], general: { wins: 30, losses: 10, games: 40 } };
    expect(ratingFactors('W', 0.3, good).recordX).toBeGreaterThan(1);
    expect(ratingFactors('L', 0.3, good).recordX).toBeLessThan(1);
  });
});
