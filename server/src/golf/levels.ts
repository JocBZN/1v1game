/**
 * Random mini-golf courses in a few layouts, from easy to properly hard, plus a small solver that the
 * generator (every course must be finishable in 3 shots) and the bot share.
 *
 * Courses keep the original shape { w, h, start, hole, walls: Rect[] }, so old recordings still replay.
 */
import { clamp, type Rng } from '../rng';
import { BALL_R, HOLE_R, simulateShot, type Course, type Pt, type Rect, type Shot } from './physics';

export const COURSE_W = 100;
export const COURSE_H = 150;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Layout = 'open' | 'gate' | 'slalom' | 'doubleGate' | 'bunker' | 'corridor';

const LAYOUTS: Record<Difficulty, Layout[]> = {
  easy: ['open', 'gate'],
  medium: ['gate', 'slalom', 'bunker'],
  hard: ['doubleGate', 'bunker', 'corridor', 'slalom'],
};

/** Hole 1 is a warm-up, hole 3 is always hard. */
export const ROUND_DIFFICULTY: Difficulty[][] = [['easy', 'medium'], ['medium', 'hard'], ['hard']];

const T = 5; // wall thickness

function inflate(r: Rect, p: Pt, pad: number) {
  return p[0] > r.x - pad && p[0] < r.x + r.w + pad && p[1] > r.y - pad && p[1] < r.y + r.h + pad;
}

/** A wall across the whole width with one gap (gap x = left edge of the opening). */
function gateWalls(y: number, gapX: number, gapW: number): Rect[] {
  const out: Rect[] = [];
  if (gapX > 0.5) out.push({ x: 0, y, w: gapX, h: T });
  const right = gapX + gapW;
  if (right < COURSE_W - 0.5) out.push({ x: right, y, w: COURSE_W - right, h: T });
  return out;
}

function layoutCourse(layout: Layout, rng: Rng): Course {
  let start: Pt = [rng.int(20, 80), rng.int(128, 138)];
  let hole: Pt = [rng.int(16, 84), rng.int(16, 30)];
  let walls: Rect[] = [];

  switch (layout) {
    case 'open': {
      // One block across the straight line: go around it or bank off the side.
      const w = rng.int(26, 46);
      const t = rng.int(40, 60) / 100;
      const cx = start[0] + (hole[0] - start[0]) * t + rng.int(-6, 6);
      const cy = start[1] + (hole[1] - start[1]) * t;
      walls = [{ x: clamp(Math.round(cx - w / 2), 0, COURSE_W - w), y: Math.round(cy), w, h: T + 1 }];
      break;
    }
    case 'gate': {
      const gapW = rng.int(18, 26);
      walls = gateWalls(rng.int(62, 88), rng.int(4, COURSE_W - gapW - 4), gapW);
      break;
    }
    case 'doubleGate': {
      const gapW = rng.int(15, 20);
      const leftFirst = rng.chance(0.5);
      const g1 = leftFirst ? rng.int(4, 26) : rng.int(COURSE_W - gapW - 26, COURSE_W - gapW - 4);
      const g2 = leftFirst ? rng.int(COURSE_W - gapW - 26, COURSE_W - gapW - 4) : rng.int(4, 26);
      walls = [...gateWalls(rng.int(92, 104), g1, gapW), ...gateWalls(rng.int(48, 60), g2, gapW)];
      break;
    }
    case 'slalom': {
      // Three bars from alternating sides; the ball has to snake between them.
      let fromLeft = rng.chance(0.5);
      const ys = [rng.int(100, 106), rng.int(76, 82), rng.int(50, 56)];
      for (const y of ys) {
        const len = rng.int(58, 70);
        walls.push({ x: fromLeft ? 0 : COURSE_W - len, y, w: len, h: T });
        fromLeft = !fromLeft;
      }
      break;
    }
    case 'bunker': {
      // The hole sits in a box open on one side that never faces the tee.
      hole = [rng.int(28, 72), rng.int(34, 62)];
      const half = rng.int(11, 14);
      const [hx, hy] = hole;
      const top: Rect = { x: hx - half, y: hy - half - T, w: 2 * half, h: T };
      const bottom: Rect = { x: hx - half, y: hy + half, w: 2 * half, h: T };
      const left: Rect = { x: hx - half - T, y: hy - half - T, w: T, h: 2 * half + 2 * T };
      const right: Rect = { x: hx + half, y: hy - half - T, w: T, h: 2 * half + 2 * T };
      const open = rng.pick(['top', 'left', 'right'] as const);
      walls = [bottom, ...(open === 'top' ? [left, right] : open === 'left' ? [top, right] : [top, left])];
      walls = walls.map((r) => ({ ...r, x: clamp(r.x, 0, COURSE_W - r.w) }));
      if (rng.chance(0.5)) walls.push(...gateWalls(rng.int(96, 106), rng.int(6, COURSE_W - 30), rng.int(20, 26)));
      break;
    }
    case 'corridor': {
      // A narrow channel to the hole, entered from below, with a block in front of the entrance.
      const chW = rng.int(17, 21);
      const chX = rng.int(14, COURSE_W - chW - 14);
      hole = [chX + chW / 2, rng.int(16, 22)];
      const chBottom = rng.int(66, 78);
      walls = [
        { x: chX - T, y: 8, w: T, h: chBottom - 8 },
        { x: chX + chW, y: 8, w: T, h: chBottom - 8 },
        { x: 0, y: 8, w: chX - T, h: T },
        { x: chX + chW + T, y: 8, w: COURSE_W - (chX + chW + T), h: T },
      ];
      const bw = rng.int(26, 34);
      walls.push({ x: clamp(Math.round(chX + chW / 2 - bw / 2 + rng.int(-6, 6)), 0, COURSE_W - bw), y: chBottom + rng.int(14, 22), w: bw, h: T });
      start = [rng.chance(0.5) ? rng.int(12, 34) : rng.int(66, 88), rng.int(130, 138)];
      break;
    }
  }
  walls = walls.filter((r) => r.w > 0.5 && r.h > 0.5).map((r) => ({ x: round1(r.x), y: round1(r.y), w: round1(r.w), h: round1(r.h) }));
  hole = [round1(hole[0]), round1(hole[1])];
  return { w: COURSE_W, h: COURSE_H, start, hole, walls };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function clearOf(course: Course): boolean {
  return !course.walls.some((r) => inflate(r, course.start, BALL_R + 3) || inflate(r, course.hole, HOLE_R + 1));
}

// ------------------------------------------------------------------ solver

const CELL = 2;

/**
 * Walking distance to the hole (course units) for every cell, going around walls. Plain Euclidean
 * distance would make the bot and the solver bash into the gate instead of going through the gap.
 */
export function distanceField(course: Course): (p: Pt) => number {
  const cols = Math.ceil(course.w / CELL);
  const rows = Math.ceil(course.h / CELL);
  const blocked = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p: Pt = [(c + 0.5) * CELL, (r + 0.5) * CELL];
      if (course.walls.some((w) => inflate(w, p, BALL_R * 0.75))) blocked[r * cols + c] = 1;
    }
  }
  const dist = new Float32Array(cols * rows).fill(Infinity);
  const hc = Math.min(cols - 1, Math.floor(course.hole[0] / CELL));
  const hr = Math.min(rows - 1, Math.floor(course.hole[1] / CELL));
  // Dijkstra-light: 8-neighbour BFS with a bucket queue is overkill here; a simple queue with
  // relaxations converges quickly on a grid this small.
  const queue: number[] = [hr * cols + hc];
  dist[hr * cols + hc] = 0;
  const steps = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    const r = Math.floor(cur / cols);
    const c = cur % cols;
    for (const [dc, dr, cost] of steps) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const n = nr * cols + nc;
      if (blocked[n]) continue;
      const nd = dist[cur] + cost * CELL;
      if (nd < dist[n] - 1e-6) {
        dist[n] = nd;
        queue.push(n);
      }
    }
  }
  return ([x, y]) => {
    const c = clamp(Math.floor(x / CELL), 0, cols - 1);
    const r = clamp(Math.floor(y / CELL), 0, rows - 1);
    const d = dist[r * cols + c];
    return Number.isFinite(d) ? d + Math.hypot(x - course.hole[0], y - course.hole[1]) * 0.01 : 1e6;
  };
}

