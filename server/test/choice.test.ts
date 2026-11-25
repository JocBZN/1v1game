import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';
import { speedPoints, parseChoice } from '../src/modes/scoring';
import { TRIVIA_CATEGORIES, loadQuestions, triviaMode } from '../src/modes/trivia';
import { flagEmoji, flagsMode, loadCountries } from '../src/modes/flags';

const ctx = (elapsedMs: number) => ({ elapsedMs, itemState: {} });

describe('speedPoints (trivia & flags)', () => {
  it('base points grow with the stars, plus up to 50 % for speed', () => {
    expect(speedPoints(true, 0, 10_000, 3)).toBe(975);
    expect(speedPoints(true, 10_000, 10_000, 1)).toBe(350);
    expect(speedPoints(true, 0, 10_000, 5)).toBe(1425);
    expect(speedPoints(true, 5_000, 10_000, 3)).toBe(813);
    expect(speedPoints(true, 10_000, 10_000, 3)).toBe(650);
    expect(speedPoints(true, 2_500, 10_000)).toBeGreaterThan(speedPoints(true, 7_500, 10_000));
  });
  it('wrong or late answers score 0', () => {
    expect(speedPoints(false, 100, 10_000)).toBe(0);
    expect(speedPoints(true, 10_001, 10_000)).toBe(0);
  });
  it('parses option indexes strictly', () => {
    expect(parseChoice(2, 4)).toBe(2);
    expect(parseChoice(4, 4)).toBeNull();
    expect(parseChoice('1', 4)).toBeNull();
    expect(parseChoice(1.5, 4)).toBeNull();
  });
});

describe('questions.json', () => {
  const qs = loadQuestions();
  it('has 1200+ questions across 12 categories, at least 90 each', () => {
    expect(qs.length).toBeGreaterThanOrEqual(1200);
    expect(TRIVIA_CATEGORIES).toHaveLength(12);
    for (const c of TRIVIA_CATEGORIES) expect(qs.filter((q) => q.cat === c).length, c).toBeGreaterThanOrEqual(90);
  });
  it('never lists the right answer among the wrong ones (case-insensitive)', () => {
    for (const q of qs) {
      const opts = [q.correct, ...q.wrong].map((o) => o.trim().toLowerCase());
      expect(new Set(opts).size, q.id).toBe(4);
    }
  });
  it('is all in English (no Romanian-only question text)', () => {
    for (const q of qs) expect(q.q, q.id).not.toMatch(/\b(Care|Cine|Câte|Ce |În ce)\b/);
  });
  it('is well formed: unique ids, 4 distinct options, difficulty 1–3', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    expect(new Set(qs.map((q) => q.q)).size).toBe(qs.length);
    for (const q of qs) {
      expect(TRIVIA_CATEGORIES).toContain(q.cat);
      expect([1, 2, 3]).toContain(q.difficulty);
      expect(q.wrong).toHaveLength(3);
      expect(new Set([q.correct, ...q.wrong]).size).toBe(4);
      expect(q.q.trim().length).toBeGreaterThan(10);
    }
  });
});

describe('trivia mode', () => {
  const content = triviaMode.generateRound(createRng(7));
  it('5 questions from 5 different categories', () => {
    expect(content.items).toHaveLength(5);
    expect(new Set(content.items.map((i) => i.cat)).size).toBe(5);
  });
  it('public item never contains the answer', () => {
    const pub = triviaMode.publicItem(content, 0) as Record<string, unknown>;
    expect(pub).not.toHaveProperty('answer');
    expect(JSON.stringify(pub)).not.toMatch(/"(answer|correct|qid)"/);
  });
  it('scores correct answers by speed, wrong ones 0, and reveals the right option after answering', () => {
    const it0 = content.items[0];
    const ok = triviaMode.validateAnswer(content, 0, it0.answer, ctx(2_000));
    expect(ok).toMatchObject({ correct: true, points: speedPoints(true, 2_000, 10_000, it0.stars), itemDone: true });
    const wrongIdx = (it0.answer + 1) % 4;
    const bad = triviaMode.validateAnswer(content, 0, wrongIdx, ctx(2_000));
    expect(bad).toMatchObject({ correct: false, points: 0, itemDone: true });
    expect(bad.feedback).toMatchObject({ correctIndex: it0.answer, chosen: wrongIdx });
    expect(triviaMode.scoreRound([{ points: 900 }, { points: 0 }, { points: 650 }])).toBe(1550);
  });
  it('bot ≈ 65% accuracy at 1500, answering in 4–6 s on average', () => {
    let correct = 0;
    let n = 0;
    let time = 0;
    for (let s = 0; s < 400; s++) {
      const c = triviaMode.generateRound(createRng(s));
      const { events } = triviaMode.simulateBot(c, 1500, createRng(1000 + s));
      let prevEnd = 0;
      for (const e of events) {
        n++;
        if (e.correct) correct++;
        time += e.t - prevEnd;
        prevEnd = e.t + triviaMode.feedbackDelay;
      }
    }
    expect(correct / n).toBeGreaterThan(0.55);
    expect(correct / n).toBeLessThan(0.8);
    expect(time / n).toBeGreaterThan(4_000);
    expect(time / n).toBeLessThan(6_000);
  });
});

describe('flags mode', () => {
  it('country data is unique and makes valid flag emoji', () => {
    const cs = loadCountries();
    expect(new Set(cs.map((c) => c.code)).size).toBe(cs.length);
    expect(new Set(cs.map((c) => c.name)).size).toBe(cs.length);
    expect(cs.length).toBeGreaterThanOrEqual(190);
    for (const c of cs) {
      expect(c.code, c.name).toMatch(/^[A-Z]{2}$/);
      expect(['europe', 'asia', 'africa', 'americas', 'oceania'], c.code).toContain(c.region);
    }
    expect(flagEmoji('RO')).toBe('🇷🇴');
  });
  it('puts at most 3 lesser-known flags in a round, 8 distinct countries', () => {
    const rare = new Set(loadCountries().filter((c) => c.rare).map((c) => c.code));
    let sawRare = false;
    for (let s = 0; s < 200; s++) {
      const { items } = flagsMode.generateRound(createRng(s));
      expect(new Set(items.map((i) => i.code)).size).toBe(8);
      const n = items.filter((i) => rare.has(i.code)).length;
      expect(n).toBeLessThanOrEqual(3);
      if (n) sawRare = true;
    }
    expect(sawRare).toBe(true);
  });
  it('8 flags, 4 distinct options each, answer hidden', () => {
    const content = flagsMode.generateRound(createRng(3));
    expect(content.items).toHaveLength(8);
    for (let i = 0; i < 8; i++) {
      const it = content.items[i];
      expect(new Set(it.options).size).toBe(4);
      const pub = flagsMode.publicItem(content, i) as Record<string, unknown>;
      expect(Object.keys(pub).sort()).toEqual(['flag', 'index', 'options', 'stars', 'total']);
    }
  });
  it('uses a 6 s timer for the speed bonus', () => {
    const content = flagsMode.generateRound(createRng(3));
    const r = flagsMode.validateAnswer(content, 0, content.items[0].answer, ctx(3_000));
    expect(r.points).toBe(speedPoints(true, 3_000, 6_000, content.items[0].stars));
  });
});
