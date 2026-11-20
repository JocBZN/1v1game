import fs from 'node:fs';
import { Chess } from 'chess.js';
import { checkSolverMove, type Puzzle } from '../chess/puzzles';
import { dataFile } from '../paths';
import { clamp } from '../rng';
import { botAccuracy, botSpeedFactor, sumScore, type GameMode, type ReplayEvent, type RoundContent } from './types';

export type ChessContent = RoundContent<Puzzle>;

export const CHESS_PUZZLES_PER_ROUND = 20; // more than anyone solves in 90 s
export const CHESS_SOLVE_POINTS = 1000;
/** Small speed bonus (max 100, over 30 s) — only a tie-breaker; puzzles solved is what counts. */
export const CHESS_SPEED_BONUS = 100;
export const CHESS_BONUS_WINDOW_MS = 30_000;

export function chessPoints(elapsedMs: number): number {
  return CHESS_SOLVE_POINTS + Math.round(CHESS_SPEED_BONUS * Math.max(0, 1 - elapsedMs / CHESS_BONUS_WINDOW_MS));
}

const THEME_LABEL: Record<Puzzle['theme'], string> = {
  mate1: 'Mat într-o mutare',
  mate2: 'Mat în 2 mutări',
  material: 'Câștigă material',
};

let cache: Puzzle[] | null = null;
export function loadPuzzles(): Puzzle[] {
  if (!cache) cache = JSON.parse(fs.readFileSync(dataFile('chess_puzzles.json'), 'utf8')) as Puzzle[];
  return cache;
}

export const chessMode: GameMode<ChessContent> = {
  id: 'chess',
  name: 'Puzzle șah',
  timeLimit: 90_000,
  feedbackDelay: 1_100,

  generateRound(rng) {
    const all = loadPuzzles();
    const tier = (d: number) => rng.shuffle(all.filter((p) => p.difficulty === d));
    // Warm up with easy ones, then mix up.
    const easy = tier(1);
    const items = [...easy.slice(0, 4), ...rng.shuffle([...easy.slice(4), ...tier(2), ...tier(3)])].slice(0, CHESS_PUZZLES_PER_ROUND);
    return { items };
  },

  publicItem(content, index) {
    const p = content.items[index];
    return {
      fen: p.fen,
      color: new Chess(p.fen).turn(),
      theme: THEME_LABEL[p.theme],
      index,
      total: content.items.length,
    };
  },

  validateAnswer(content, index, answer, ctx) {
    const p = content.items[index];
    const step = (ctx.itemState.step as number | undefined) ?? 0;
    const r = typeof answer === 'string' ? checkSolverMove(p, step, answer) : { ok: false, solved: false };
    if (!r.ok) {
      // Wrong move = puzzle lost. Revealing the right move now is fine — it's over.
      return { correct: false, points: 0, itemDone: true, feedback: { failed: true, solution: p.moves[step] } };
    }
    if (r.solved) return { correct: true, points: chessPoints(ctx.elapsedMs), itemDone: true, feedback: { solved: true } };
    ctx.itemState.step = step + 2;
    return { correct: true, points: 0, itemDone: false, feedback: { reply: r.reply } };
  },

  timeoutFeedback() {
    return {};
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    const events: ReplayEvent[] = [];
    const speed = botSpeedFactor(rating);
    const acc = botAccuracy(rating);
    let t = 0;
    for (let i = 0; i < content.items.length; i++) {
      const p = content.items[i];
      const base = p.difficulty === 1 ? 9_000 : p.difficulty === 2 ? 15_000 : 22_000;
      const think = clamp(rng.normal(base * speed, base * speed * 0.3), 2_500, 60_000);
      if (t + think > this.timeLimit) break;
      const solved = rng.chance(clamp(acc + (2 - p.difficulty) * 0.12, 0.1, 0.97));
      // Multi-move lines: intermediate correct moves score nothing.
      const steps = Math.ceil(p.moves.length / 2);
      for (let s = 1; s < steps && solved; s++) {
        events.push({ t: Math.round(t + (think * s) / steps), item: i, points: 0, correct: true, done: false });
      }
      t += think;
      events.push({ t: Math.round(t), item: i, points: solved ? chessPoints(think) : 0, correct: solved, done: true });
      t += this.feedbackDelay;
    }
    return { events, durationMs: this.timeLimit };
  },
};
