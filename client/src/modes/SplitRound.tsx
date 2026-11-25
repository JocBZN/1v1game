import { useEffect, useRef, useState } from 'react';
import { clipHalf, type Poly, type Pt } from '../../../server/src/modes/shapes';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';

interface SplitData {
  name: string;
  polys: Poly[];
  index: number;
  total: number;
}

const path = (p: readonly Pt[]) => (p.length ? `M${p.map((q) => `${q[0]},${q[1]}`).join('L')}Z` : '');

/** Extend the segment a→b to an (effectively) infinite line for drawing. */
function extend(a: Pt, b: Pt): [Pt, Pt] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const k = 200 / len;
  return [[a[0] - dx * k, a[1] - dy * k], [b[0] + dx * k, b[1] + dy * k]];
}

export function SplitRound({ item, feedback, onAnswer, waiting }: ModeProps<SplitData>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [line, setLine] = useState<[Pt, Pt] | null>(null);
  const [sent, setSent] = useState(false);
  const dragging = useRef(false);
  useEffect(() => {
    setLine(null);
    setSent(false);
  }, [item?.round, item?.item]);

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const locked = sent || !!fb;

  const toSvg = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };

  const share = typeof fb?.share === 'number' ? (fb.share as number) : null;
  const [A, B] = line ? extend(line[0], line[1]) : [null, null];

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader
        item={item}
        fb={fb}
        result={share !== null ? `${Math.round(share * 1000) / 10}% / ${Math.round((1 - share) * 1000) / 10}%` : undefined}
      />
      <div className="mt-4 text-center">
        <div className="font-display text-xl font-bold">{item.data.name}</div>
        <p className="text-sm text-muted">{locked ? (share !== null ? `+${fb!.points} points` : 'Checking…') : 'Drag one straight line to cut it in half'}</p>
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="aspect-square w-full max-w-[360px] touch-none select-none rounded-2xl border border-line bg-surface"
          onPointerDown={(e) => {
            if (locked) return;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            dragging.current = true;
            const p = toSvg(e);
            setLine([p, p]);
          }}
          onPointerMove={(e) => {
            if (!dragging.current || locked) return;
            const p = toSvg(e);
            setLine((l) => (l ? [l[0], p] : l));
          }}
          onPointerUp={() => {
            if (!dragging.current) return;
            dragging.current = false;
            if (!line || Math.hypot(line[1][0] - line[0][0], line[1][1] - line[0][1]) < 8) {
              setLine(null);
              return;
            }
            setSent(true);
            onAnswer({ x1: line[0][0], y1: line[0][1], x2: line[1][0], y2: line[1][1] });
          }}
        >
          {share !== null && A && B ? (
            <>
              {item.data.polys.map((p, i) => <path key={`a${i}`} d={path(clipHalf(p, A, B))} fill="#15788c" />)}
              {item.data.polys.map((p, i) => <path key={`b${i}`} d={path(clipHalf(p, B, A))} fill="#ffb0a3" />)}
            </>
          ) : (
            item.data.polys.map((p, i) => <path key={i} d={path(p)} fill="#46425e" stroke="#46425e" strokeWidth={0.3} />)
          )}
          {A && B && <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#ff6973" strokeWidth={0.9} strokeDasharray={locked ? undefined : '2 1.5'} />}
        </svg>
      </div>
    </div>
  );
}
