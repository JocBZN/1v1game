/** Shared scoring for timed multiple-choice items (trivia, flags). */

/** Base points for a correct answer by difficulty: ★ 350 … ★★★★★ 950. */
export const starBase = (stars: number) => 200 + 150 * Math.max(1, Math.min(5, Math.round(stars)));
/** The speed bonus is worth up to half of the base. */
export const SPEED_SHARE = 0.5;

/**
 * Correct answer = base for its difficulty + a speed bonus that decreases linearly with time
 * (★ 350–525, ★★★ 650–975, ★★★★★ 950–1425). Wrong/late = 0.
 */
export function speedPoints(correct: boolean, elapsedMs: number, limitMs: number, stars = 3): number {
  if (!correct || elapsedMs > limitMs) return 0;
  const frac = Math.min(1, Math.max(0, elapsedMs / limitMs));
  const base = starBase(stars);
  return Math.round(base + base * SPEED_SHARE * (1 - frac));
}

/** Parse a multiple-choice answer: an integer option index within range. */
export function parseChoice(answer: unknown, optionCount: number): number | null {
  return typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < optionCount ? answer : null;
}

/** Live difficulty from real answers: share answered correctly → stars. Null until enough data. */
export function starsFromRate(seen: number, correct: number): number | null {
  if (seen < 15) return null;
  const r = correct / seen;
  return r > 0.85 ? 1 : r > 0.7 ? 2 : r > 0.5 ? 3 : r > 0.3 ? 4 : 5;
}
