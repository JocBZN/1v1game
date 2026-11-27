import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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

/** Screen pixels of pull-back for full power (independent of how big the course is drawn). */
const PULL_PX_FOR_FULL = 150;
const MIN_POWER = 0.04;

/** Position along a sampled path at fraction f (0..1), interpolated between samples. */
function pointAt(path: readonly Pt[], f: number): Pt {
  if (path.length === 1) return path[0];
  const x = f * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(x));
  const t = x - i;
  const a = path[i];
  const b = path[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const SPARKS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + 0.2);

export function GolfRound({ item, feedback, onAnswer, waiting }: ModeProps<GolfData>) {
  const areaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const ball = useRef<Pt>([0, 0]);
  const [ballState, setBallState] = useState<Pt>([0, 0]);
  const [strokes, setStrokes] = useState(0);
  const [aim, setAim] = useState<{ angle: number; power: number } | null>(null);
  const [busy, setBusy] = useState(false); // shot sent / ball rolling
  const [sunk, setSunk] = useState(false); // win animation
  const [rolling, setRolling] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const aimRef = useRef<{ angle: number; power: number } | null>(null);
  const frame = useRef(0);
  const still = useReducedMotion();

  const placeBall = (p: Pt) => {
    ball.current = p;
    ballRef.current?.setAttribute('transform', `translate(${p[0]} ${p[1]})`);
  };

  useEffect(() => {
    if (!item) return;
    placeBall(item.data.pos);
    setBallState(item.data.pos);
    setStrokes(item.data.strokes);
    setAim(null);
    aimRef.current = null;
    drag.current = null;
    setBusy(false);
    setSunk(false);
    setRolling(false);
  }, [item?.round, item?.item]);

  // Animate the server's path for each shot: every frame, interpolated, straight on the SVG node.
  useEffect(() => {
    if (!item || !feedback || feedback.round !== item.round || feedback.item !== item.item) return;
    const path = feedback.path as Pt[] | undefined;
    if (!path?.length) {
      setBusy(false);
      return;
    }
    const dur = Math.max(1, pathDurationMs(path));
    setRolling(true);
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const f = Math.min(1, (now - t0) / dur);
      placeBall(pointAt(path, f));
      if (f < 1) {
        raf = requestAnimationFrame(step);
        return;
      }
      const end = feedback.end as Pt;
      placeBall(end);
      setBallState(end);
      setRolling(false);
      setStrokes(feedback.strokes as number);
      if (feedback.holed) setSunk(true);
      if (!feedback.itemDone) setBusy(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback?.seq]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const { course, maxStrokes } = item.data;
  const done = !!fb?.itemDone;
  const locked = busy || done;

  /** Aim from the pull-back in screen pixels, so it feels the same wherever the drag starts. */
  const updateAim = (clientX: number, clientY: number) => {
    const d = drag.current;
    if (!d) return;
    const dx = d.x - clientX;
    const dy = d.y - clientY;
    const len = Math.hypot(dx, dy);
    aimRef.current = len < 6 ? null : { angle: Math.atan2(dy, dx), power: Math.min(1, len / PULL_PX_FOR_FULL) };
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        setAim(aimRef.current);
      });
    }
  };

  const release = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    updateAim(e.clientX, e.clientY);
    drag.current = null;
    const a = aimRef.current;
    aimRef.current = null;
    setAim(null);
    if (!a || locked || a.power < MIN_POWER) return;
    setBusy(true);
    onAnswer({ angle: a.angle, power: a.power });
  };

  const holed = done && fb?.holed === true;
  // The verdict arrives with the shot; show it once the ball has stopped.
  const shown = done && !rolling;
  const result = shown ? (holed ? `In! +${fb!.points}` : `+${fb!.points}`) : undefined;
  const [bx, by] = ballState;
  const [hx, hy] = course.hole;
  const guide = aim ? 8 + aim.power * 34 : 0;

  return (
    <div
      ref={areaRef}
      className={`flex flex-1 touch-none select-none flex-col ${locked ? '' : 'cursor-grab active:cursor-grabbing'}`}
      onPointerDown={(e) => {
        if (locked || drag.current) return;
        e.preventDefault();
        areaRef.current?.setPointerCapture?.(e.pointerId);
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (drag.current?.id !== e.pointerId || locked) return;
        updateAim(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <ItemHeader item={item} fb={shown ? fb : null} result={result} />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">Pull back anywhere, release to shoot</span>
        <span className="font-semibold tabular-nums">Shot {Math.min(strokes + (done ? 0 : 1), maxStrokes)} / {maxStrokes}</span>
      </div>
      <div className="flex flex-1 items-center justify-center py-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${course.w} ${course.h}`}
          className="h-full max-h-[52vh] w-auto max-w-full rounded-2xl"
          style={{ aspectRatio: `${course.w} / ${course.h}` }}
        >
          <rect x={0} y={0} width={course.w} height={course.h} fill="#d2f0ef" />
          <rect x={0.6} y={0.6} width={course.w - 1.2} height={course.h - 1.2} fill="none" stroke="#15788c" strokeWidth={1.2} rx={3} />
          {course.walls.map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} rx={1.2} fill="#46425e" />
          ))}

          {/* Hole, with a short win effect: ripple, sparks and a flag wiggle (under a second). */}
          <circle cx={hx} cy={hy} r={HOLE_R} fill="#46425e" />
          {sunk && !still && (
            <>
              <motion.circle
                cx={hx} cy={hy} fill="none" stroke="#15788c" strokeWidth={0.8}
                initial={{ r: HOLE_R, opacity: 0.9 }}
                animate={{ r: HOLE_R * 4, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              {SPARKS.map((a, i) => (
                <motion.circle
                  key={i}
                  r={0.9}
                  fill={i % 2 ? '#ff6973' : '#ffb0a3'}
                  initial={{ cx: hx, cy: hy, opacity: 1 }}
                  animate={{ cx: hx + Math.cos(a) * 11, cy: hy + Math.sin(a) * 11, opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut', delay: 0.05 }}
                />
              ))}
            </>
          )}
          <g transform={`translate(${hx} ${hy})`}>
            {/* Pivot at the foot of the pole (left/bottom of this group's box). */}
            <motion.g
              style={{ originX: 0, originY: 1 }}
              animate={sunk && !still ? { rotate: [0, -9, 7, -3, 0] } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <line x1={0} y1={0} x2={0} y2={-13} stroke="#46425e" strokeWidth={0.6} />
              <path d="M0,-13 l7,2.5 l-7,2.5 Z" fill="#ff6973" />
            </motion.g>
          </g>

          {aim && !locked && (
            <g pointerEvents="none">
              <line
                x1={bx} y1={by}
                x2={bx + Math.cos(aim.angle) * guide} y2={by + Math.sin(aim.angle) * guide}
                stroke="#ff6973" strokeWidth={1.1} strokeDasharray="2 1.6" strokeLinecap="round"
              />
              <circle cx={bx} cy={by} r={BALL_R + 3 + aim.power * 4} fill="none" stroke="#ff6973" strokeWidth={0.5} opacity={0.6} />
            </g>
          )}

          {/* The ball: moved every frame through its transform; drops into the hole when holed. */}
          <g ref={ballRef} transform={`translate(${ball.current[0]} ${ball.current[1]})`}>
            <motion.g
              initial={false}
              animate={sunk ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: sunk ? 0.25 : 0, ease: 'easeIn' }}
            >
              <circle cx={0.35} cy={0.5} r={BALL_R} fill="#46425e" opacity={0.18} />
              <circle r={BALL_R} fill="#fff" stroke="#46425e" strokeWidth={0.5} />
            </motion.g>
          </g>
        </svg>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-red" style={{ width: `${(aim && !locked ? aim.power : 0) * 100}%` }} />
      </div>
    </div>
  );
}
