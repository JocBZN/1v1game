import { clamp, type Rng } from '../rng';
import { parseChoice, speedPoints } from './scoring';
import { botAccuracy, botSpeedFactor, type AnswerResult, type ReplayEvent, type RoundContent } from './types';

/** Shared machinery for timed multiple-choice modes (trivia, flags). */
export interface ChoiceItem {
  options: string[];
  /** Index of the correct option — server-side only. */
  answer: number;
  /** 1..3 */
  difficulty: number;
}

export function validateChoice(item: ChoiceItem, answer: unknown, elapsedMs: number, limitMs: number): AnswerResult {
  const chosen = parseChoice(answer, item.options.length);
  const correct = chosen === item.answer;
  return {
    correct,
    points: speedPoints(correct, elapsedMs, limitMs),
    itemDone: true,
    feedback: { correctIndex: item.answer, chosen },
  };
}

/**
 * Bot timeline that mirrors the server's: item i+1 appears `feedbackDelay` after item i is answered
 * (or after it times out).
 */
export function simulateChoiceBot(
  content: RoundContent<ChoiceItem>,
  rating: number,
  rng: Rng,
  limitMs: number,
  feedbackDelay: number,
): { events: ReplayEvent[]; durationMs: number } {
  const events: ReplayEvent[] = [];
  const acc = botAccuracy(rating);
  const speed = botSpeedFactor(rating);
  let start = 0;
  content.items.forEach((item, i) => {
    // 1500 rating ≈ answers in 40–60% of the item time (4–6 s on a 10 s question).
    const reaction = clamp(rng.normal(limitMs * 0.5 * speed, limitMs * 0.1), limitMs * 0.15, limitMs * 1.05);
    const p = clamp(acc + (2 - item.difficulty) * 0.1, 0.1, 0.98);
    if (reaction >= limitMs) {
      events.push({ t: Math.round(start + limitMs), item: i, points: 0, correct: false, done: true });
      start += limitMs + feedbackDelay;
      return;
    }
    const correct = rng.chance(p);
    events.push({ t: Math.round(start + reaction), item: i, points: speedPoints(correct, reaction, limitMs), correct, done: true });
    start += reaction + feedbackDelay;
  });
  return { events, durationMs: Math.round(start) };
}
