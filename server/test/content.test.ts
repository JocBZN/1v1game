import { describe, expect, it } from 'vitest';
import { followerQuestions, opinionQuestions, priceQuestions, yearQuestions } from '../src/modes/estimate-data';
import { estimatePoints, yearTolerance } from '../src/modes/estimate';
import { SHAPES, pointInPoly, polyArea, type Pt } from '../src/modes/shapes';
import { EVENTS, timelineMode } from '../src/modes/timeline';
import { createRng } from '../src/rng';

const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const properCross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return ((d1 > 1e-9 && d2 < -1e-9) || (d1 < -1e-9 && d2 > 1e-9)) && ((d3 > 1e-9 && d4 < -1e-9) || (d3 < -1e-9 && d4 > 1e-9));
};

describe('split shapes', () => {
  it('has 200+ shapes with unique ids and names', () => {
    expect(SHAPES.length).toBeGreaterThanOrEqual(217);
    expect(new Set(SHAPES.map((s) => s.id)).size).toBe(SHAPES.length);
    expect(new Set(SHAPES.map((s) => s.name)).size).toBe(SHAPES.length);
  });

  it('every piece is a simple polygon with real area, and pieces never overlap', () => {
    for (const s of SHAPES) {
      for (const p of s.polys) {
        expect(p.length, s.id).toBeGreaterThanOrEqual(3);
        expect(polyArea(p), s.id).toBeGreaterThan(1);
        const n = p.length;
        for (let i = 0; i < n; i++)
          for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            expect(properCross(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n]), `${s.id} self-intersects`).toBe(false);
          }
      }
      if (s.polys.length > 1) {
        for (let x = 1; x < 100; x += 3)
          for (let y = 1; y < 100; y += 3) expect(s.polys.filter((p) => pointInPoly([x, y], p)).length, s.id).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('timeline events', () => {
  it('has 1,000+ events with unique labels and sensible years', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(1_000);
    expect(new Set(EVENTS.map((e) => e.label.toLowerCase())).size).toBe(EVENTS.length);
    for (const e of EVENTS) {
      expect(Number.isInteger(e.year), e.label).toBe(true);
      expect(e.year, e.label).toBeLessThanOrEqual(2026);
      expect(e.year, e.label).toBeGreaterThan(-3000);
      expect(e.year, e.label).not.toBe(0);
    }
  });

  it('rounds still get 4 events at least 3 years apart', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const item of timelineMode.generateRound(createRng(seed)).items) {
        expect(item.events).toHaveLength(4);
        const ys = item.events.map((e) => e.year).sort((a, b) => a - b);
        for (let i = 1; i < 4; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('estimate questions', () => {
  const unique = (qs: { q: string }[]) => new Set(qs.map((x) => x.q.toLowerCase())).size;

  it('year questions span antiquity to today, are unique and score sensibly', () => {
    const qs = yearQuestions();
    expect(qs.length).toBeGreaterThanOrEqual(1_000);
    expect(unique(qs)).toBe(qs.length);
    expect(qs.some((x) => x.answer < -1_000)).toBe(true);
    for (const x of qs) expect(x.answer >= -3000 && x.answer <= 2026 && x.answer !== 0, x.q).toBe(true);
    const input = { kind: 'year', min: -3000, max: 2026 } as const;
    expect(estimatePoints(input, 1990, 1990)).toBe(1000);
    expect(estimatePoints(input, 1990, 2002)).toBe(0);
    expect(yearTolerance(-776)).toBe(60);
    expect(estimatePoints(input, -776, -746)).toBe(500);
  });

  it('opinion, price and follower answers are inside each game’s slider range', () => {
    for (const x of opinionQuestions()) expect(x.answer >= 1 && x.answer <= 1e20, x.q).toBe(true);
    for (const x of priceQuestions()) expect(x.answer >= 0.1 && x.answer <= 1e12, x.q).toBe(true);
    for (const x of followerQuestions()) expect(x.answer >= 1_000 && x.answer <= 1e11, x.q).toBe(true);
    expect(unique(priceQuestions())).toBe(priceQuestions().length);
    expect(unique(followerQuestions())).toBe(followerQuestions().length);
    expect(followerQuestions().length).toBeGreaterThanOrEqual(300);
  });
});