/** Best shot from `from` by sampling angles and powers, judged by walking distance to the hole. */
export function bestShot(course: Course, from: Pt, field = distanceField(course), angles = 32, powers = 5, refine = 24): { shot: Shot; end: Pt; holed: boolean; score: number } {
  let best = { shot: { angle: 0, power: 0.5 } as Shot, end: from, holed: false, score: Infinity };
  for (let a = 0; a < angles; a++) {
    const angle = (a / angles) * Math.PI * 2;
    for (let p = 1; p <= powers; p++) {
      const power = p / powers;
      const res = simulateShot(course, from, { angle, power });
      const score = res.holed ? -1 : field(res.end);
      if (score < best.score) best = { shot: { angle, power }, end: res.end, holed: res.holed, score };
    }
  }
  // Refine around the best sample.
  for (let i = 0; i < refine && !best.holed; i++) {
    const angle = best.shot.angle + ((i % 8) - 3.5) * (Math.PI / angles / 4);
    const power = clamp(best.shot.power + (Math.floor(i / 8) - 1) * (0.5 / powers), 0.04, 1);
    const res = simulateShot(course, from, { angle, power });
    const score = res.holed ? -1 : field(res.end);
    if (score < best.score) best = { shot: { angle, power }, end: res.end, holed: res.holed, score };
  }
  return best;
}

/** Greedy play: the number of shots it takes to hole out (Infinity if not within `maxStrokes`). */
export function greedyStrokes(course: Course, maxStrokes = 3): number {
  const field = distanceField(course);
  let pos = course.start;
  for (let s = 1; s <= maxStrokes; s++) {
    const b = bestShot(course, pos, field);
    if (b.holed) return s;
    pos = b.end;
  }
  return Infinity;
}

/** A random course of the given difficulty that a careful player can finish in 3 shots. */
export function generateCourse(rng: Rng, difficulty: Difficulty): Course {
  let fallback: Course | null = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const course = layoutCourse(rng.pick(LAYOUTS[difficulty]), rng);
    if (!clearOf(course)) continue;
    fallback ??= course;
    const n = greedyStrokes(course, 3);
    // Easy holes should not be trivial hole-in-ones every time, hard ones must still be possible.
    if (n <= 3) return course;
  }
  return fallback ?? layoutCourse('open', rng);
}

export function generateRoundCourses(rng: Rng): Course[] {
  return ROUND_DIFFICULTY.map((options) => generateCourse(rng, rng.pick(options)));
}
