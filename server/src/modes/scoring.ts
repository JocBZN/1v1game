/** Shared scoring for timed multiple-choice items (trivia, flags). */

export const MC_BASE_POINTS = 500;
export const MC_SPEED_BONUS = 500;

/**
 * Correct answer = 500 + a speed bonus of up to 500 that decreases linearly with time
 * (max 1000 for an instant answer, 500 at the buzzer). Wrong/late = 0.
 */
export function speedPoints(correct: boolean, elapsedMs: number, limitMs: number): number {
  if (!correct || elapsedMs > limitMs) return 0;
  const frac = Math.min(1, Math.max(0, elapsedMs / limitMs));
  return Math.round(MC_BASE_POINTS + MC_SPEED_BONUS * (1 - frac));
}

/** Parse a multiple-choice answer: an integer option index within range. */
export function parseChoice(answer: unknown, optionCount: number): number | null {
  return typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < optionCount ? answer : null;
}
