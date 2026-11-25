import { COLORS, applyMove, applyMoves, goalMax, goalProgress, parseMove, scramble, solvedCube, type CubeGoal, type CubeMove, type Sticker } from '../cube/model';
import { clamp } from '../rng';
import { botSpeedFactor, sumScore, type GameMode, type ReplayEvent, type RoundContent } from './types';

/** Server-side: the scramble is secret. Clients only see sticker states and the goal. */
export interface CubeItem {
  scramble: CubeMove[];
  goal: CubeGoal;
}

export type CubeContent = RoundContent<CubeItem>;

export const CUBE_TIME_MS = 3 * 60_000;
export const CUBE_DONE_POINTS = 2000;
export const CUBE_TIME_BONUS = 1500; // linear over the 3 minutes
export const CUBE_MAX_MOVES = 2000;

const stepPoints = (g: CubeGoal) => (g.kind === 'face' ? 100 : 160);

/** Score of a cube state: progress towards the goal; done = big bonus + time bonus. */
export function cubeScore(stickers: readonly Sticker[], goal: CubeGoal, elapsedMs: number): number {
  const p = goalProgress(stickers, goal);
  if (p >= goalMax(goal)) return CUBE_DONE_POINTS + Math.round(CUBE_TIME_BONUS * clamp(1 - elapsedMs / CUBE_TIME_MS, 0, 1));
  return p * stepPoints(goal);
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

function publicView(goal: CubeGoal, stickers: Sticker[], moves = 0) {
  return { stickers, goal, colorName: COLORS[goal.color], progress: goalProgress(stickers, goal), maxProgress: goalMax(goal), index: 0, total: 1, moves };
}

export const cubeMode: GameMode<CubeContent> = {
  id: 'cube',
  name: 'Rubik’s Cube',
  timeLimit: CUBE_TIME_MS,
  feedbackDelay: 0,

  generateRound(rng) {
    const goal: CubeGoal = { kind: rng.chance(0.5) ? 'face' : 'cross', color: rng.int(0, 5) };
    // Re-scramble until the goal is clearly not already (almost) there.
    let s = scramble(rng, 22);
    for (let i = 0; i < 20 && goalProgress(applyMoves(solvedCube(), s), goal) > goalMax(goal) - 3; i++) s = scramble(rng, 22);
    return { items: [{ scramble: s, goal }] };
  },

  acceptsContent(content) {
    const it = (content as CubeContent)?.items?.[0];
    return !!it?.goal;
  },

  publicItem(content, index) {
    const it = content.items[index];
    return publicView(it.goal, applyMoves(solvedCube(), it.scramble));
  },

  publicItemState(content, index, itemState) {
    const s = state(content, index, itemState);
    return publicView(content.items[index].goal, s.stickers, s.moves);
  },

  /**
   * Each answer is one layer turn. Points are the change in the cube's score, so the running sum of
   * all answers always equals the score of the current state (it can go down if you undo progress).
   */
  validateAnswer(content, index, answer, ctx) {
    const s = state(content, index, ctx.itemState);
    const goal = content.items[index].goal;
    const move = parseMove(answer);
    if (!move || s.moves >= CUBE_MAX_MOVES) {
      return { correct: false, points: 0, itemDone: false, feedback: { rejected: true, progress: goalProgress(s.stickers, goal) } };
    }
    s.stickers = applyMove(s.stickers, move);
    s.moves++;
    const prog = goalProgress(s.stickers, goal);
    const done = prog >= goalMax(goal);
    const next = cubeScore(s.stickers, goal, ctx.elapsedMs);
    const delta = next - s.score;
    s.score = next;
    return { correct: done, points: delta, itemDone: done, feedback: { progress: prog, solved: done, moves: s.moves } };
  },

  timeoutFeedback() {
    return {};
  },

  scoreRound: sumScore,

  /** Bot: makes steady progress; whether it finishes (and when) depends on its rating. */
  simulateBot(content, rating, rng) {
    const goal = content.items[0].goal;
    const max = goalMax(goal);
    const step = stepPoints(goal);
    const start = goalProgress(applyMoves(solvedCube(), content.items[0].scramble), goal);
    const doneChance = clamp((goal.kind === 'cross' ? 0.6 : 0.4) + (rating - 1500) * 0.0008, 0.1, 0.92);
    const finishes = rng.chance(doneChance);
    const speed = botSpeedFactor(rating);
    const doneAt = finishes ? clamp(rng.normal(95_000 * speed, 25_000), 30_000, CUBE_TIME_MS - 5_000) : Infinity;
    const plateau = clamp(start + rng.int(1, Math.max(1, max - start - 1)), start, max - 1);

    const events: ReplayEvent[] = [];
    let t = 3_000;
    let score = 0;
    while (t < Math.min(doneAt, CUBE_TIME_MS - 1_000)) {
      const target = finishes ? start + (max - 1 - start) * Math.min(1, t / doneAt) : start + (plateau - start) * Math.min(1, t / (CUBE_TIME_MS * 0.7));
      const prog = clamp(Math.round(target), 0, max - 1);
      const next = prog * step;
      if (next !== score) {
        events.push({ t: Math.round(t), item: 0, points: next - score, correct: false, done: false });
        score = next;
      }
      t += clamp(rng.normal(5_000 * speed, 1_500), 1_500, 10_000);
    }
    if (finishes) {
      const final = CUBE_DONE_POINTS + Math.round(CUBE_TIME_BONUS * (1 - doneAt / CUBE_TIME_MS));
      events.push({ t: Math.round(doneAt), item: 0, points: final - score, correct: true, done: true });
      return { events, durationMs: Math.round(doneAt) };
    }
    return { events, durationMs: CUBE_TIME_MS };
  },
};
