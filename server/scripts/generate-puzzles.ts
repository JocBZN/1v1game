/**
 * Generates server/data/chess_puzzles.json.
 *
 * Mix of a few classic hand-written patterns and positions found by search, each with a UNIQUE key move:
 *  - mate1: exactly one move mates
 *  - mate2: exactly one first move forces mate next move against every defence
 *  - material: exactly one checking move after which every reply loses ≥3 points of material
 *
 * Deterministic (seeded). Run `npm run validate:puzzles` afterwards.
 *   npx tsx scripts/generate-puzzles.ts [mate1Count] [mate2Count] [materialCount]
 */
import fs from 'node:fs';
import { Chess, type Move } from 'chess.js';
import { dataFile } from '../src/paths';
import { createRng, type Rng } from '../src/rng';
import {
  balanceAfterBestReply, hasMateIn1, materialBalance, matingMoves, uci, validatePuzzle, type Puzzle,
} from '../src/chess/puzzles';

const [N1, N2, NM] = process.argv.slice(2).map(Number);
const TARGET = { mate1: N1 || 30, mate2: N2 || 22, material: NM || 18 };

const HANDMADE: Omit<Puzzle, 'id'>[] = [
  { fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', moves: ['d1d8'], theme: 'mate1', difficulty: 1 },
  { fen: 'r1bqkbnr/1ppp1ppp/p1n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4', moves: ['h5f7'], theme: 'mate1', difficulty: 1 },
  { fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', moves: ['g5f7'], theme: 'mate1', difficulty: 1 },
  { fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2', moves: ['d8h4'], theme: 'mate1', difficulty: 1 },
  { fen: 'r6k/6pp/7N/8/2Q5/8/6PP/6K1 w - - 0 1', moves: ['c4g8', 'a8g8', 'h6f7'], theme: 'mate2', difficulty: 2 },
  { fen: 'r3k3/8/8/1N6/8/8/4P3/4K3 w - - 0 1', moves: ['b5c7', 'e8d7', 'c7a8'], theme: 'material', difficulty: 1 },
];

// ---------------------------------------------------------------- random positions

type Board = (string | null)[]; // 64, index = rank*8 + file, rank 0 = rank 1

const sq = (file: number, rank: number) => rank * 8 + file;

function toFen(board: Board, turn: 'w' | 'b'): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[sq(f, r)];
      if (!p) empty++;
      else {
        if (empty) row += empty;
        empty = 0;
        row += p;
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} ${turn} - - 0 1`;
}

/** Mirror vertically and swap colours: same puzzle, played by the other side. */
function flip(board: Board): Board {
  const out: Board = new Array(64).fill(null);
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const p = board[sq(f, r)];
    out[sq(f, 7 - r)] = p ? (p === p.toUpperCase() ? p.toLowerCase() : p.toUpperCase()) : null;
  }
  return out;
}

function randomPosition(rng: Rng): string | null {
  const b: Board = new Array(64).fill(null);
  const place = (p: string, file: number, rank: number) => {
    const i = sq(file, rank);
    if (file < 0 || file > 7 || rank < 0 || rank > 7 || b[i]) return false;
    if (p.toLowerCase() === 'p' && (rank === 0 || rank === 7)) return false;
    b[i] = p;
    return true;
  };
  const placeRandom = (p: string, rMin: number, rMax: number) => {
    for (let t = 0; t < 30; t++) if (place(p, rng.int(0, 7), rng.int(rMin, rMax))) return true;
    return false;
  };

  // Defender (black): king near its back rank, often behind a pawn shield.
  const kf = rng.pick([0, 1, 2, 5, 6, 7, 3, 4, 6, 7]);
  const kr = rng.chance(0.75) ? 7 : 6;
  place('k', kf, kr);
  for (const df of [-1, 0, 1]) if (rng.chance(0.55)) place('p', kf + df, kr - 1 - (rng.chance(0.2) ? 1 : 0));
  const defenders = rng.int(0, 3);
  for (let i = 0; i < defenders; i++) placeRandom(rng.pick(['r', 'n', 'b', 'q', 'r', 'n', 'b', 'p']), 3, 7);

  // Attacker (white): king safe at home, a few pawns, 2–3 active pieces.
  place('K', rng.int(0, 7), rng.int(0, 1));
  for (let i = rng.int(1, 4); i > 0; i--) placeRandom('P', 1, 3);
  const attackers = rng.int(2, 3);
  for (let i = 0; i < attackers; i++) placeRandom(rng.pick(['Q', 'R', 'R', 'B', 'N', 'N', 'Q', 'B']), 2, 7);

  const flipped = rng.chance(0.4);
  const fen = toFen(flipped ? flip(b) : b, flipped ? 'b' : 'w');
  try {
    const c = new Chess(fen);
    // The side NOT to move must not be in check; the side to move shouldn't start in check either.
    const other = new Chess(fen.replace(/ [wb] /, flipped ? ' w ' : ' b '));
    if (other.inCheck() || c.inCheck() || c.isGameOver()) return null;
    return fen;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- searches

function findMate1(chess: Chess): string[] | null {
  const mates = matingMoves(chess);
  return mates.length === 1 ? [uci(mates[0])] : null;
}

/** Defence lines if `m1` forces mate next move against every reply, else null. */
function forcedMateLines(chess: Chess, m1: Move): { reply: Move; mates: Move[] }[] | null {
  chess.move(m1);
  if (chess.isGameOver()) {
    chess.undo();
    return null;
  }
  const lines: { reply: Move; mates: Move[] }[] = [];
  for (const r of chess.moves({ verbose: true })) {
    chess.move(r);
    const mates = matingMoves(chess);
    chess.undo();
    if (!mates.length) {
      chess.undo();
      return null;
    }
    lines.push({ reply: r, mates });
  }
  chess.undo();
  return lines;
}

function findMate2(chess: Chess, rng: Rng): string[] | null {
  if (hasMateIn1(chess)) return null;
  let found: { m1: Move; lines: { reply: Move; mates: Move[] }[] } | null = null;
  for (const m1 of chess.moves({ verbose: true })) {
    const lines = forcedMateLines(chess, m1);
    if (!lines) continue;
    if (found) return null; // not unique
    found = { m1, lines };
  }
  if (!found) return null;
  // Prefer a defence after which the mate is unique (cleaner puzzle).
  const clean = found.lines.filter((l) => l.mates.length === 1);
  const line = rng.pick(clean.length ? clean : found.lines);
  return [uci(found.m1), uci(line.reply), uci(line.mates[0])];
}

/** Best net gain (after the opponent's best immediate reply) the side to move gets with one capture. */
function bestCaptureGain(chess: Chess, color: 'w' | 'b', base: number): { gain: number; move: Move | null } {
  let best = { gain: -Infinity, move: null as Move | null };
  for (const c of chess.moves({ verbose: true })) {
    if (!c.captured) continue;
    chess.move(c);
    const g = chess.isCheckmate() ? 100 : balanceAfterBestReply(chess, color) - base;
    chess.undo();
    if (g > best.gain) best = { gain: g, move: c };
  }
  return best;
}

function findMaterial(chess: Chess): string[] | null {
  if (hasMateIn1(chess)) return null;
  const me = chess.turn();
  const base = materialBalance(chess, me);
  // The tactic must be needed: no free piece available right now.
  if (bestCaptureGain(chess, me, base).gain >= 2) return null;

  let found: string[] | null = null;
  for (const m1 of chess.moves({ verbose: true })) {
    if (!m1.san.includes('+')) continue; // forcing moves only
    chess.move(m1);
    let worst: { gain: number; line: string[] } | null = null;
    let ok = true;
    for (const r of chess.moves({ verbose: true })) {
      chess.move(r);
      const best = bestCaptureGain(chess, me, base);
      chess.undo();
      if (best.gain < 3 || best.gain >= 100 || !best.move) {
        ok = false;
        break;
      }
      if (!worst || best.gain < worst.gain) worst = { gain: best.gain, line: [uci(m1), uci(r), uci(best.move)] };
    }
    chess.undo();
    if (!ok || !worst) continue;
    if (found) return null; // not unique
    found = worst.line;
  }
  return found;
}

// ---------------------------------------------------------------- main

const rng = createRng(20261120);
const out: Puzzle[] = [];
const seen = new Set<string>();
const counts = { mate1: 0, mate2: 0, material: 0 };

for (const h of HANDMADE) {
  const p: Puzzle = { id: `h${out.length + 1}`, ...h };
  out.push(p);
  seen.add(p.fen);
  counts[p.theme]++;
}

const t0 = Date.now();
let tried = 0;
while ((counts.mate1 < TARGET.mate1 || counts.mate2 < TARGET.mate2 || counts.material < TARGET.material) && Date.now() - t0 < 10 * 60_000) {
  const fen = randomPosition(rng);
  tried++;
  if (!fen || seen.has(fen)) continue;
  const chess = new Chess(fen);

  let theme: Puzzle['theme'] | null = null;
  let moves: string[] | null = null;

  if (counts.mate1 < TARGET.mate1 && (moves = findMate1(chess))) theme = 'mate1';
  else if (counts.material < TARGET.material && (moves = findMaterial(chess))) theme = 'material';
  else if (counts.mate2 < TARGET.mate2 && (moves = findMate2(chess, rng))) theme = 'mate2';
  if (!theme || !moves) continue;

  const p: Puzzle = {
    id: `${theme === 'mate1' ? 'm1' : theme === 'mate2' ? 'm2' : 'mat'}-${counts[theme] + 1}`,
    fen,
    moves,
    theme,
    difficulty: theme === 'mate1' ? 1 : theme === 'material' ? 2 : 3,
  };
  if (!validatePuzzle(p).ok) continue;
  out.push(p);
  seen.add(fen);
  counts[theme]++;
  process.stdout.write(`\r${tried} positions · mate1 ${counts.mate1} · mate2 ${counts.mate2} · material ${counts.material}   `);
}

fs.writeFileSync(dataFile('chess_puzzles.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`\n${out.length} puzzles written to data/chess_puzzles.json (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
