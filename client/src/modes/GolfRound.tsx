import { useEffect, useRef, useState } from 'react';
import { BALL_R, HOLE_R, pathDurationMs, type Course, type Pt } from '../../../server/src/golf/physics';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';

interface GolfData {
  course: Course;
  pos: Pt;
  strokes: number;
  maxStrokes: number;
  index: number;
  total: number;
}

const PULL_FOR_FULL = 42; // course units of pull-back for full power

export function GolfRound({ item, feedback, onAnswer, waiting }: ModeProps<GolfData>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ball, setBall] = useState<Pt>([0, 0]);
  const [strokes, setStrokes] = useState(0);
  const [aim, setAim] = useState<{ angle: number; power: number } | null>(null);
  const [busy, setBusy] = useState(false); // shot sent / ball rolling
  const dragStart = useRef<Pt | null>(null);

  useEffect(() => {
    if (!item) return;
    setBall(item.data.pos);
    setStrokes(item.data.strokes);
    setAim(null);
    setBusy(false);
  }, [item?.round, item?.item]);

  // Animate the server's path for each shot.
  useEffect(() => {
    if (!item || !feedback || feedback.round !== item.round || feedback.item !== item.item) return;
    const path = feedback.path as Pt[] | undefined;
    if (!path?.length) {
      setBusy(false);
      return;
    }
    const dur = pathDurationMs(path);
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const f = Math.min(1, (performance.now() - t0) / dur);
      const i = Math.min(path.length - 1, Math.floor(f * (path.length - 1)));
      setBall(path[i]);
      if (f < 1) raf = requestAnimationFrame(step);
      else {
        setBall(feedback.end as Pt);
        setStrokes(feedback.strokes as number);
        if (!feedback.itemDone) setBusy(false);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [feedback?.seq]);

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const { course, maxStrokes } = item.data;
  const done = !!fb?.itemDone;
  const locked = busy || done;

  const toCourse = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * course.w, ((e.clientY - r.top) / r.height) * course.h];
  };

  const holed = done && fb?.holed === true;
  const result = done ? (holed ? `In! +${fb!.points}` : `+${fb!.points}`) : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader item={item} fb={done ? fb : null} result={result} />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">Pull back from anywhere, release to shoot</span>
        <span className="font-semibold tabular-nums">Shot {Math.min(strokes + (done ? 0 : 1), maxStrokes)} / {maxStrokes}</span>
      </div>
      <div className="flex flex-1 items-center justify-center py-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${course.w} ${course.h}`}
          className="h-full max-h-[52vh] w-auto max-w-full touch-none select-none rounded-2xl"
          style={{ aspectRatio: `${course.w} / ${course.h}` }}
          onPointerDown={(e) => {
            if (locked) return;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            dragStart.current = toCourse(e);
          }}
          onPointerMove={(e) => {
            if (!dragStart.current || locked) return;
            const p = toCourse(e);
            const dx = dragStart.current[0] - p[0];
            const dy = dragStart.current[1] - p[1];
            const len = Math.hypot(dx, dy);
            setAim(len < 2 ? null : { angle: Math.atan2(dy, dx), power: Math.min(1, len / PULL_FOR_FULL) });
          }}
          onPointerUp={() => {
            dragStart.current = null;
            if (!aim || locked || aim.power < 0.04) {
              setAim(null);
              return;
            }
            setBusy(true);
            onAnswer({ angle: aim.angle, power: aim.power });
            setAim(null);
          }}
        >
          <rect x={0} y={0} width={course.w} height={course.h} fill="#d2f0ef" />
          <rect x={0.6} y={0.6} width={course.w - 1.2} height={course.h - 1.2} fill="none" stroke="#15788c" strokeWidth={1.2} rx={3} />
          {course.walls.map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} rx={1.2} fill="#46425e" />
          ))}
          <circle cx={course.hole[0]} cy={course.hole[1]} r={HOLE_R} fill="#46425e" />
          <line x1={course.hole[0]} y1={course.hole[1]} x2={course.hole[0]} y2={course.hole[1] - 13} stroke="#46425e" strokeWidth={0.6} />
          <path d={`M${course.hole[0]},${course.hole[1] - 13} l7,2.5 l-7,2.5 Z`} fill="#ff6973" />
          {aim && (
            <>
              <line
                x1={ball[0]} y1={ball[1]}
                x2={ball[0] + Math.cos(aim.angle) * (8 + aim.power * 34)} y2={ball[1] + Math.sin(aim.angle) * (8 + aim.power * 34)}
                stroke="#ff6973" strokeWidth={1.1} strokeDasharray="2 1.6" strokeLinecap="round"
              />
              <circle cx={ball[0]} cy={ball[1]} r={BALL_R + 3 + aim.power * 4} fill="none" stroke="#ff6973" strokeWidth={0.5} opacity={0.6} />
            </>
          )}
          {!holed && <circle cx={ball[0]} cy={ball[1]} r={BALL_R} fill="#fff" stroke="#46425e" strokeWidth={0.5} />}
        </svg>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-red transition-[width] duration-75" style={{ width: `${(aim?.power ?? 0) * 100}%` }} />
      </div>
    </div>
  );
}
