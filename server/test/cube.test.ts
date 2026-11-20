import { describe, expect, it } from 'vitest';
import {
  applyMove, applyMoves, inverse, isSolved, parseMove, progress, rotateVec, scramble, solvedCube, type CubeMove,
} from '../src/cube/model';
import { CUBE_PROGRESS_POINTS, CUBE_SOLVE_POINTS, CUBE_TIME_MS, cubeMode, cubeScore } from '../src/modes/cube';
import { createRng } from '../src/rng';

const R: CubeMove = { axis: 'x', layer: 1, dir: 1 };
const U: CubeMove = { axis: 'y', layer: 1, dir: 1 };
const M: CubeMove = { axis: 'x', layer: 0, dir: 1 };

const ctx = (elapsedMs = 1000, itemState: Record<string, unknown> = {}) => ({ elapsedMs, itemState });

describe('cube model', () => {
  it('a solved cube has 54 stickers, 9 per face, and is solved', () => {
    const c = solvedCube();
    expect(c).toHaveLength(54);
    expect(isSolved(c)).toBe(true);
    expect(progress(c)).toBe(48);
  });

  it('rotations are proper quarter turns', () => {
    expect(rotateVec([0, 1, 0], 'x', 1)).toEqual([0, 0, 1]);
    expect(rotateVec([0, 0, 1], 'y', 1)).toEqual([1, 0, 0]);
    expect(rotateVec([1, 0, 0], 'z', 1)).toEqual([0, 1, 0]);
    expect(rotateVec(rotateVec([1, 2, 3], 'x', 1), 'x', -1)).toEqual([1, 2, 3]);
  });

  it('four identical turns, or a turn and its inverse, bring the cube back', () => {
    for (const m of [R, U, M]) {
      const once = applyMove(solvedCube(), m);
      expect(isSolved(once)).toBe(false);
      expect(isSolved(applyMoves(solvedCube(), [m, m, m, m]))).toBe(true);
      expect(isSolved(applyMove(once, inverse(m)))).toBe(true);
    }
  });

  it('known group orders: (R U R′ U′) has order 6, (R U) has order 105', () => {
    const sexy = [R, U, inverse(R), inverse(U)];
    const six = Array.from({ length: 6 }, () => sexy).flat();
    expect(isSolved(applyMoves(solvedCube(), six))).toBe(true);
    expect(isSolved(applyMoves(solvedCube(), six.slice(0, 20)))).toBe(false);
    const ru = (n: number) => Array.from({ length: n }, () => [R, U]).flat();
    expect(isSolved(applyMoves(solvedCube(), ru(105)))).toBe(true);
    expect(isSolved(applyMoves(solvedCube(), ru(35)))).toBe(false);
    expect(isSolved(applyMoves(solvedCube(), ru(21)))).toBe(false);
  });

  it('every face keeps 9 stickers after any moves', () => {
    const c = applyMoves(solvedCube(), scramble(createRng(5), 40));
    const counts = new Map<string, number>();
    for (const s of c) counts.set(s.n.join(), (counts.get(s.n.join()) ?? 0) + 1);
    expect([...counts.values()]).toEqual([9, 9, 9, 9, 9, 9]);
  });

  it('a scramble is undone by its inverse in reverse order', () => {
    const s = scramble(createRng(9), 25);
    expect(s).toHaveLength(25);
    const mixed = applyMoves(solvedCube(), s);
    expect(isSolved(mixed)).toBe(false);
    expect(progress(mixed)).toBeLessThan(48);
    const undo = [...s].reverse().map(inverse);
    expect(isSolved(applyMoves(mixed, undo))).toBe(true);
  });

  it('parses only valid moves', () => {
    expect(parseMove({ axis: 'y', layer: -1, dir: -1 })).toEqual({ axis: 'y', layer: -1, dir: -1 });
    expect(parseMove({ axis: 'w', layer: 1, dir: 1 })).toBeNull();
    expect(parseMove({ axis: 'x', layer: 2, dir: 1 })).toBeNull();
    expect(parseMove({ axis: 'x', layer: 1, dir: 2 })).toBeNull();
    expect(parseMove('R')).toBeNull();
  });
});

