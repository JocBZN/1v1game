import { useEffect, useId, useRef, useState } from 'react';
import { play } from '../lib/sound';
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

/** Fractions (0..1) along a shot path where it turns sharply, i.e. where the ball hit a wall. */
function bounceFractions(path: readonly Pt[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < path.length - 2; i++) {
    const a = [path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]];
    const b = [path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]];
    const la = Math.hypot(a[0], a[1]);
    const lb = Math.hypot(b[0], b[1]);
    if (la < 0.3 || lb < 0.3) continue; // nearly stopped: no audible hit
    const cos = (a[0] * b[0] + a[1] * b[1]) / (la * lb);
    if (cos < 0.5 && (out.length === 0 || i / (path.length - 1) - out[out.length - 1] > 0.03)) out.push(i / (path.length - 1));
  }
  return out;
}

const SPARKS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + 0.2);

/** Club swing on release: backswing position → contact with the ball, then a short follow-through. */
const SWING_MS = 110;
const FOLLOW_MS = 170;
/** Gap between the ball and the club face: at contact, and the extra backswing at full power (course units). */
const CONTACT_GAP = BALL_R + 0.15;
const BACKSWING = 11;
const clubGap = (power: number) => CONTACT_GAP + 0.8 + power * BACKSWING;

/**
 * A putter seen from above, behind the ball, facing the shot direction (`angle`). `gap` is the
 * distance from the ball centre to the club face; a bigger gap is a bigger backswing.
 */
