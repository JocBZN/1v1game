import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { WaitingNote } from './MathRound';
import type { ModeProps } from './types';
import { alpha, C } from '../lib/theme';

interface PuzzleItem {
  fen: string;
  color: 'w' | 'b';
  theme: string;
  index: number;
  total: number;
}

type Status = 'thinking' | 'pending' | 'opponent' | 'solved' | 'failed';

export function ChessRound({ item, feedback, onAnswer, waiting }: ModeProps<PuzzleItem>) {
  const chessRef = useRef(new Chess(item?.data.fen));
  // react-chessboard v5 needs a real FEN (it has no 'start' keyword).
  const [fen, setFen] = useState<string>(() => item?.data.fen ?? chessRef.current.fen());
  const [status, setStatus] = useState<Status>('thinking');
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<[string, string] | null>(null);
  const [hint, setHint] = useState<[string, string] | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [toast, setToast] = useState<{ text: string; good: boolean; seq: number } | null>(null);

  // New puzzle from the server.
  useEffect(() => {
    if (!item) return;
    chessRef.current = new Chess(item.data.fen);
    setFen(item.data.fen);
    setStatus('thinking');
    setSelected(null);
    setLastMove(null);
    setHint(null);
  }, [item?.round, item?.item]);

  // Server verdict for the move we just sent.
  useEffect(() => {
    if (!feedback || !item || feedback.item !== item.item || feedback.round !== item.round) return;
    if (feedback.solved) {
      setStatus('solved');
      setSolvedCount((c) => c + 1);
      setToast({ text: `Rezolvat! +${feedback.points}`, good: true, seq: feedback.seq });
    } else if (feedback.failed) {
      setStatus('failed');
      const sol = feedback.solution as string | undefined;
      if (sol) setHint([sol.slice(0, 2), sol.slice(2, 4)]);
      setToast({ text: 'Mutare greșită', good: false, seq: feedback.seq });
    } else if (feedback.reply) {
      const reply = feedback.reply as string;
      setStatus('opponent');
      const t = setTimeout(() => {
        try {
          chessRef.current.move({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] });
          setFen(chessRef.current.fen());
          setLastMove([reply.slice(0, 2), reply.slice(2, 4)]);
        } catch {
          /* ignore */
        }
        setStatus('thinking');
      }, 450);
      return () => clearTimeout(t);
    }
  }, [feedback?.seq]);

  const myColor = item?.data.color ?? 'w';

  function tryMove(from: string, to: string): boolean {
    if (status !== 'thinking' || !item) return false;
    const chess = chessRef.current;
    const piece = chess.get(from as Square);
    if (!piece || piece.color !== myColor) return false;
    const promotion = piece.type === 'p' && (to[1] === '8' || to[1] === '1') ? 'q' : undefined;
    try {
      chess.move({ from, to, promotion });
    } catch {
      return false; // illegal: just snap back, no penalty
    }
    setFen(chess.fen());
    setLastMove([from, to]);
    setSelected(null);
    setStatus('pending');
    onAnswer(from + to + (promotion ?? ''));
    return true;
  }

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    try {
      return chessRef.current.moves({ square: selected as Square, verbose: true }).map((m) => m.to);
    } catch {
      return [];
    }
  }, [selected, fen]);

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) for (const s of lastMove) squareStyles[s] = { background: 'rgba(250, 204, 21, 0.38)' };
  if (selected) squareStyles[selected] = { background: 'rgba(34, 211, 238, 0.5)' };
  for (const s of legalTargets) {
    squareStyles[s] = { ...(squareStyles[s] ?? {}), backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.45) 22%, transparent 24%)' };
  }

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;

  const frame =
    status === 'solved'
      ? `0 0 0 4px ${C.good}, 0 0 40px ${alpha(C.good, 55)}`
      : status === 'failed'
        ? `0 0 0 4px ${C.bad}, 0 0 40px ${alpha(C.bad, 55)}`
        : `0 0 0 2px ${C.line}`;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mb-2 flex w-full items-center justify-between text-xs font-bold">
        <span className="uppercase tracking-widest text-muted">Puzzle {item.data.index + 1}</span>
        <span className="rounded-full bg-good/15 px-3 py-1 text-good">{item.data.theme}</span>
        <span className="text-good">✓ {solvedCount}</span>
      </div>

      <div className="relative w-full max-w-[min(100%,420px)]">
        <div className={`overflow-hidden rounded-xl transition-shadow ${status === 'failed' ? 'animate-shake' : ''}`} style={{ boxShadow: frame }}>
          <Chessboard
            options={{
              id: `pz-${item.round}-${item.item}`,
              position: fen,
              boardOrientation: myColor === 'w' ? 'white' : 'black',
              allowDragging: status === 'thinking',
              animationDurationInMs: 180,
              darkSquareStyle: { backgroundColor: C.boardDark },
              lightSquareStyle: { backgroundColor: C.boardLight },
              squareStyles,
              arrows: hint ? [{ startSquare: hint[0], endSquare: hint[1], color: 'rgba(52, 211, 153, 0.9)' }] : [],
              canDragPiece: ({ piece }) => status === 'thinking' && piece.pieceType[0] === myColor,
              onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? tryMove(sourceSquare, targetSquare) : false),
              onSquareClick: ({ square, piece }) => {
                if (status !== 'thinking') return;
                if (selected && legalTargets.includes(square as Square)) {
                  tryMove(selected, square);
                  return;
                }
                setSelected(piece && piece.pieceType[0] === myColor ? square : null);
              },
            }}
          />
        </div>
        {toast && (
          <div key={toast.seq} className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-3xl font-black drop-shadow-lg float-up ${toast.good ? 'text-good' : 'text-bad'}`}>
            {toast.text}
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-sm font-semibold text-muted">
        {status === 'thinking' && (
          <>
            Mută {myColor === 'w' ? 'albul' : 'negrul'} <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ background: myColor === 'w' ? '#fff' : '#111', boxShadow: '0 0 0 1px #888' }} />
          </>
        )}
        {status === 'pending' && 'Se verifică…'}
        {status === 'opponent' && 'Corect! Adversarul răspunde…'}
        {status === 'solved' && <span className="text-good">Corect! Urmează următorul puzzle.</span>}
        {status === 'failed' && <span className="text-bad">Puzzle pierdut. Săgeata arată mutarea corectă.</span>}
      </div>
    </div>
  );
}
