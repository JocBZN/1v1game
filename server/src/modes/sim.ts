import { clamp, type Rng } from '../rng';
import { botAccuracy, botSpeedFactor, type ReplayEvent } from './types';

/**
 * Bot play for "one answer per item" modes: for each item the bot thinks for a while (scaled by its
 * speed), then scores `quality ∈ [0,1]` of the item's maximum. `points(i, quality)` maps that to points.
 */
export function simulateItemBot(opts: {
  count: number;
  rating: number;
  rng: Rng;
  itemTimeLimit: number;
  feedbackDelay: number;
  roundLimit: number;
  /** typical thinking time for a 1500 player */
  thinkMs: number;
  points: (index: number, quality: number) => number;
}): { events: ReplayEvent[]; durationMs: number } {
  const { rng } = opts;
  const speed = botSpeedFactor(opts.rating);
  const skill = botAccuracy(opts.rating); // ~0.65 at 1500
  const events: ReplayEvent[] = [];
  let t = 0;
  for (let i = 0; i < opts.count; i++) {
    const think = clamp(rng.normal(opts.thinkMs * speed, opts.thinkMs * 0.25), 900, opts.itemTimeLimit - 200);
    if (t + think > opts.roundLimit - 100) break;
    t += think;
    const quality = clamp(rng.normal(skill + 0.1, 0.18), 0, 1);
    const pts = Math.round(opts.points(i, quality));
    events.push({ t: Math.round(t), item: i, points: pts, correct: quality > 0.75, done: true });
    t += opts.feedbackDelay;
  }
  return { events, durationMs: Math.min(Math.round(t), opts.roundLimit) };
}

export const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
