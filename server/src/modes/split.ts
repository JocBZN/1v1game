import { SHAPES, cutRegion, placeShape, regionShare, thinStroke, type Poly, type Pt } from './shapes';
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

/** Longest stroke accepted (points after thinning); a fast scribble across the board is ~150. */
export const MAX_STROKE_POINTS = 400;

/**
 * A cut drawn with the mouse or a finger: `{ pts: [[x, y], …] }` in board units (0..100).
 * The older straight-line answer `{ x1, y1, x2, y2 }` is still accepted as a two-point stroke.
 */
export function parseStroke(x: unknown): Pt[] | null {
  if (!x || typeof x !== 'object') return null;
  const raw = (x as { pts?: unknown }).pts;
  if (raw === undefined) return parseLine(x);
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 4 * MAX_STROKE_POINTS) return null;
  const pts: Pt[] = [];
  for (const q of raw) {
    if (!Array.isArray(q) || q.length !== 2 || !isNum(q[0]) || !isNum(q[1])) return null;
    if (Math.abs(q[0]) > 1000 || Math.abs(q[1]) > 1000) return null;
    pts.push([q[0], q[1]]);
  }
  const stroke = thinStroke(pts);
  if (stroke.length < 2 || stroke.length > MAX_STROKE_POINTS) return null;
  let len = 0;
  for (let i = 1; i < stroke.length; i++) len += Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]);
  return len >= 2 ? stroke : null;
}

/** Share of the shape on one side of a drawn cut. */
export function strokeShare(polys: readonly Poly[], stroke: readonly Pt[]): number {
  return regionShare(polys, cutRegion(stroke));
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
    const stroke = parseStroke(answer);
    if (!stroke) return { correct: false, points: 0, itemDone: true, feedback: { share: null } };
    const share = strokeShare(content.items[index].polys, stroke);
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
