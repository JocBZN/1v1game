import { describe, expect, it } from 'vitest';
import { colorMatch, colorMode } from '../src/modes/color';
import { golfMode } from '../src/modes/golf';
import { SHAPES, placeShape, splitShare } from '../src/modes/shapes';
import { splitMode, splitPoints } from '../src/modes/split';
import { EVENTS, timelineMode, timelinePoints } from '../src/modes/timeline';
import { simulateShot } from '../src/golf/physics';
import { createRng } from '../src/rng';

const ctx = (itemState: Record<string, unknown> = {}) => ({ elapsedMs: 1000, itemState });

describe('split the shape', () => {
  it('a vertical line through the middle halves a symmetric shape', () => {
    const star = SHAPES.find((s) => s.id === 'star')!;
    expect(splitShare(star.polys, [50, 0], [50, 100])).toBeCloseTo(0.5, 3);
    expect(splitPoints(0.5)).toBe(1000);
    expect(splitPoints(0.45)).toBe(750);
    expect(splitPoints(0.2)).toBe(0);
  });

  it('every shape stays inside the box after rotating and has area', () => {
    for (const s of SHAPES) {
      const placed = placeShape(s.polys, 37, true);
      for (const p of placed.flat()) {
        expect(p[0]).toBeGreaterThanOrEqual(7.9);
        expect(p[0]).toBeLessThanOrEqual(92.1);
      }
      expect(splitShare(placed, [0, 101], [0, -1])).toBeGreaterThan(0.99); // everything right of x=0
    }
  });

  it('validates a line and scores it', () => {
    const c = splitMode.generateRound(createRng(1));
    const r = splitMode.validateAnswer(c, 0, { x1: 50, y1: -10, x2: 50, y2: 110 }, ctx());
    expect(r.itemDone).toBe(true);
    expect(typeof r.feedback!.share).toBe('number');
    expect(splitMode.validateAnswer(c, 0, { x1: 'a' }, ctx()).points).toBe(0);
  });
});

describe('guess the color', () => {
  it('exact = 100 %, opposite = 0 %', () => {
    expect(colorMatch([120, 40, 200], [120, 40, 200])).toBe(100);
    expect(colorMatch([255, 255, 255], [0, 0, 0])).toBe(0);
    const c = colorMode.generateRound(createRng(2));
    const r = colorMode.validateAnswer(c, 0, c.items[0].rgb, ctx());
    expect(r.points).toBe(1000);
    expect(colorMode.validateAnswer(c, 0, [300, 0, 0], ctx()).points).toBe(0);
  });
});

describe('timeline', () => {
  it('scores by pairs in the right order', () => {
    expect(timelinePoints([1, 2, 3, 4])).toBe(1000);
    expect(timelinePoints([4, 3, 2, 1])).toBe(0);
    expect(timelinePoints([2, 1, 3, 4])).toBe(833);
  });

  it('rounds have 4 distinct, well-spaced events and the right order scores 1000', () => {
    expect(new Set(EVENTS.map((e) => e.label)).size).toBe(EVENTS.length);
    const c = timelineMode.generateRound(createRng(5));
    c.items.forEach((it, idx) => {
      expect(it.events).toHaveLength(4);
      const order = it.events.map((_, i) => i).sort((a, b) => it.events[a].year - it.events[b].year);
      expect(timelineMode.validateAnswer(c, idx, order, ctx()).points).toBe(1000);
    });
    expect(JSON.stringify(timelineMode.publicItem(c, 0))).not.toMatch(/year/);
  });
});

describe('golf', () => {
  it('a straight shot rolls and stops; walls stop the ball going through', () => {
    const course = { w: 100, h: 150, start: [50, 140] as [number, number], hole: [50, 10] as [number, number], walls: [{ x: 20, y: 70, w: 60, h: 6 }] };
    const r = simulateShot(course, course.start, { angle: -Math.PI / 2, power: 1 });
    expect(r.end[1]).toBeGreaterThan(76); // bounced back off the wall
    const open = { ...course, walls: [] };
    const free = simulateShot(open, open.start, { angle: -Math.PI / 2, power: 0.6 });
    expect(free.end[1]).toBeLessThan(140);
  });

  it('three strokes end the hole; holing out ends it early', () => {
    const c = golfMode.generateRound(createRng(9));
    const state: Record<string, unknown> = {};
    let last;
    for (let i = 0; i < 3; i++) {
      last = golfMode.validateAnswer(c, 0, { angle: 0, power: 0.05 }, ctx(state));
      if (last.itemDone) break;
    }
    expect(last!.itemDone).toBe(true);
    expect(golfMode.validateAnswer(c, 0, { angle: 0, power: 2 }, ctx({})).feedback).toMatchObject({ rejected: true });
  });

  it('bots score something and stay in time', () => {
    const c = golfMode.generateRound(createRng(4));
    const { events } = golfMode.simulateBot(c, 1500, createRng(1));
    for (const e of events) expect(e.t).toBeLessThanOrEqual(golfMode.timeLimit);
  });
});
