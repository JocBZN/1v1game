import { describe, expect, it } from 'vitest';
import { SHAPES, placeShape, splitShare, type Pt } from '../src/modes/shapes';
import { parseStroke, splitMode, strokeShare } from '../src/modes/split';
import { createRng } from '../src/rng';

const square: Pt[][] = [[[10, 10], [90, 10], [90, 90], [10, 90]]];
const half = (s: number) => Math.min(s, 1 - s);

describe('split the shape: freehand cuts', () => {
  it('a straight stroke gives the same split as the old straight line', () => {
    for (const shape of SHAPES.filter((_, i) => i % 8 === 0)) { // a sample: every 8th shape
      const polys = placeShape(shape.polys, 37, false);
      const a: Pt = [20, 5];
      const b: Pt = [70, 95];
      expect(half(strokeShare(polys, [a, b]))).toBeCloseTo(half(splitShare(polys, a, b)), 2);
    }
  });

  it('measures a bent cut: an L that cuts off one quarter of a square', () => {
    const l: Pt[] = [[50, 0], [50, 50], [100, 50]];
    expect(half(strokeShare(square, l))).toBeCloseTo(0.25, 2);
  });

  it('measures a curved cut through the middle', () => {
    const wave: Pt[] = [];
    for (let x = 0; x <= 100; x += 2) wave.push([x, 50 + 12 * Math.sin((x / 100) * Math.PI * 2)]);
    // The wave's bumps above and below the middle cancel out: still 50/50.
    expect(strokeShare(square, wave)).toBeCloseTo(0.5, 2);
  });

  it('a stroke that stops inside the shape is extended along its direction', () => {
    expect(half(strokeShare(square, [[50, 0], [50, 30]]))).toBeCloseTo(0.5, 2);
  });

  it('parses strokes and rejects junk', () => {
    expect(parseStroke({ pts: [[0, 0], [10, 10], [20, 20]] })).toHaveLength(3);
    expect(parseStroke({ x1: 50, y1: 0, x2: 50, y2: 100 })).toHaveLength(2); // old clients
    expect(parseStroke({ pts: [[0, 0]] })).toBeNull();
    expect(parseStroke({ pts: [[0, 0], [0.5, 0.5]] })).toBeNull(); // too short
    expect(parseStroke({ pts: [[0, 0], ['a', 1]] })).toBeNull();
    expect(parseStroke({ pts: Array.from({ length: 5000 }, (_, i) => [i % 100, i % 7]) })).toBeNull();
  });

  it('scores a drawn answer and stays fast', () => {
    const c = splitMode.generateRound(createRng(3));
    const pts: Pt[] = [];
    for (let y = -5; y <= 105; y += 0.5) pts.push([50 + 3 * Math.sin(y / 9), y]);
    const t = performance.now();
    const r = splitMode.validateAnswer(c, 0, { pts }, {} as never);
    expect(performance.now() - t).toBeLessThan(1_000);
    expect(r.points).toBeGreaterThanOrEqual(0);
    expect(typeof r.feedback?.share).toBe('number');
  });
});