describe('cube mode', () => {
  const content = cubeMode.generateRound(createRng(3));
  const scr = content.items[0].scramble;

  it('the client gets the scrambled stickers but never the scramble moves', () => {
    const pub = cubeMode.publicItem(content, 0) as Record<string, unknown>;
    expect(pub).not.toHaveProperty('scramble');
    expect(JSON.stringify(pub)).not.toMatch(/"axis"|"layer"|"dir"/);
    expect((pub.stickers as unknown[]).length).toBe(54);
  });

  it('scoring: progress while unsolved, big bonus + time bonus when solved', () => {
    expect(cubeScore(applyMove(solvedCube(), R), 0)).toBe(progress(applyMove(solvedCube(), R)) * CUBE_PROGRESS_POINTS);
    expect(cubeScore(solvedCube(), 0)).toBe(CUBE_SOLVE_POINTS + 2000);
    expect(cubeScore(solvedCube(), CUBE_TIME_MS)).toBe(CUBE_SOLVE_POINTS);
    expect(cubeScore(solvedCube(), CUBE_TIME_MS / 2)).toBe(CUBE_SOLVE_POINTS + 1000);
  });

  it('solving it for real: replaying the inverse scramble move by move ends the round with a solve', () => {
    const itemState: Record<string, unknown> = {};
    const undo = [...scr].reverse().map(inverse);
    let sum = 0;
    let last;
    for (let i = 0; i < undo.length; i++) {
      last = cubeMode.validateAnswer(content, 0, undo[i], ctx(60_000, itemState));
      sum += last.points;
      if (i < undo.length - 1) expect(last.itemDone).toBe(false);
    }
    expect(last).toMatchObject({ correct: true, itemDone: true, feedback: { solved: true, progress: 48 } });
    // Sum of deltas == score of the final state.
    expect(sum).toBe(cubeScore(solvedCube(), 60_000));
    expect(cubeMode.scoreRound([{ points: sum }])).toBe(sum);
  });

  it('points always add up to the current state’s score, even when making it worse', () => {
    const itemState: Record<string, unknown> = {};
    const rng = createRng(11);
    let sum = 0;
    let stickers = applyMoves(solvedCube(), scr);
    for (let i = 0; i < 30; i++) {
      const m: CubeMove = { axis: rng.pick(['x', 'y', 'z'] as const), layer: rng.pick([-1, 0, 1] as const), dir: rng.pick([1, -1] as const) };
      sum += cubeMode.validateAnswer(content, 0, m, ctx(1000, itemState)).points;
      stickers = applyMove(stickers, m);
      expect(sum).toBe(cubeScore(stickers, 1000));
    }
  });

  it('rejects malformed moves without changing anything', () => {
    const itemState: Record<string, unknown> = {};
    const r = cubeMode.validateAnswer(content, 0, { axis: 'q' }, ctx(1000, itemState));
    expect(r).toMatchObject({ points: 0, itemDone: false, feedback: { rejected: true } });
  });

  it('reconnect view shows the current state', () => {
    const itemState: Record<string, unknown> = {};
    cubeMode.validateAnswer(content, 0, R, ctx(1000, itemState));
    const view = cubeMode.publicItemState!(content, 0, itemState) as { stickers: unknown; moves: number };
    expect(view.moves).toBe(1);
    expect(view.stickers).toEqual(applyMove(applyMoves(solvedCube(), scr), R));
  });

  it('bot: stays within 5 minutes, strong bots solve more often', () => {
    const solveRate = (rating: number) => {
      let solved = 0;
      for (let s = 0; s < 200; s++) {
        const { events } = cubeMode.simulateBot(content, rating, createRng(s));
        for (const e of events) expect(e.t).toBeLessThanOrEqual(CUBE_TIME_MS);
        if (events.some((e) => e.done)) solved++;
      }
      return solved / 200;
    };
    expect(solveRate(2000)).toBeGreaterThan(solveRate(1200));
  });
});
