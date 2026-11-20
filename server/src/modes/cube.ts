import { applyMove, applyMoves, isSolved, parseMove, progress, scramble, solvedCube, type CubeMove, type Sticker } from '../cube/model';
import { clamp } from '../rng';
import { botSpeedFactor, sumScore, type GameMode, type ReplayEvent, type RoundContent } from './types';

/** Server-side: the scramble is secret (it's the solution backwards). Clients only see sticker states. */
export interface CubeItem {
  scramble: CubeMove[];
}

export type CubeContent = RoundContent<CubeItem>;

export const CUBE_TIME_MS = 5 * 60_000;
export const CUBE_PROGRESS_POINTS = 20; // per matching sticker (max 48 → 960)
export const CUBE_SOLVE_POINTS = 3000;
export const CUBE_TIME_BONUS = 2000; // linear over the 5 minutes
export const CUBE_MAX_MOVES = 3000;

/** Score of a cube state: progress while unsolved; solved = big bonus + time bonus. */
export function cubeScore(stickers: readonly Sticker[], elapsedMs: number): number {
  if (isSolved(stickers)) {
    return CUBE_SOLVE_POINTS + Math.round(CUBE_TIME_BONUS * clamp(1 - elapsedMs / CUBE_TIME_MS, 0, 1));
  }
  return progress(stickers) * CUBE_PROGRESS_POINTS;
}

interface CubeState {
  stickers: Sticker[];
  score: number;
  moves: number;
}

function state(content: CubeContent, index: number, itemState: Record<string, unknown>): CubeState {
  if (!itemState.cube) {
    const stickers = applyMoves(solvedCube(), content.items[index].scramble);
    // `score` is what this player's round score already includes: nothing until the first move.
    itemState.cube = { stickers, score: 0, moves: 0 } satisfies CubeState;
  }
  return itemState.cube as CubeState;
}

export const cubeMode: GameMode<CubeContent> = {
  id: 'cube',
  name: 'Rubik’s Cube',
  timeLimit: CUBE_TIME_MS,
  feedbackDelay: 0,

  generateRound(rng) {
    return { items: [{ scramble: scramble(rng, 25) }] };
  },

  publicItem(content, index) {
    const stickers = applyMoves(solvedCube(), content.items[index].scramble);
    return { stickers, progress: progress(stickers), maxProgress: 48, index, total: 1 };
  },

  publicItemState(content, index, itemState) {
    const s = state(content, index, itemState);
    return { stickers: s.stickers, progress: progress(s.stickers), maxProgress: 48, index, total: 1, moves: s.moves };
  },

  /**
   * Each answer is one layer turn. Points are the change in the cube's score, so the running sum of
   * all answers always equals the score of the current state (it can go down if you scramble it more).
   */
  validateAnswer(content, index, answer, ctx) {
    const s = state(content, index, ctx.itemState);
    const move = parseMove(answer);
    if (!move || s.moves >= CUBE_MAX_MOVES) {
      return { correct: false, points: 0, itemDone: false, feedback: { rejected: true, progress: progress(s.stickers) } };
    }
    s.stickers = applyMove(s.stickers, move);
    s.moves++;
    const solved = isSolved(s.stickers);
    const next = cubeScore(s.stickers, ctx.elapsedMs);
    const delta = next - s.score;
    s.score = next;
    return {
      correct: solved,
      points: delta,
      itemDone: solved,
      feedback: { progress: progress(s.stickers), solved, moves: s.moves },
    };
  },

  timeoutFeedback() {
    return {};
  },

  scoreRound: sumScore,

  /** Bot: makes steady progress; whether it solves (and when) depends on its rating. */
  simulateBot(content, rating, rng) {
    const start = progress(applyMoves(solvedCube(), content.items[0].scramble));
    const solveChance = clamp(0.15 + (rating - 1500) * 0.0008, 0.03, 0.8);
    const solves = rng.chance(solveChance);
    const speed = botSpeedFactor(rating);
    const solveAt = solves ? clamp(rng.normal(200_000 * speed, 40_000), 70_000, CUBE_TIME_MS - 5_000) : Infinity;
    const plateau = clamp(start + rng.int(6, 26), start, 44);

    const events: ReplayEvent[] = [];
    let t = 2_000;
    let score = 0;
    let prog = start;
    while (t < Math.min(solveAt, CUBE_TIME_MS - 1_000)) {
      const target = solves ? start + (48 - start) * Math.min(1, t / solveAt) * 0.9 : start + (plateau - start) * Math.min(1, t / (CUBE_TIME_MS * 0.8));
      prog = clamp(Math.round(target + rng.int(-2, 2)), 0, 44);
      const next = prog * CUBE_PROGRESS_POINTS;
      if (next !== score) {
        events.push({ t: Math.round(t), item: 0, points: next - score, correct: false, done: false });
        score = next;
      }
      t += clamp(rng.normal(4_000 * speed, 1_500), 1_200, 9_000);
    }
    if (solves) {
      const final = CUBE_SOLVE_POINTS + Math.round(CUBE_TIME_BONUS * (1 - solveAt / CUBE_TIME_MS));
      events.push({ t: Math.round(solveAt), item: 0, points: final - score, correct: true, done: true });
      return { events, durationMs: Math.round(solveAt) };
    }
    return { events, durationMs: CUBE_TIME_MS };
  },
};
