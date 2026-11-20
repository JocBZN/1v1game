/** Pure duel rules — no timers, no I/O — so they're easy to unit test. */

/** Winning slot of a round, or null for a tie. */
export type RoundOutcome = 0 | 1 | null;

export const ROUNDS_PER_DUEL = 3;
export const ROUNDS_TO_WIN = 2;

export function roundWinner(scoreA: number, scoreB: number): RoundOutcome {
  if (scoreA > scoreB) return 0;
  if (scoreB > scoreA) return 1;
  return null;
}

export function countRoundWins(outcomes: readonly RoundOutcome[]): [number, number] {
  let a = 0;
  let b = 0;
  for (const o of outcomes) {
    if (o === 0) a++;
    else if (o === 1) b++;
  }
  return [a, b];
}

/** Over once someone has 2 round wins, or all 3 rounds have been played. */
export function isDuelOver(outcomes: readonly RoundOutcome[]): boolean {
  const [a, b] = countRoundWins(outcomes);
  return a >= ROUNDS_TO_WIN || b >= ROUNDS_TO_WIN || outcomes.length >= ROUNDS_PER_DUEL;
}

/**
 * Duel winner: more round wins; if level (e.g. 1–1 with a tied third round), total points decide;
 * if those are level too it's a draw (null). A forfeit always loses.
 */
export function duelWinner(
  outcomes: readonly RoundOutcome[],
  totals: readonly [number, number],
  forfeitSlot: 0 | 1 | null = null,
): RoundOutcome {
  if (forfeitSlot !== null) return forfeitSlot === 0 ? 1 : 0;
  const [a, b] = countRoundWins(outcomes);
  if (a !== b) return a > b ? 0 : 1;
  if (totals[0] !== totals[1]) return totals[0] > totals[1] ? 0 : 1;
  return null;
}

/** Glicko outcome (1 / 0.5 / 0) for `slot` given a winner. */
export function outcomeFor(slot: 0 | 1, winner: RoundOutcome): 0 | 0.5 | 1 {
  if (winner === null) return 0.5;
  return winner === slot ? 1 : 0;
}
