import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';
import { MATH_POINTS, MATH_WRONG_PENALTY, mathMode, mathPrompt, parseIntAnswer, tierFor } from '../src/modes/math';

const ctx = () => ({ elapsedMs: 1000, itemState: {} });

describe('math mode', () => {
  const content = mathMode.generateRound(createRng(42));

  it('every problem has an integer answer that matches its prompt', () => {
    for (const item of content.items) {
      expect(Number.isInteger(item.answer)).toBe(true);
      const expr = mathPrompt(item).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      expect(Function(`return (${expr})`)()).toBe(item.answer);
      expect(item.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('difficulty increases', () => {
    expect(tierFor(0)).toBe(1);
    expect(tierFor(10)).toBe(2);
    expect(tierFor(20)).toBe(3);
    expect(tierFor(60)).toBe(4);
    const tiers = content.items.map((i) => i.tier);
    expect([...tiers].sort((a, b) => a - b)).toEqual(tiers);
  });

  it('public item does not contain the answer', () => {
    const pub = mathMode.publicItem(content, 0) as Record<string, unknown>;
    expect(Object.keys(pub).sort()).toEqual(['prompt', 'tier']);
  });

  it('correct answer scores by tier, wrong one costs a small penalty', () => {
    const i = 0;
    const item = content.items[i];
    const ok = mathMode.validateAnswer(content, i, item.answer, ctx());
    expect(ok).toMatchObject({ correct: true, points: MATH_POINTS[item.tier], itemDone: true });
    const bad = mathMode.validateAnswer(content, i, item.answer + 1, ctx());
    expect(bad).toMatchObject({ correct: false, points: -MATH_WRONG_PENALTY, itemDone: true });
    expect(bad.feedback).toEqual({ correctAnswer: item.answer });
    expect(mathMode.validateAnswer(content, i, 'abc', ctx()).correct).toBe(false);
    expect(mathMode.validateAnswer(content, i, String(item.answer), ctx()).correct).toBe(true);
  });

  it('round score is the sum, never below zero', () => {
    expect(mathMode.scoreRound([{ points: 100 }, { points: -50 }, { points: 150 }])).toBe(200);
    expect(mathMode.scoreRound([{ points: -50 }, { points: -50 }])).toBe(0);
  });

  it('parses only integers', () => {
    expect(parseIntAnswer('42')).toBe(42);
    expect(parseIntAnswer(' -7 ')).toBe(-7);
    expect(parseIntAnswer('4.5')).toBeNull();
    expect(parseIntAnswer('')).toBeNull();
    expect(parseIntAnswer(null)).toBeNull();
  });

  it('bot plays within the time limit and stronger bots score more', () => {
    const avg = (rating: number) => {
      let total = 0;
      for (let s = 0; s < 30; s++) {
        const { events } = mathMode.simulateBot(content, rating, createRng(s));
        for (const e of events) expect(e.t).toBeLessThanOrEqual(mathMode.timeLimit);
        total += mathMode.scoreRound(events);
      }
      return total / 30;
    };
    expect(avg(2000)).toBeGreaterThan(avg(1000));
  });
});
