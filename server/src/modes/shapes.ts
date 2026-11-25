/**
 * Shapes for "Split the shape". Each shape is a set of NON-overlapping polygons (so areas add up),
 * in a 100×100 box with y pointing down. Pure geometry, shared with the client for drawing.
 */
export type Pt = [number, number];
export type Poly = Pt[];
export interface ShapeDef {
  id: string;
  name: string;
  polys: Poly[];
}

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });

/** Pixel art: '#' cells become unit squares (scaled), rows top to bottom. */
function pixels(rows: string[]): Poly[] {
  const w = Math.max(...rows.map((r) => r.length));
  const cell = 100 / Math.max(w, rows.length);
  const out: Poly[] = [];
  rows.forEach((r, y) => {
    // merge horizontal runs into one rectangle each (fewer polygons, same area)
    let x = 0;
    while (x < r.length) {
      if (r[x] !== '#') { x++; continue; }
      const s = x;
      while (x < r.length && r[x] === '#') x++;
      out.push([[s * cell, y * cell], [x * cell, y * cell], [x * cell, (y + 1) * cell], [s * cell, (y + 1) * cell]]);
    }
  });
  return out;
}

const D = Math.PI / 180;

function star(points: number, rOut: number, rIn: number): Poly {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? rIn : rOut;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as Pt;
  });
}

function heart(): Poly {
  return Array.from({ length: 72 }, (_, i) => {
    const t = (i / 72) * 2 * Math.PI;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [50 + x * 2.8, 48 - y * 2.8] as Pt;
  });
}

function catHead(): Poly {
  const out: Pt[] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    if (i === 40) out.push([22, 4]); // left ear tip (around 225°)
    if (i === 56) out.push([78, 4]); // right ear tip (around 315°)
    if ((i >= 37 && i <= 43) || (i >= 53 && i <= 59)) continue; // the ear replaces this stretch
    out.push([50 + 40 * Math.cos(a), 58 + 34 * Math.sin(a)]);
  }
  return out;
}

export const SHAPES: ShapeDef[] = [
  {
    id: 'alien', name: 'Pixel alien', polys: pixels([
      '..#.....#..',
      '...#...#...',
      '..#######..',
      '.##.###.##.',
      '###########',
      '#.#######.#',
      '#.#.....#.#',
      '...##.##...',
    ]),
  },
  {
    id: 'ghost', name: 'Arcade ghost', polys: [[
      ...arc(50, 42, 34, 34, Math.PI, 2 * Math.PI),
      [84, 90], [72, 80], [61, 90], [50, 80], [39, 90], [28, 80], [16, 90],
    ]],
  },
  { id: 'chomper', name: 'Chomper', polys: [[[50, 50], ...arc(50, 50, 42, 42, 35 * D, 325 * D, 40)]] },
  { id: 'bolt', name: 'Lightning bolt', polys: [[[58, 4], [20, 56], [46, 56], [34, 96], [80, 38], [53, 38], [66, 4]]] },
  { id: 'star', name: 'Star', polys: [star(5, 46, 19)] },
  {
    id: 'rocket', name: 'Rocket', polys: [[
      [50, 2], [62, 18], [64, 62], [80, 80], [80, 92], [62, 82], [58, 90], [42, 90], [38, 82], [20, 92], [20, 80], [36, 62], [38, 18],
    ]],
  },
  {
    id: 'mushroom', name: 'Mushroom', polys: [
      [...arc(50, 52, 46, 44, Math.PI, 2 * Math.PI)],
      [[36, 52], [64, 52], [66, 94], [34, 94]],
    ],
  },
  { id: 'crown', name: 'Crown', polys: [[[8, 80], [8, 24], [30, 50], [50, 14], [70, 50], [92, 24], [92, 80]]] },
  { id: 'cat', name: 'Cat head', polys: [catHead()] },
  {
    id: 'sword', name: 'Sword', polys: [[
      [50, 2], [57, 12], [57, 64], [74, 64], [74, 71], [55, 71], [55, 90], [60, 96], [40, 96], [45, 90], [45, 71], [26, 71], [26, 64], [43, 64], [43, 12],
    ]],
  },
  { id: 'heart', name: 'Heart', polys: [heart()] },
  { id: 'tblock', name: 'T block', polys: pixels(['###', '.#.']) },
  { id: 'lblock', name: 'L block', polys: pixels(['#..', '#..', '###']) },
  { id: 'sblock', name: 'S block', polys: pixels(['.##', '##.']) },
  {
    id: 'pixheart', name: '8-bit heart', polys: pixels([
      '.##...##.',
      '####.####',
      '#########',
      '#########',
      '.#######.',
      '..#####..',
      '...###...',
      '....#....',
    ]),
  },
  { id: 'pizza', name: 'Pizza slice', polys: [[[50, 96], ...arc(50, 96, 52, 52, 238 * D, 302 * D, 16)]] },
  {
    id: 'controller', name: 'Game controller', polys: [[
      ...arc(28, 50, 20, 22, 90 * D, 270 * D, 14), [72, 28], ...arc(72, 50, 20, 22, -90 * D, 90 * D, 14), [60, 72], [40, 72],
    ]],
  },
];

// ------------------------------------------------------------------ geometry

export function polyArea(p: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** Keep the part of polygon `p` on the side of line a→b where cross(b−a, q−a) ≥ 0 (Sutherland–Hodgman). */
export function clipHalf(p: readonly Pt[], a: Pt, b: Pt): Pt[] {
  const side = (q: Pt) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
  const out: Pt[] = [];
  for (let i = 0; i < p.length; i++) {
    const cur = p[i];
    const nxt = p[(i + 1) % p.length];
    const sc = side(cur);
    const sn = side(nxt);
    if (sc >= 0) out.push(cur);
    if ((sc >= 0) !== (sn >= 0)) {
      const t = sc / (sc - sn);
      out.push([cur[0] + (nxt[0] - cur[0]) * t, cur[1] + (nxt[1] - cur[1]) * t]);
    }
  }
  return out;
}

/** Share (0..1) of the total area on the "left" side of the infinite line through a and b. */
export function splitShare(polys: readonly Poly[], a: Pt, b: Pt): number {
  let total = 0;
  let left = 0;
  for (const p of polys) {
    total += polyArea(p);
    left += polyArea(clipHalf(p, a, b));
  }
  return total > 0 ? left / total : 0;
}

/** Rotate/mirror a shape and fit it into the 100×100 box with a margin. */
export function placeShape(polys: readonly Poly[], angleDeg: number, mirror: boolean): Poly[] {
  const a = angleDeg * D;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const moved = polys.map((p) => p.map(([x, y]) => {
    const mx = mirror ? 100 - x : x;
    return [(mx - 50) * c - (y - 50) * s, (mx - 50) * s + (y - 50) * c] as Pt;
  }));
  const all = moved.flat();
  const xs = all.map((q) => q[0]);
  const ys = all.map((q) => q[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = 84 / Math.max(maxX - minX, maxY - minY);
  const ox = 50 - ((minX + maxX) / 2) * k;
  const oy = 50 - ((minY + maxY) / 2) * k;
  return moved.map((p) => p.map(([x, y]) => [Math.round((x * k + ox) * 100) / 100, Math.round((y * k + oy) * 100) / 100] as Pt));
}