function Club({ at, angle, gap, opacity = 1, ids }: { at: Pt; angle: number; gap: number; opacity?: number; ids: { metal: string } }) {
  const deg = (angle * 180) / Math.PI;
  const x = -gap; // club face, in the rotated frame (shot goes towards +x)
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${deg})`} opacity={opacity} pointerEvents="none">
      {/* shadow */}
      <g transform="translate(0.7 1)" opacity={0.22}>
        <line x1={x - 1.3} y1={-4.5} x2={x - 6.5} y2={-26} stroke="#1d2b1d" strokeWidth={1.3} strokeLinecap="round" />
        <rect x={x - 2.6} y={-5} width={2.6} height={10} rx={1} fill="#1d2b1d" />
      </g>
      {/* shaft and grip, towards the player standing beside the ball */}
      <line x1={x - 1.3} y1={-4.5} x2={x - 5} y2={-19.5} stroke="#b9bfcc" strokeWidth={0.9} strokeLinecap="round" />
      <line x1={x - 4.8} y1={-18.8} x2={x - 6.6} y2={-26.5} stroke="#2e2b3d" strokeWidth={2} strokeLinecap="round" />
      {/* head */}
      <rect x={x - 2.6} y={-5} width={2.6} height={10} rx={1} fill={`url(#${ids.metal})`} stroke="#4b4f5e" strokeWidth={0.3} />
      <line x1={x - 0.25} y1={-4.2} x2={x - 0.25} y2={4.2} stroke="#eef0f4" strokeWidth={0.35} opacity={0.8} />
    </g>
  );
}

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
  /** The club swinging through after a release (drawn until the follow-through ends). */
  const [swing, setSwing] = useState<{ at: Pt; angle: number; gap: number; opacity: number } | null>(null);
  const swingRaf = useRef(0);
  const uid = useId().replace(/:/g, '');
  const ids = { grass: `g${uid}`, stripes: `s${uid}`, wood: `w${uid}`, rail: `r${uid}`, metal: `m${uid}`, ballG: `b${uid}`, cup: `c${uid}`, shade: `h${uid}` };
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const aimRef = useRef<{ angle: number; power: number } | null>(null);
  const frame = useRef(0);
  /** Feedback seq when the last shot was sent; null once its answer arrived. */
  const sentSeq = useRef<number | null>(null);
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
    cancelAnimationFrame(swingRaf.current);
    setSwing(null);
  }, [item?.round, item?.item]);

  // Animate the server's path for each shot: every frame, interpolated, straight on the SVG node.
  useEffect(() => {
    if (!item || !feedback || feedback.round !== item.round || feedback.item !== item.item) return;
    sentSeq.current = null;
    const path = feedback.path as Pt[] | undefined;
    if (!path?.length) {
      setBusy(false);
      return;
    }
    const dur = Math.max(1, pathDurationMs(path));
    setRolling(true);
    // A wall hit shows up as a sharp turn in the path: tick at those moments.
    const bounces = bounceFractions(path);
    let nextBounce = 0;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const f = Math.min(1, (now - t0) / dur);
      placeBall(pointAt(path, f));
      while (nextBounce < bounces.length && bounces[nextBounce] <= f) {
        play('bounce');
        nextBounce++;
      }
      if (f < 1) {
        raf = requestAnimationFrame(step);
        return;
      }
      const end = feedback.end as Pt;
      placeBall(end);
      setBallState(end);
      setRolling(false);
      setStrokes(feedback.strokes as number);
      if (feedback.holed) {
        setSunk(true);
        play('hole');
      }
      if (!feedback.itemDone) setBusy(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback?.seq]);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    cancelAnimationFrame(swingRaf.current);
  }, []);

  // Safety net: if a shot gets no answer (dropped connection, too late), don't leave the player stuck.
  useEffect(() => {
    if (!busy || rolling) return;
    const seqAtSend = sentSeq.current;
    const t = setTimeout(() => {
      if (sentSeq.current === seqAtSend) setBusy(false);
    }, 5_000);
    return () => clearTimeout(t);
  }, [busy, rolling]);

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
    const shoot = () => {
      play('putt');
      sentSeq.current = feedback?.seq ?? 0;
      onAnswer({ angle: a.angle, power: a.power });
    };
    if (still) return shoot();
    // Swing: the club comes forward from the backswing, hits the ball (the shot is sent at contact),
    // follows through a little and fades out.
    const at: Pt = [...ball.current];
    const g0 = clubGap(a.power);
    const t0 = performance.now();
    let hit = false;
    cancelAnimationFrame(swingRaf.current);
    const step = (now: number) => {
      const t = now - t0;
      if (t < SWING_MS) {
        const k = t / SWING_MS;
        setSwing({ at, angle: a.angle, gap: g0 + (CONTACT_GAP - g0) * k * k, opacity: 1 });
      } else {
        if (!hit) {
          hit = true;
          shoot();
        }
        const k = Math.min(1, (t - SWING_MS) / FOLLOW_MS);
        setSwing({ at, angle: a.angle, gap: CONTACT_GAP - (1 - (1 - k) * (1 - k)) * 6, opacity: 1 - k });
        if (k >= 1) {
          setSwing(null);
          return;
        }
      }
      swingRaf.current = requestAnimationFrame(step);
    };
    swingRaf.current = requestAnimationFrame(step);
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
        // Aiming may start while the ball is still rolling; the shot goes when it is released.
        if (done || (drag.current && drag.current.id !== e.pointerId && e.pointerType === 'touch')) return;
        e.preventDefault();
        areaRef.current?.setPointerCapture?.(e.pointerId);
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (drag.current?.id !== e.pointerId) return;
        updateAim(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={(e) => {
        if (drag.current?.id !== e.pointerId) return;
        drag.current = null;
        aimRef.current = null;
        setAim(null);
      }}
      onLostPointerCapture={(e) => {
        // Capture lost without a pointerup (e.g. a system gesture): forget the drag so the next touch works.
        if (drag.current?.id === e.pointerId) {
          drag.current = null;
          aimRef.current = null;
          setAim(null);
        }
      }}
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
          className="h-full max-h-[52vh] w-auto max-w-full overflow-visible"
          style={{ aspectRatio: `${course.w} / ${course.h}` }}
        >
          <defs>
            {/* Artificial turf: bright green with soft mowing stripes and a darker edge. */}
            <pattern id={ids.stripes} width={course.w} height={20} patternUnits="userSpaceOnUse">
              <rect width={course.w} height={10} fill="#4fae4a" />
              <rect y={10} width={course.w} height={10} fill="#47a443" />
            </pattern>
            <radialGradient id={ids.shade} cx="50%" cy="45%" r="75%">
              <stop offset="60%" stopColor="#000" stopOpacity={0} />
              <stop offset="100%" stopColor="#0b3d12" stopOpacity={0.28} />
            </radialGradient>
            {/* Wooden rails and obstacles. */}
            <linearGradient id={ids.rail} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#c98a55" />
              <stop offset="1" stopColor="#9c6235" />
            </linearGradient>
            <linearGradient id={ids.wood} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d79a63" />
              <stop offset="0.5" stopColor="#b97842" />
              <stop offset="1" stopColor="#8f5a31" />
            </linearGradient>
            <linearGradient id={ids.metal} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7d8394" />
              <stop offset="0.6" stopColor="#c7ccd8" />
              <stop offset="1" stopColor="#e9ecf2" />
            </linearGradient>
            <radialGradient id={ids.ballG} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.7" stopColor="#f1f1ee" />
              <stop offset="1" stopColor="#c9cbc4" />
            </radialGradient>
            <radialGradient id={ids.cup} cx="50%" cy="40%" r="60%">
              <stop offset="0" stopColor="#0d140d" />
              <stop offset="1" stopColor="#2c382c" />
            </radialGradient>
          </defs>

          {/* Wooden frame around the green (drawn outside the course box, like the rails of a real course). */}
          <rect x={-3} y={-3} width={course.w + 6} height={course.h + 6} rx={4} fill={`url(#${ids.rail})`} />
          <rect x={-3} y={-3} width={course.w + 6} height={course.h + 6} rx={4} fill="none" stroke="#7a4a27" strokeWidth={0.5} />
          <rect x={0} y={0} width={course.w} height={course.h} fill={`url(#${ids.stripes})`} />
          <rect x={0} y={0} width={course.w} height={course.h} fill={`url(#${ids.shade})`} />
          {/* inner lip of the rail */}
          <rect x={0} y={0} width={course.w} height={course.h} fill="none" stroke="#2f7a2c" strokeWidth={0.8} opacity={0.6} />

          {course.walls.map((w, i) => (
            <g key={i}>
              <rect x={w.x + 0.6} y={w.y + 0.9} width={w.w} height={w.h} rx={1} fill="#1f4d1c" opacity={0.35} />
              <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={1} fill={`url(#${ids.wood})`} stroke="#7a4a27" strokeWidth={0.35} />
              <rect x={w.x + 0.5} y={w.y + 0.35} width={Math.max(0, w.w - 1)} height={Math.min(0.6, w.h / 3)} rx={0.3} fill="#f0c08e" opacity={0.55} />
            </g>
          ))}

          {/* Hole: white cup rim, dark inside; short win effect: ripple, sparks and a flag wiggle. */}
          <circle cx={hx} cy={hy} r={HOLE_R + 0.7} fill="#f4f4ef" />
          <circle cx={hx} cy={hy} r={HOLE_R} fill={`url(#${ids.cup})`} />
          {sunk && !still && (
            <>
              <motion.circle
                cx={hx} cy={hy} fill="none" stroke="#ffffff" strokeWidth={0.8}
                initial={{ r: HOLE_R, opacity: 0.9 }}
                animate={{ r: HOLE_R * 4, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              {SPARKS.map((a, i) => (
                <motion.circle
                  key={i}
                  r={0.9}
                  fill={i % 2 ? '#ffd23f' : '#ffffff'}
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
              <line x1={0.5} y1={0.4} x2={6} y2={-10} stroke="#000" strokeWidth={0.6} opacity={0.15} />
              <line x1={0} y1={0} x2={0} y2={-13} stroke="#f4f4ef" strokeWidth={0.7} />
              <path d="M0,-13 l7,2.5 l-7,2.5 Z" fill="#e63b2e" />
            </motion.g>
          </g>

          {aim && !locked && (
            <g pointerEvents="none">
              <line
                x1={bx} y1={by}
                x2={bx + Math.cos(aim.angle) * guide} y2={by + Math.sin(aim.angle) * guide}
                stroke="#ffffff" strokeWidth={0.9} strokeDasharray="2 1.6" strokeLinecap="round" opacity={0.85}
              />
            </g>
          )}

          {/* The ball: moved every frame through its transform; drops into the hole when holed. */}
          <g ref={ballRef} transform={`translate(${ball.current[0]} ${ball.current[1]})`}>
            <motion.g
              initial={false}
              animate={sunk ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: sunk ? 0.25 : 0, ease: 'easeIn' }}
            >
              <ellipse cx={0.6} cy={0.9} rx={BALL_R} ry={BALL_R * 0.85} fill="#0b3d12" opacity={0.3} />
              <circle r={BALL_R} fill={`url(#${ids.ballG})`} stroke="#8d8f88" strokeWidth={0.2} />
            </motion.g>
          </g>

          {/* The club: follows the pull-back while aiming, swings through on release. */}
          {aim && !locked && <Club at={[bx, by]} angle={aim.angle} gap={clubGap(aim.power)} ids={ids} />}
          {swing && <Club at={swing.at} angle={swing.angle} gap={swing.gap} opacity={swing.opacity} ids={ids} />}
        </svg>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-red" style={{ width: `${(aim && !locked ? aim.power : 0) * 100}%` }} />
      </div>
    </div>
  );
}
