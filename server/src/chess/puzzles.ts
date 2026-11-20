import { Chess, type Move } from 'chess.js';

export type PuzzleTheme = 'mate1' | 'mate2' | 'material';

export interface Puzzle {
  id: string;
  /** Position with the solver to move. */
  fen: string;
  /** Full line in UCI: solver, opponent (forced reply), solver, … — always ends with a solver move. */
  moves: string[];
  theme: PuzzleTheme;
  /** 1..3 */
  difficulty: number;
}

export const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const uci = (m: Pick<Move, 'from' | 'to' | 'promotion'>) => m.from + m.to + (m.promotion ?? '');

export function parseUci(s: string): { from: string; to: string; promotion?: string } | null {
  if (typeof s !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(s)) return null;
  return { from: s.slice(0, 2), to: s.slice(2, 4), promotion: s.length === 5 ? s[4] : undefined };
}

/** Plays a UCI move; returns the Move or null if illegal. */
export function playUci(chess: Chess, s: string): Move | null {
  const m = parseUci(s);
  if (!m) return null;
  try {
    return chess.move(m);
  } catch {
    return null;
  }
}

/** Material of `color` minus material of the other side. */
export function materialBalance(chess: Chess, color: 'w' | 'b'): number {
  let sum = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq) continue;
      const v = PIECE_VALUES[sq.type];
      sum += sq.color === color ? v : -v;
    }
  }
  return sum;
}

/** Moves that give immediate checkmate. */
export function matingMoves(chess: Chess): Move[] {
  const out: Move[] = [];
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    if (chess.isCheckmate()) out.push(m);
    chess.undo();
  }
  return out;
}

export function hasMateIn1(chess: Chess): boolean {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return true;
  }
  return false;
}

/**
 * Worst-case material for `color` after the opponent (to move) replies once: considers every reply
 * (captures matter; quiet moves keep the balance). Returns -Infinity if the opponent can mate.
 */
export function balanceAfterBestReply(chess: Chess, color: 'w' | 'b'): number {
  let worst = materialBalance(chess, color);
  for (const r of chess.moves({ verbose: true })) {
    chess.move(r);
    if (chess.isCheckmate()) {
      chess.undo();
      return -Infinity;
    }
    worst = Math.min(worst, materialBalance(chess, color));
    chess.undo();
  }
  return worst;
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
  /** 'mate' or net material gain for the solver */
  outcome?: 'mate' | number;
}

/**
 * A puzzle is valid when: the FEN loads, every move of the line is legal, the line ends with a solver
 * move, nothing ends the game early, and the line ends in checkmate or in a clear material win
 * (≥ 3 points up even after the opponent's best immediate reply).
 */
export function validatePuzzle(p: Puzzle): ValidationResult {
  let chess: Chess;
  try {
    chess = new Chess(p.fen);
  } catch (e) {
    return { ok: false, reason: `FEN invalid: ${(e as Error).message}` };
  }
  if (!Array.isArray(p.moves) || p.moves.length === 0 || p.moves.length % 2 === 0) {
    return { ok: false, reason: 'line must have an odd number of moves (end with a solver move)' };
  }
  if (chess.isGameOver()) return { ok: false, reason: 'start position is already over' };
  const solver = chess.turn();
  const start = materialBalance(chess, solver);

  for (let i = 0; i < p.moves.length; i++) {
    const mv = playUci(chess, p.moves[i]);
    if (!mv) return { ok: false, reason: `illegal move #${i + 1}: ${p.moves[i]}` };
    const last = i === p.moves.length - 1;
    if (!last && chess.isGameOver()) return { ok: false, reason: `game ends early after move #${i + 1}` };
  }

  if (chess.isCheckmate()) return { ok: true, outcome: 'mate' };
  if (chess.isDraw() || chess.isStalemate()) return { ok: false, reason: 'line ends in a draw' };

  const gainNow = materialBalance(chess, solver) - start;
  const gainAfterReply = balanceAfterBestReply(chess, solver) - start;
  if (gainNow >= 3 && gainAfterReply >= 2) return { ok: true, outcome: gainAfterReply };
  return { ok: false, reason: `no mate and no clear material win (gain ${gainNow}, after reply ${gainAfterReply})` };
}

/**
 * Server-side check of one solver move against the puzzle at `step` (index into `moves`).
 * Any move that mates is accepted, even if it isn't the stored one.
 */
export function checkSolverMove(p: Puzzle, step: number, move: string): { ok: boolean; solved: boolean; reply?: string } {
  const chess = new Chess(p.fen);
  for (let i = 0; i < step; i++) if (!playUci(chess, p.moves[i])) return { ok: false, solved: false };
  const played = playUci(chess, move);
  if (!played) return { ok: false, solved: false };
  if (chess.isCheckmate()) return { ok: true, solved: true };
  if (uci(played) !== p.moves[step]) return { ok: false, solved: false };
  if (step === p.moves.length - 1) return { ok: true, solved: true };
  return { ok: true, solved: false, reply: p.moves[step + 1] };
}
