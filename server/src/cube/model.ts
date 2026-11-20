/**
 * Minimal 3×3×3 Rubik's Cube model.
 *
 * The cube is 54 stickers. Each sticker sits on a cubie at integer position p ∈ {-1,0,1}³ and faces
 * outward along the unit normal n. A move turns one layer (all stickers with p[axis] === layer) by 90°
 * around an axis; positions and normals rotate together. Colours never change, only where they are.
 *
 * Axes: x → right (R/L), y → up (U/D), z → front (F/B). `dir: 1` is a counter-clockwise quarter turn
 * when looking from the positive end of the axis towards the origin (right-hand rule).
 */

export type Axis = 'x' | 'y' | 'z';
export type Vec3 = [number, number, number];

export interface Sticker {
  p: Vec3;
  n: Vec3;
  /** colour index, see COLORS */
  c: number;
}

export interface CubeMove {
  axis: Axis;
  layer: -1 | 0 | 1;
  dir: 1 | -1;
}

/** U white, D yellow, F green, B blue, R red, L orange (standard Western scheme). */
export const COLORS = ['white', 'yellow', 'green', 'blue', 'red', 'orange'] as const;

const FACES: { n: Vec3; c: number }[] = [
  { n: [0, 1, 0], c: 0 },
  { n: [0, -1, 0], c: 1 },
  { n: [0, 0, 1], c: 2 },
  { n: [0, 0, -1], c: 3 },
  { n: [1, 0, 0], c: 4 },
  { n: [-1, 0, 0], c: 5 },
];

const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

export function solvedCube(): Sticker[] {
  const out: Sticker[] = [];
  for (const f of FACES) {
    const k = f.n.findIndex((v) => v !== 0);
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const p: Vec3 = [0, 0, 0];
        const others = [0, 1, 2].filter((i) => i !== k);
        p[k] = f.n[k];
        p[others[0]] = a;
        p[others[1]] = b;
        out.push({ p, n: [...f.n] as Vec3, c: f.c });
      }
    }
  }
  return out;
}

/** Quarter-turn rotation of a vector around an axis. */
export function rotateVec(v: Vec3, axis: Axis, dir: 1 | -1): Vec3 {
  const [x, y, z] = v;
  const r: Vec3 =
    axis === 'x'
      ? dir === 1 ? [x, -z, y] : [x, z, -y]
      : axis === 'y'
        ? dir === 1 ? [z, y, -x] : [-z, y, x]
        : dir === 1 ? [-y, x, z] : [y, -x, z];
  // normalise -0 → 0 so JSON/equality stay clean
  return r.map((n) => (n === 0 ? 0 : n)) as Vec3;
}

export function applyMove(stickers: readonly Sticker[], m: CubeMove): Sticker[] {
  const i = AXIS_INDEX[m.axis];
  return stickers.map((s) => (s.p[i] === m.layer ? { p: rotateVec(s.p, m.axis, m.dir), n: rotateVec(s.n, m.axis, m.dir), c: s.c } : s));
}

export function applyMoves(stickers: readonly Sticker[], moves: readonly CubeMove[]): Sticker[] {
  let s = stickers as Sticker[];
  for (const m of moves) s = applyMove(s, m);
  return s;
}

const key = (v: Vec3) => v.join(',');

/** Stickers on the face with outward normal n. */
function face(stickers: readonly Sticker[], n: Vec3): Sticker[] {
  const k = key(n);
  return stickers.filter((s) => key(s.n) === k);
}

/** Centre sticker of a face: the one whose position has exactly one non-zero coordinate. */
function centreColour(stickers: readonly Sticker[], n: Vec3): number {
  return face(stickers, n).find((s) => s.p.filter((v) => v !== 0).length === 1)!.c;
}

export function isSolved(stickers: readonly Sticker[]): boolean {
  return FACES.every((f) => {
    const st = face(stickers, f.n);
    return st.every((s) => s.c === st[0].c);
  });
}

/**
 * Progress 0..48: non-centre stickers that already match the centre colour of the face they're on.
 * 48 ⇔ solved.
 */
export function progress(stickers: readonly Sticker[]): number {
  let n = 0;
  for (const f of FACES) {
    const centre = centreColour(stickers, f.n);
    for (const s of face(stickers, f.n)) if (s.c === centre) n++;
  }
  return n - 6;
}

export function parseMove(x: unknown): CubeMove | null {
  if (!x || typeof x !== 'object') return null;
  const { axis, layer, dir } = x as Record<string, unknown>;
  if (axis !== 'x' && axis !== 'y' && axis !== 'z') return null;
  if (layer !== -1 && layer !== 0 && layer !== 1) return null;
  if (dir !== 1 && dir !== -1) return null;
  return { axis, layer, dir };
}

/** Random scramble of outer-layer quarter turns (no immediate undo, no 3 turns of the same layer in a row). */
export function scramble(rand: () => number, length = 25): CubeMove[] {
  const axes: Axis[] = ['x', 'y', 'z'];
  const out: CubeMove[] = [];
  while (out.length < length) {
    const m: CubeMove = {
      axis: axes[Math.floor(rand() * 3)],
      layer: rand() < 0.5 ? -1 : 1,
      dir: rand() < 0.5 ? -1 : 1,
    };
    const last = out[out.length - 1];
    const prev = out[out.length - 2];
    const sameLayer = (a?: CubeMove) => a && a.axis === m.axis && a.layer === m.layer;
    if (sameLayer(last) && last!.dir !== m.dir) continue; // immediate undo
    if (sameLayer(last) && sameLayer(prev)) continue; // three in a row
    out.push(m);
  }
  return out;
}

export const inverse = (m: CubeMove): CubeMove => ({ ...m, dir: (m.dir * -1) as 1 | -1 });
