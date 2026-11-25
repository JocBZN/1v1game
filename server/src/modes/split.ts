import { SHAPES, placeShape, splitShare, type Poly, type Pt } from './shapes';
import { isNum, simulateItemBot } from './sim';
import { sumScore, type GameMode, type RoundContent } from './types';

export interface SplitItem {
  name: string;
  polys: Poly[];
}
export type SplitContent = RoundContent<SplitItem>;

export const SPLIT_ITEMS = 5;
export const SPLIT_ITEM_MS = 10_000;
const FEEDBACK_MS = 2_200;

/** 50/50 = 1000 points, 45/55 = 750, 40/60 = 500, 30/70 or worse = 0. */
export function splitPoints(share: number): number {
  const off = Math.abs(share - 0.5) * 100;
  return Math.round(1000 * Math.max(0, 1 - off / 20));
}

export function parseLine(x: unknown): [Pt, Pt] | null {
  if (!x || typeof x !== 'object') return null;
  const { x1, y1, x2, y2 } = x as Record<string, unknown>;
  if (![x1, y1, x2, y2].every((v) => isNum(v) && Math.abs(v as number) < 1000)) return null;
  const a: Pt = [x1 as number, y1 as number];
  const b: Pt = [x2 as number, y2 as number];
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2) return null;
  return [a, b];
}

export const splitMode: GameMode<SplitContent> = {
  id: 'split',
  name: 'Split the shape',
  itemTimeLimit: SPLIT_ITEM_MS,
  feedbackDelay: FEEDBACK_MS,
  timeLimit: SPLIT_ITEMS * (SPLIT_ITEM_MS + FEEDBACK_MS) + 1_000,

  generateRound(rng) {
    const items = rng.shuffle(SHAPES).slice(0, SPLIT_ITEMS).map((s) => ({
      name: s.name,
      polys: placeShape(s.polys, rng.int(0, 359), rng.chance(0.5)),
    }));
    return { items };
  },

  publicItem(content, index) {
    const it = content.items[index];
    return { name: it.name, polys: it.polys, index, total: content.items.length };
  },

  validateAnswer(content, index, answer) {
    const line = parseLine(answer);
    if (!line) return { correct: false, points: 0, itemDone: true, feedback: { share: null } };
    const share = splitShare(content.items[index].polys, line[0], line[1]);
    const points = splitPoints(share);
    return { correct: points >= 750, points, itemDone: true, feedback: { share } };
  },

  timeoutFeedback() {
    return { share: null };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    return simulateItemBot({
      count: content.items.length, rating, rng, itemTimeLimit: SPLIT_ITEM_MS, feedbackDelay: FEEDBACK_MS,
      roundLimit: this.timeLimit, thinkMs: 4_500,
      points: (_i, q) => splitPoints(0.5 + (1 - q) * 0.2 * (rng.chance(0.5) ? 1 : -1)),
    });
  },
};
