import { describe, expect, it } from 'vitest';
import { checkSolverMove, validatePuzzle, type Puzzle } from '../src/chess/puzzles';
import { CHESS_SOLVE_POINTS, chessMode, chessPoints, loadPuzzles } from '../src/modes/chess';
import { createRng } from '../src/rng';

const BACK_RANK: Puzzle = { id: 't1', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', moves: ['d1d8'], theme: 'mate1', difficulty: 1 };
const PHILIDOR: Puzzle = { id: 't2', fen: 'r6k/6pp/7N/8/2Q5/8/6PP/6K1 w - - 0 1', moves: ['c4g8', 'a8g8', 'h6f7'], theme: 'mate2', difficulty: 2 };
const FORK: Puzzle = { id: 't3', fen: 'r3k3/8/8/1N6/8/8/4P3/4K3 w - - 0 1', moves: ['b5c7', 'e8d7', 'c7a8'], theme: 'material', difficulty: 1 };

describe('validatePuzzle', () => {
  it('accepts mates and clear material wins', () => {
    expect(validatePuzzle(BACK_RANK)).toMatchObject({ ok: true, outcome: 'mate' });
    expect(validatePuzzle(PHILIDOR)).toMatchObject({ ok: true, outcome: 'mate' });
    expect(validatePuzzle(FORK)).toMatchObject({ ok: true, outcome: 5 });
  });
  it('rejects illegal moves', () => {
    expect(validatePuzzle({ ...BACK_RANK, moves: ['d1d9'] }).ok).toBe(false);
    expect(validatePuzzle({ ...BACK_RANK, moves: ['e1e8'] }).ok).toBe(false);
    expect(validatePuzzle({ ...PHILIDOR, moves: ['c4g8', 'h8g8', 'h6f7'] }).ok).toBe(false); // Kxg8 is illegal
  });
  it('rejects lines that end without mate or material gain', () => {
    expect(validatePuzzle({ ...BACK_RANK, moves: ['d1d2'] }).ok).toBe(false);
  });
  it('rejects lines that end on the opponent move', () => {
    expect(validatePuzzle({ ...PHILIDOR, moves: ['c4g8', 'a8g8'] }).ok).toBe(false);
  });
  it('rejects a "material win" that is actually a draw (K+N vs K)', () => {
    const r = validatePuzzle({ ...FORK, fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1' });
    expect(r.ok).toBe(false);
  });
  it('rejects broken FEN', () => {
    expect(validatePuzzle({ ...BACK_RANK, fen: 'not a fen' }).ok).toBe(false);
  });
  it('every puzzle in data/chess_puzzles.json is valid (≥ 60)', () => {
    const all = loadPuzzles();
    expect(all.length).toBeGreaterThanOrEqual(60);
    const bad = all.map((p) => ({ id: p.id, r: validatePuzzle(p) })).filter((x) => !x.r.ok);
    expect(bad).toEqual([]);
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });
});

describe('checkSolverMove', () => {
  it('walks a multi-move line, returning the forced reply', () => {
    expect(checkSolverMove(PHILIDOR, 0, 'c4g8')).toEqual({ ok: true, solved: false, reply: 'a8g8' });
    expect(checkSolverMove(PHILIDOR, 2, 'h6f7')).toEqual({ ok: true, solved: true });
  });
  it('a wrong move fails the puzzle', () => {
    expect(checkSolverMove(PHILIDOR, 0, 'c4c8').ok).toBe(false);
    expect(checkSolverMove(PHILIDOR, 0, 'zz').ok).toBe(false);
  });
});

describe('chess mode scoring', () => {
  const content = { items: [PHILIDOR, BACK_RANK] };
  it('solving scores 1000 + a small speed bonus (≤100)', () => {
    expect(chessPoints(0)).toBe(1100);
    expect(chessPoints(30_000)).toBe(CHESS_SOLVE_POINTS);
    expect(chessPoints(60_000)).toBe(CHESS_SOLVE_POINTS);
    // More puzzles solved always beats fewer solved faster (for any realistic count).
    expect(3 * chessPoints(60_000)).toBeGreaterThan(2 * chessPoints(0));
  });
  it('intermediate correct moves give the reply but no points; finishing scores', () => {
    const itemState: Record<string, unknown> = {};
    const a = chessMode.validateAnswer(content, 0, 'c4g8', { elapsedMs: 3000, itemState });
    expect(a).toMatchObject({ correct: true, points: 0, itemDone: false, feedback: { reply: 'a8g8' } });
    const b = chessMode.validateAnswer(content, 0, 'h6f7', { elapsedMs: 6000, itemState });
    expect(b).toMatchObject({ correct: true, itemDone: true, points: chessPoints(6000) });
  });
  it('one wrong move loses the puzzle and only then reveals the solution', () => {
    const r = chessMode.validateAnswer(content, 1, 'd1d7', { elapsedMs: 1000, itemState: {} });
    expect(r).toMatchObject({ correct: false, points: 0, itemDone: true, feedback: { failed: true, solution: 'd1d8' } });
  });
  it('public item has the position but not the solution', () => {
    const pub = chessMode.publicItem(content, 0) as Record<string, unknown>;
    expect(pub).toMatchObject({ fen: PHILIDOR.fen, color: 'w' });
    expect(JSON.stringify(pub)).not.toMatch(/c4g8|"moves"|"solution"/);
  });
  it('a round has five puzzles and starts with two easy ones', () => {
    const r = chessMode.generateRound(createRng(1));
    expect(r.items.length).toBe(5);
    expect(r.items.slice(0, 2).every((p) => p.difficulty === 1)).toBe(true);
  });
});
