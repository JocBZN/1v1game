import type { DomainId } from '../domains';
import type { Rng } from '../rng';

/**
 * Server-side content of one round. It contains the correct answers and NEVER leaves the server
 * as-is: clients only get `publicItem(...)` for the item they're currently on.
 * It must be JSON-serialisable (it's stored with ghost recordings and replayed later).
 */
export interface RoundContent<Item = unknown> {
  items: Item[];
}

/** Outcome of one answer, as decided by the server. */
export interface AnswerResult {
  correct: boolean;
  /** Points this answer adds (may be negative, e.g. a math miss). */
  points: number;
  /** Whether the player moves on to the next item (false for a correct-but-unfinished chess line). */
  itemDone: boolean;
  /** Extra data sent back to the client AFTER answering (e.g. the correct option, the opponent's reply). */
  feedback?: Record<string, unknown>;
}

export interface AnswerContext {
  /** Milliseconds since this item was shown to the player. */
  elapsedMs: number;
  /** Mutable per-player state for the current item (e.g. how far into a chess line they are). */
  itemState: Record<string, unknown>;
}

/** One scored step in a round, relative to round start. Used for live score, recordings and bots. */
export interface ReplayEvent {
  t: number;
  item: number;
  points: number;
  correct: boolean;
  done: boolean;
}

/**
 * A domain ("mini-game"). Add a new one by implementing this and registering it in `modes/index.ts`,
 * plus a React component in `client/src/modes`.
 */
export interface GameMode<C extends RoundContent = RoundContent> {
  id: DomainId;
  name: string;
  /** Total round length (ms). The server ends the round when this runs out. */
  timeLimit: number;
  /** Optional per-item limit (ms); when it runs out the item counts as missed. */
  itemTimeLimit?: number;
  /** Pause between finishing an item and receiving the next one, so the feedback can be seen. */
  feedbackDelay: number;

  generateRound(rng: Rng): C;
  /** Optional: whether stored (ghost) content still matches this mode's current format. */
  acceptsContent?(content: unknown): boolean;
  /** What the client may see of item `index` (no answers). */
  publicItem(content: C, index: number): unknown;
  /** Optional: public view of an item *in progress* (e.g. the current cube), used when a player reconnects. */
  publicItemState?(content: C, index: number, itemState: Record<string, unknown>): unknown;
  /** Decide an answer for item `index`. Must be pure apart from `ctx.itemState`. */
  validateAnswer(content: C, index: number, answer: unknown, ctx: AnswerContext): AnswerResult;
  /** Feedback when the item timer ran out (revealing the answer is fine at that point). */
  timeoutFeedback(content: C, index: number): Record<string, unknown>;
  /** Total round score from the individual answer results. */
  scoreRound(results: readonly { points: number }[]): number;
  /** Simulated play for a bot of the given rating (fallback when no recordings exist). */
  simulateBot(content: C, rating: number, rng: Rng): { events: ReplayEvent[]; durationMs: number };
}

/** Default: sum of points, never below zero. */
export function sumScore(results: readonly { points: number }[]): number {
  return Math.max(0, results.reduce((s, r) => s + r.points, 0));
}

/** Bot skill from rating: 1500 ≈ 65% correct. */
export function botAccuracy(rating: number): number {
  return Math.min(0.95, Math.max(0.25, 0.65 + (rating - 1500) * 0.0004));
}

/** Bot reaction-time multiplier from rating: 1 at 1500, faster when stronger. */
export function botSpeedFactor(rating: number): number {
  return Math.min(1.6, Math.max(0.55, 1 - (rating - 1500) * 0.0006));
}
