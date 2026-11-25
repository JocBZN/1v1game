/**
 * Tiny top-down mini-golf physics. Deterministic: the server simulates every shot and the client just
 * animates the returned path. Units: the course is W×H (100×150), y points down.
 */
export type Pt = [number, number];
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Course {
  w: number;
  h: number;
  start: Pt;
  hole: Pt;
  walls: Rect[];
}
export interface Shot {
  /** radians, 0 = right, π/2 = down */
  angle: number;
  /** 0..1 */
  power: number;
}

export const BALL_R = 2;
export const HOLE_R = 3.6;
export const MAX_SPEED = 230;
const DT = 1 / 120;
const DRAG = 0.986;
const ROLL = 7;
const BOUNCE = 0.72;
const CAPTURE_SPEED = 95;
const MAX_STEPS = 1800;
const SAMPLE_EVERY = 3;

export interface ShotResult {
  path: Pt[];
  end: Pt;
  holed: boolean;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function simulateShot(course: Course, from: Pt, shot: Shot): ShotResult {
  let [x, y] = from;
  const p = Math.max(0, Math.min(1, shot.power));
  let vx = Math.cos(shot.angle) * MAX_SPEED * p;
  let vy = Math.sin(shot.angle) * MAX_SPEED * p;
  const path: Pt[] = [[r1(x), r1(y)]];
  for (let step = 1; step <= MAX_STEPS; step++) {
    x += vx * DT;
    y += vy * DT;
    // course edges
    if (x < BALL_R) { x = BALL_R; vx = Math.abs(vx) * BOUNCE; }
    if (x > course.w - BALL_R) { x = course.w - BALL_R; vx = -Math.abs(vx) * BOUNCE; }
    if (y < BALL_R) { y = BALL_R; vy = Math.abs(vy) * BOUNCE; }
    if (y > course.h - BALL_R) { y = course.h - BALL_R; vy = -Math.abs(vy) * BOUNCE; }
    // obstacles (circle vs box)
    for (const r of course.walls) {
      const cx = Math.max(r.x, Math.min(x, r.x + r.w));
      const cy = Math.max(r.y, Math.min(y, r.y + r.h));
      let dx = x - cx;
      let dy = y - cy;
      let d = Math.hypot(dx, dy);
      if (d >= BALL_R) continue;
      if (d === 0) { dx = 0; dy = y < r.y + r.h / 2 ? -1 : 1; d = 1; }
      const nx = dx / d;
      const ny = dy / d;
      x = cx + nx * BALL_R;
      y = cy + ny * BALL_R;
      const vn = vx * nx + vy * ny;
      if (vn < 0) {
        vx -= (1 + BOUNCE) * vn * nx;
        vy -= (1 + BOUNCE) * vn * ny;
      }
    }
    const speed = Math.hypot(vx, vy);
    // the hole: slow enough over it → in
    if (Math.hypot(x - course.hole[0], y - course.hole[1]) < HOLE_R && speed < CAPTURE_SPEED) {
      path.push([course.hole[0], course.hole[1]]);
      return { path, end: [course.hole[0], course.hole[1]], holed: true };
    }
    // friction
    const next = Math.max(0, speed * DRAG - ROLL * DT);
    if (next < 1.2) {
      path.push([r1(x), r1(y)]);
      return { path, end: [r1(x), r1(y)], holed: false };
    }
    vx *= next / speed;
    vy *= next / speed;
    if (step % SAMPLE_EVERY === 0) path.push([r1(x), r1(y)]);
  }
  return { path, end: [r1(x), r1(y)], holed: false };
}

/** Milliseconds the client takes to animate a path (one sample = SAMPLE_EVERY physics steps). */
export const pathDurationMs = (path: readonly Pt[]) => Math.round(path.length * SAMPLE_EVERY * DT * 1000);

const OPEN: Course = { w: 5000, h: 5000, start: [2500, 2500], hole: [-100, -100], walls: [] };

/** Power that rolls a ball about `dist` units on open ground (bots use this to aim). */
export function powerForDistance(dist: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const { end } = simulateShot(OPEN, [2500, 2500], { angle: 0, power: mid });
    if (end[0] - 2500 < dist) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
