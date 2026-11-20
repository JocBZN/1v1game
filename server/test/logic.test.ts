import { describe, expect, it } from 'vitest';
import { countRoundWins, duelWinner, isDuelOver, outcomeFor, roundWinner } from '../src/duel/logic';

describe('roundWinner', () => {
  it('higher score wins, equal is a tie', () => {
    expect(roundWinner(500, 300)).toBe(0);
    expect(roundWinner(300, 500)).toBe(1);
    expect(roundWinner(400, 400)).toBeNull();
  });
});

describe('isDuelOver (2 out of 3)', () => {
  it('ends at 2–0', () => {
    expect(isDuelOver([0])).toBe(false);
    expect(isDuelOver([0, 0])).toBe(true);
    expect(isDuelOver([1, 1])).toBe(true);
  });
  it('goes to a third round at 1–1', () => {
    expect(isDuelOver([0, 1])).toBe(false);
    expect(isDuelOver([0, 1, 1])).toBe(true);
  });
  it('continues after a win and a tie (the other player can still level)', () => {
    expect(isDuelOver([0, null])).toBe(false);
    expect(isDuelOver([null, null])).toBe(false);
  });
  it('always ends after 3 rounds', () => {
    expect(isDuelOver([null, null, null])).toBe(true);
    expect(isDuelOver([0, null, null])).toBe(true);
  });
});

describe('duelWinner', () => {
  it('2–0 and 2–1 go to the player with more round wins, regardless of points', () => {
    expect(duelWinner([0, 0], [100, 9000])).toBe(0);
    expect(duelWinner([1, 0, 1], [9000, 100])).toBe(1);
  });
  it('1–1 with a tied third round: total points decide', () => {
    expect(duelWinner([0, 1, null], [2500, 2400])).toBe(0);
    expect(duelWinner([0, 1, null], [2400, 2500])).toBe(1);
  });
  it('fully level → draw', () => {
    expect(duelWinner([0, 1, null], [2500, 2500])).toBeNull();
    expect(duelWinner([null, null, null], [0, 0])).toBeNull();
  });
  it('one win + two ties wins the duel', () => {
    expect(duelWinner([null, 1, null], [3000, 1000])).toBe(1);
  });
  it('forfeit always loses', () => {
    expect(duelWinner([0, 0], [5000, 0], 0)).toBe(1);
    expect(duelWinner([], [0, 0], 1)).toBe(0);
  });
  it('counts and outcomes', () => {
    expect(countRoundWins([0, null, 1, 0])).toEqual([2, 1]);
    expect(outcomeFor(0, 0)).toBe(1);
    expect(outcomeFor(1, 0)).toBe(0);
    expect(outcomeFor(1, null)).toBe(0.5);
  });
});
