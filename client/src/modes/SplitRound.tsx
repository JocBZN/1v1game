import { useEffect, useId, useRef, useState } from 'react';
import { cutRegion, type Poly, type Pt } from '../../../server/src/modes/shapes';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';

interface SplitData {
  name: string;
  polys: Poly[];
  index: number;
  total: number;
}

/** Minimum distance (board units) between stored points, and minimum length of a cut. */
const MIN_GAP = 0.6;
const MIN_LENGTH = 8;

const polyPath = (p: readonly Pt[]) => (p.length ? `M${p.map((q) => `${q[0]},${q[1]}`).join('L')}Z` : '');

/** Smooth path through the points (quadratic curves between midpoints), so the line looks hand-drawn. */
function strokePath(p: readonly Pt[]): string {
  if (p.length === 0) return '';
  if (p.length < 3) return `M${p.map((q) => `${q[0]},${q[1]}`).join('L')}`;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2;
    const my = (p[i][1] + p[i + 1][1]) / 2;
    d += `Q${p[i][0]},${p[i][1]} ${mx},${my}`;
  }
  const last = p[p.length - 1];
  return `${d}L${last[0]},${last[1]}`;
}

function strokeLength(p: readonly Pt[]): number {
  let len = 0;
  for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return len;
}

export function SplitRound({ item, feedback, onAnswer, waiting }: ModeProps<SplitData>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId().replace(/:/g, '');
  const [stroke, setStroke] = useState<Pt[]>([]);
  const [sent, setSent] = useState(false);
  const drawing = useRef<number | null>(null);
  const pts = useRef<Pt[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    setStroke([]);
    setSent(false);
    pts.current = [];
    drawing.current = null;
  }, [item?.round, item?.item]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const locked = sent || !!fb;

  const toBoard = (clientX: number, clientY: number): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * 100, ((clientY - r.top) / r.height) * 100];
  };

  /** Re-render at most once per frame, however many pointer events arrive. */
  const flush = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      setStroke([...pts.current]);
    });
  };

  const add = (q: Pt) => {
    const a = pts.current;
    const last = a[a.length - 1];
    if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) >= MIN_GAP) a.push(q);
  };

  const finish = (e: React.PointerEvent) => {
    if (drawing.current !== e.pointerId) return;
    drawing.current = null;
    add(toBoard(e.clientX, e.clientY));
    const done = pts.current;
    if (done.length < 2 || strokeLength(done) < MIN_LENGTH) {
      pts.current = [];
      setStroke([]);
      return;
    }
    setStroke([...done]);
    setSent(true);
    onAnswer({ pts: done.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]) });
  };

  const share = typeof fb?.share === 'number' ? (fb.share as number) : null;
  const region = share !== null && stroke.length >= 2 ? cutRegion(stroke) : null;

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader
        item={item}
        fb={fb}
        result={share !== null ? `${Math.round(share * 1000) / 10}% / ${Math.round((1 - share) * 1000) / 10}%` : undefined}
      />
      <div className="mt-4 text-center">
        <div className="font-display text-xl font-bold">{item.data.name}</div>
        <p className="text-sm text-muted">
          {locked ? (share !== null ? `+${fb!.points} points` : 'Checking…') : 'Draw a line with your finger or mouse to cut it in half'}
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className={`aspect-square w-full max-w-[360px] touch-none select-none overflow-hidden rounded-2xl border border-line bg-surface ${locked ? '' : 'cursor-crosshair'}`}
          onPointerDown={(e) => {
            if (locked || drawing.current !== null) return;
            e.preventDefault();
            svgRef.current?.setPointerCapture?.(e.pointerId);
            drawing.current = e.pointerId;
            pts.current = [toBoard(e.clientX, e.clientY)];
            setStroke([...pts.current]);
          }}
          onPointerMove={(e) => {
            if (drawing.current !== e.pointerId || locked) return;
            // Coalesced events carry every point the finger passed through, not just one per frame.
            const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
            if (events.length) for (const ev of events) add(toBoard(ev.clientX, ev.clientY));
            else add(toBoard(e.clientX, e.clientY));
            flush();
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          {region ? (
            <>
              <defs>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  <path d={polyPath(region)} clipRule="evenodd" />
                </clipPath>
              </defs>
              {item.data.polys.map((p, i) => <path key={`b${i}`} d={polyPath(p)} fill="#ffb0a3" />)}
              <g clipPath={`url(#${clipId})`}>
                {item.data.polys.map((p, i) => <path key={`a${i}`} d={polyPath(p)} fill="#15788c" />)}
              </g>
              {/* How the cut was extended past its ends. */}
              <path
                d={`M${region[0][0]},${region[0][1]}L${stroke[0][0]},${stroke[0][1]}M${stroke[stroke.length - 1][0]},${stroke[stroke.length - 1][1]}L${region[stroke.length + 1][0]},${region[stroke.length + 1][1]}`}
                stroke="#ff6973"
                strokeWidth={0.6}
                strokeDasharray="1.5 1.5"
                fill="none"
              />
            </>
          ) : (
            item.data.polys.map((p, i) => <path key={i} d={polyPath(p)} fill="#46425e" stroke="#46425e" strokeWidth={0.3} />)
          )}
          {stroke.length > 0 && (
            <path
              d={strokePath(stroke)}
              stroke="#ff6973"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={locked ? 1 : 0.95}
            />
          )}
        </svg>
      </div>
    </div>
  );
}
