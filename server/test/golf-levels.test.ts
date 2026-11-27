import { describe, expect, it } from 'vitest';
import { BALL_R, HOLE_R } from '../src/golf/physics';
import { generateCourse, generateRoundCourses, greedyStrokes, type Difficulty } from '../src/golf/levels';
import { golfMode } from '../src/modes/golf';
import { createRng } from '../src/rng';

const inside = (r: { x: number; y: number; w: number; h: number }, p: [number, number], pad: number) =>
  p[0] > r.x - pad && p[0] < r.x + r.w + pad && p[1] > r.y - pad && p[1] < r.y + r.h + pad;

describe('golf levels', () => {
  it('every course is inside the board, keeps tee and hole clear, and can be finished in 3 shots', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const course of generateRoundCourses(createRng(seed))) {
        expect(course.w).toBe(100);
        expect(course.h).toBe(150);
        for (const r of course.walls) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(100.01);
          expect(inside(r, course.start, BALL_R)).toBe(false);
          expect(inside(r, course.hole, HOLE_R)).toBe(false);
        }
        expect(greedyStrokes(course, 3)).toBeLessThanOrEqual(3);
      }
    }
  });

  it('hard holes have more going on than easy ones', () => {
    const walls = (d: Difficulty) => {
      let n = 0;
      for (let seed = 1; seed <= 30; seed++) n += generateCourse(createRng(seed), d).walls.length;
      return n / 30;
    };
    expect(walls('hard')).toBeGreaterThan(walls('easy'));
  });

  it('rounds are random and repeatable from the seed', () => {
    const a = JSON.stringify(generateRoundCourses(createRng(7)));
    expect(JSON.stringify(generateRoundCourses(createRng(7)))).toBe(a);
    expect(JSON.stringify(generateRoundCourses(createRng(8)))).not.toBe(a);
  });

  it('the bot plays every hole of a round', () => {
    const rng = createRng(11);
    const content = golfMode.generateRound(rng);
    const { events } = golfMode.simulateBot(content, 1500, rng);
    expect(events.length).toBe(3);
  });
});
