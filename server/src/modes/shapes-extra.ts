/**
 * 200 more shapes for "Split the shape": geometric families, hand-drawn outlines, polyominoes,
 * pixel letters/digits and pixel icons. Same rules as shapes.ts: every shape is a set of
 * NON-overlapping simple polygons in a ~100×100 box, y pointing down (placeShape rescales anyway).
 */
import type { Poly, Pt, ShapeDef } from './shapes';

const D = Math.PI / 180;
const TAU = Math.PI * 2;

/** Closed outline from a polar function r(θ), centred at (50, 50). */
function polar(r: (a: number) => number, n = 120, rot = -Math.PI / 2): Poly {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * TAU;
    const rr = r(a - rot);
    return [50 + rr * Math.cos(a), 50 + rr * Math.sin(a)] as Pt;
  });
}

const regular = (n: number, r = 44): Poly => polar(() => r, n);

function starPoly(points: number, rOut: number, rIn: number): Poly {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? rIn : rOut;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as Pt;
  });
}

function gear(teeth: number, rOut = 46, rIn = 36): Poly {
  const out: Pt[] = [];
  const step = TAU / teeth;
  for (let t = 0; t < teeth; t++) {
    const a = t * step;
    // root, rise, flat top, fall: 4 points per tooth
    for (const [f, r] of [[0, rIn], [0.2, rOut], [0.5, rOut], [0.7, rIn]] as const) {
      const ang = a + f * step - Math.PI / 2;
      out.push([50 + r * Math.cos(ang), 50 + r * Math.sin(ang)]);
    }
  }
  return out;
}

const flower = (petals: number) => polar((a) => 30 + 16 * Math.cos(petals * a), 180);

function pinwheel(blades: number): Poly {
  // Each blade: from the centre ring out along one edge, then back along a curve.
  return polar((a) => {
    const t = ((a / TAU) * blades) % 1;
    return 12 + 34 * t;
  }, blades * 40);
}

function arcBand(a0: number, a1: number, rOut: number, rIn: number, cx = 50, cy = 60): Poly {
  const n = 40;
  const outer = Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + rOut * Math.cos(a), cy + rOut * Math.sin(a)] as Pt;
  });
  const inner = Array.from({ length: n + 1 }, (_, i) => {
    const a = a1 - ((a1 - a0) * i) / n;
    return [cx + rIn * Math.cos(a), cy + rIn * Math.sin(a)] as Pt;
  });
  return [...outer, ...inner];
}

function ellipse(rx: number, ry: number, n = 72): Poly {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU;
    return [50 + rx * Math.cos(a), 50 + ry * Math.sin(a)] as Pt;
  });
}

function superellipse(e: number, r = 44): Poly {
  return Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [50 + r * Math.sign(c) * Math.abs(c) ** (2 / e), 50 + r * Math.sign(s) * Math.abs(s) ** (2 / e)] as Pt;
  });
}

/** Crescent: outer circle arc, then the inner (offset) circle arc back. */
function crescent(offset: number): Poly {
  const R = 44;
  const r = 40;
  const cx2 = 50 + offset;
  // intersection angle of the two circles on the outer circle
  const x = (R * R - r * r + offset * offset) / (2 * offset);
  const y = Math.sqrt(Math.max(0, R * R - x * x));
  const aOut = Math.atan2(y, x);
  const aIn = Math.atan2(y, x - offset);
  const n = 50;
  const outer = Array.from({ length: n + 1 }, (_, i) => {
    const a = aOut + ((TAU - 2 * aOut) * i) / n;
    return [50 + R * Math.cos(a), 50 + R * Math.sin(a)] as Pt;
  });
  const inner = Array.from({ length: n + 1 }, (_, i) => {
    const a = -aIn - ((TAU - 2 * aIn) * i) / n;
    return [cx2 + r * Math.cos(a), 50 + r * Math.sin(a)] as Pt;
  });
  return [...outer, ...inner];
}

/** Pixel art: '#' cells become rectangles (one per horizontal run), scaled to the 100 box. */
function pixels(rows: string[]): Poly[] {
  const w = Math.max(...rows.map((r) => r.length));
  const cell = 100 / Math.max(w, rows.length);
  const out: Poly[] = [];
  rows.forEach((r, y) => {
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

const shape = (id: string, name: string, polys: Poly[]): ShapeDef => ({ id, name, polys });
const one = (id: string, name: string, poly: Poly): ShapeDef => shape(id, name, [poly]);

// ------------------------------------------------------------------ geometric families

const POLY_NAMES = ['Triangle', 'Square', 'Pentagon', 'Hexagon', 'Heptagon', 'Octagon', 'Nonagon', 'Decagon', 'Hendecagon', 'Dodecagon'];
const polygons = POLY_NAMES.map((name, i) => one(`poly-${i + 3}`, name, regular(i + 3)));

const stars = [4, 5, 6, 7, 8, 9, 10, 12].flatMap((p) => [
  one(`star-${p}-sharp`, `Sharp ${p}-point star`, starPoly(p, 46, 18)),
  one(`star-${p}-chunky`, `Chunky ${p}-point star`, starPoly(p, 46, 30)),
]);

const gears = [6, 8, 10, 12, 16, 20].map((t) => one(`gear-${t}`, `Gear with ${t} teeth`, gear(t)));
const flowers = [3, 4, 5, 6, 7, 8, 9, 10].map((p) => one(`flower-${p}`, `${p}-petal flower`, flower(p)));
const pinwheels = [3, 4, 5, 6].map((b) => one(`pinwheel-${b}`, `${b}-blade pinwheel`, pinwheel(b)));

const arcs = [
  one('arch-thin', 'Thin rainbow arch', arcBand(Math.PI, TAU, 46, 34)),
  one('arch-thick', 'Thick rainbow arch', arcBand(Math.PI, TAU, 46, 20)),
  one('horseshoe', 'Horseshoe', arcBand(150 * D, 390 * D, 44, 28, 50, 50)),
  one('quarter-band', 'Quarter ring', arcBand(Math.PI, 1.5 * Math.PI, 90, 50, 95, 95)),
];

const roundish = [
  one('circle', 'Circle', ellipse(44, 44)),
  one('ellipse-wide', 'Wide oval', ellipse(46, 26)),
  one('ellipse-tall', 'Tall oval', ellipse(28, 46)),
  one('squircle', 'Squircle', superellipse(4)),
  one('soft-square', 'Soft square', superellipse(8)),
  one('astroid', 'Pinched diamond', superellipse(0.8)),
  one('crescent-thin', 'Thin crescent moon', crescent(14)),
  one('crescent-fat', 'Fat crescent moon', crescent(26)),
  one('half-moon', 'Half circle', [...Array.from({ length: 41 }, (_, i) => [50 + 46 * Math.cos(Math.PI + (i / 40) * Math.PI), 70 + 46 * Math.sin(Math.PI + (i / 40) * Math.PI)] as Pt)]),
  one('quarter-circle', 'Quarter circle', [[6, 94], ...Array.from({ length: 31 }, (_, i) => [6 + 88 * Math.cos(-(i / 30) * (Math.PI / 2)), 94 + 88 * Math.sin(-(i / 30) * (Math.PI / 2))] as Pt)]),
  one('egg', 'Egg', polar((a) => 40 * (1 + 0.18 * Math.cos(a)), 120)),
  one('teardrop', 'Teardrop', [[50, 4], ...Array.from({ length: 41 }, (_, i) => {
    const a = (-60 + (i / 40) * 300) * D; // round bottom, from the right shoulder to the left one
    return [50 + 32 * Math.cos(a), 62 + 32 * Math.sin(a)] as Pt;
  })]),
  one('cloud', 'Cloud', polar((a) => 34 + 8 * Math.abs(Math.sin(2.5 * a)), 200)),
  one('blob-1', 'Wobbly blob', polar((a) => 36 + 6 * Math.sin(3 * a) + 4 * Math.cos(5 * a), 150)),
  one('blob-2', 'Lumpy potato', polar((a) => 34 + 8 * Math.sin(2 * a + 1) + 3 * Math.sin(7 * a), 150)),
  one('cardioid', 'Apple', polar((a) => 24 * (1 - Math.cos(a)) + 6, 150, Math.PI / 2)),
  one('sun', 'Sunburst', starPoly(16, 46, 34)),
  one('spiky-ball', 'Spiky ball', starPoly(24, 46, 38)),
];

const polygonsHand = [
  one('kite', 'Kite', [[50, 4], [86, 38], [50, 96], [14, 38]]),
  one('rhombus', 'Rhombus', [[50, 6], [80, 50], [50, 94], [20, 50]]),
  one('trapezoid', 'Trapezoid', [[28, 24], [72, 24], [94, 76], [6, 76]]),
  one('parallelogram', 'Parallelogram', [[30, 26], [96, 26], [70, 74], [4, 74]]),
  one('right-triangle', 'Right triangle', [[8, 8], [8, 92], [92, 92]]),
  one('wide-triangle', 'Wide triangle', [[50, 30], [96, 74], [4, 74]]),
  one('arrow-fat', 'Fat arrow', [[4, 36], [56, 36], [56, 14], [96, 50], [56, 86], [56, 64], [4, 64]]),
  one('arrow-thin', 'Thin arrow', [[4, 44], [70, 44], [70, 28], [96, 50], [70, 72], [70, 56], [4, 56]]),
  one('double-arrow', 'Double arrow', [[4, 50], [26, 26], [26, 40], [74, 40], [74, 26], [96, 50], [74, 74], [74, 60], [26, 60], [26, 74]]),
  one('chevron', 'Chevron', [[10, 10], [50, 50], [90, 10], [90, 40], [50, 80], [10, 40]]),
  one('plus', 'Plus sign', [[36, 6], [64, 6], [64, 36], [94, 36], [94, 64], [64, 64], [64, 94], [36, 94], [36, 64], [6, 64], [6, 36], [36, 36]]),
  one('x-cross', 'X cross', [[20, 6], [50, 36], [80, 6], [94, 20], [64, 50], [94, 80], [80, 94], [50, 64], [20, 94], [6, 80], [36, 50], [6, 20]]),
  one('house', 'House', [[50, 6], [94, 44], [82, 44], [82, 94], [18, 94], [18, 44], [6, 44]]),
  one('shield', 'Shield', [[10, 8], [90, 8], [90, 44], [80, 70], [50, 94], [20, 70], [10, 44]]),
  one('bowtie', 'Bow tie', [[6, 18], [44, 42], [56, 42], [94, 18], [94, 82], [56, 58], [44, 58], [6, 82]]),
  one('hourglass', 'Hourglass', [[14, 6], [86, 6], [86, 12], [56, 50], [86, 88], [86, 94], [14, 94], [14, 88], [44, 50], [14, 12]]),
  one('gem', 'Cut gem', [[26, 14], [74, 14], [94, 38], [50, 92], [6, 38]]),
  one('banner', 'Banner', [[10, 10], [90, 10], [90, 90], [50, 66], [10, 90]]),
  one('pennant', 'Pennant flag', [[10, 6], [16, 6], [16, 10], [90, 32], [16, 54], [16, 94], [10, 94]]),
  one('speech', 'Speech bubble', [[8, 10], [92, 10], [92, 66], [44, 66], [22, 90], [26, 66], [8, 66]]),
  one('tshirt', 'T-shirt', [[30, 10], [42, 16], [58, 16], [70, 10], [94, 28], [84, 44], [74, 38], [74, 92], [26, 92], [26, 38], [16, 44], [6, 28]]),
  one('bottle', 'Bottle', [[42, 4], [58, 4], [58, 26], [72, 40], [72, 94], [28, 94], [28, 40], [42, 26]]),
  one('pine', 'Pine tree', [[50, 4], [74, 32], [62, 32], [82, 58], [66, 58], [90, 84], [56, 84], [56, 96], [44, 96], [44, 84], [10, 84], [34, 58], [18, 58], [38, 32], [26, 32]]),
  one('fish', 'Fish', [...Array.from({ length: 33 }, (_, i) => {
    const a = (25 + (i / 32) * 310) * D; // body: around the left side, from lower right to upper right
    return [44 + 36 * Math.cos(a), 50 + 26 * Math.sin(a)] as Pt;
  }), [96, 22], [96, 78]]),
  one('plane', 'Airplane', [[50, 4], [56, 14], [56, 38], [94, 56], [94, 64], [56, 54], [56, 78], [68, 88], [68, 94], [50, 88], [32, 94], [32, 88], [44, 78], [44, 54], [6, 64], [6, 56], [44, 38], [44, 14]]),
  one('keyhole', 'Keyhole', [...Array.from({ length: 33 }, (_, i) => {
    const a = (115 + (i / 32) * 310) * D;
    return [50 + 24 * Math.cos(a), 34 + 24 * Math.sin(a)] as Pt;
  }), [70, 94], [30, 94]]),
  one('lightbulb', 'Light bulb', [...Array.from({ length: 33 }, (_, i) => {
    const a = (125 + (i / 32) * 290) * D;
    return [50 + 34 * Math.cos(a), 40 + 34 * Math.sin(a)] as Pt;
  }), [62, 80], [62, 94], [38, 94], [38, 80]]),
  one('battlement', 'Castle wall', [[6, 94], [6, 20], [20, 20], [20, 36], [34, 36], [34, 20], [48, 20], [48, 36], [62, 36], [62, 20], [76, 20], [76, 36], [94, 36], [94, 94]]),
  one('zigzag', 'Zigzag band', [[4, 40], [24, 20], [44, 40], [64, 20], [84, 40], [96, 28], [96, 52], [84, 64], [64, 44], [44, 64], [24, 44], [4, 64]]),
];

const staircases = [3, 4, 5, 6].map((n) => {
  const s = 92 / n;
  const pts: Pt[] = [[4, 96]];
  for (let i = 0; i < n; i++) {
    pts.push([4 + i * s, 96 - (i + 1) * s]);
    pts.push([4 + (i + 1) * s, 96 - (i + 1) * s]);
  }
  pts.push([96, 96]);
  return one(`stairs-${n}`, `${n}-step staircase`, pts);
});

const combs = [3, 4, 5, 6].map((n) => {
  const w = 92 / (2 * n - 1);
  // clockwise: the back of the comb, then each tooth from right to left
  const pts: Pt[] = [[4, 6], [96, 6]];
  for (let i = n - 1; i >= 0; i--) {
    const x0 = 4 + 2 * i * w;
    pts.push([x0 + w, 94], [x0, 94]);
    if (i > 0) pts.push([x0, 30], [x0 - w, 30]);
  }
  return one(`comb-${n}`, `Comb with ${n} teeth`, pts);
});

// ------------------------------------------------------------------ polyominoes

const tetro = [
  shape('tetro-i', 'I block', pixels(['####'])),
  shape('tetro-o', 'O block', pixels(['##', '##'])),
  shape('tetro-j', 'J block', pixels(['.#', '.#', '##'])),
  shape('tetro-z', 'Z block', pixels(['##.', '.##'])),
];

const PENTOMINOES: Record<string, string[]> = {
  F: ['.##', '##.', '.#.'], I: ['#####'], L: ['#.', '#.', '#.', '##'], N: ['.#', '##', '#.', '#.'],
  P: ['##', '##', '#.'], T: ['###', '.#.', '.#.'], U: ['#.#', '###'], V: ['#..', '#..', '###'],
  W: ['#..', '##.', '.##'], X: ['.#.', '###', '.#.'], Y: ['.#', '##', '.#', '.#'], Z: ['##.', '.#.', '.##'],
};
const pentominoes = Object.entries(PENTOMINOES).map(([k, rows]) => shape(`pento-${k.toLowerCase()}`, `${k} pentomino`, pixels(rows)));

// ------------------------------------------------------------------ pixel letters and digits (5×7)

const FONT: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
};
const glyphs = Object.entries(FONT).map(([k, rows]) =>
  shape(/\d/.test(k) ? `digit-${k}` : `letter-${k.toLowerCase()}`, /\d/.test(k) ? `Pixel number ${k}` : `Pixel letter ${k}`, pixels(rows)),
);

// ------------------------------------------------------------------ pixel icons

const PIXEL_ICONS: [string, string, string[]][] = [
  ['px-invader-2', 'Pixel invader', ['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#']],
  ['px-invader-3', 'Pixel squid', ['....####....', '.##########.', '############', '###..##..###', '############', '...##..##...', '..##.##.##..', '##........##']],
  ['px-skull', 'Pixel skull', ['.######.', '########', '##.##.##', '##.##.##', '########', '.######.', '.#.##.#.', '.######.']],
  ['px-king', 'Chess king', ['....#....', '...###...', '....#....', '..#####..', '...###...', '...###...', '...###...', '..#####..', '.#######.']],
  ['px-queen', 'Chess queen', ['#...#...#', '.#.###.#.', '..#####..', '...###...', '...###...', '...###...', '..#####..', '.#######.']],
  ['px-rook', 'Chess rook', ['#.##.##.#', '#########', '.#######.', '..#####..', '..#####..', '..#####..', '.#######.', '#########']],
  ['px-bishop', 'Chess bishop', ['....#....', '...###...', '..##.##..', '..#.###..', '...###...', '...###...', '..#####..', '.#######.']],
  ['px-knight', 'Chess knight', ['...###...', '..#####..', '.###.###.', '#######..', '...####..', '..#####..', '.#######.', '.#######.']],
  ['px-pawn', 'Chess pawn', ['...##...', '..####..', '..####..', '...##...', '..####..', '..####..', '.######.', '########']],
  ['px-key', 'Pixel key', ['.###........', '#...#.......', '#...########', '#...#...#.#.', '.###....#.#.']],
  ['px-house', 'Pixel house', ['....##....', '...####...', '..######..', '.########.', '##########', '.##.##.##.', '.##.##.##.', '.##....##.', '.##....##.']],
  ['px-tree', 'Pixel tree', ['...##...', '..####..', '.######.', '..####..', '.######.', '########', '...##...', '...##...']],
  ['px-cup', 'Pixel mug', ['#######..', '#######.#', '#######.#', '#######.#', '#######..', '.#####...']],
  ['px-note', 'Music note', ['...####', '...#..#', '...#..#', '...#..#', '.###.##', '####.##', '.##....']],
  ['px-smiley', 'Pixel smiley', ['..####..', '.######.', '##.##.##', '########', '#.####.#', '##....##', '.######.', '..####..']],
  ['px-coin', 'Pixel coin', ['..####..', '.##..##.', '##.##.##', '##.##.##', '##.##.##', '##.##.##', '.##..##.', '..####..']],
  ['px-gem', 'Pixel diamond', ['.######.', '########', '########', '.######.', '..####..', '...##...']],
  ['px-moon', 'Pixel moon', ['..####..', '.###....', '###.....', '###.....', '###.....', '###.....', '.###....', '..####..']],
  ['px-cat', 'Pixel cat', ['#......#', '##....##', '########', '#.####.#', '########', '###..###', '.######.', '..####..']],
  ['px-dog', 'Pixel dog', ['##....##', '###..###', '.######.', '.#.##.#.', '.######.', '..#..#..', '..####..']],
  ['px-fish', 'Pixel fish', ['...###.....', '.######...#', '###.####.##', '##########.', '.#######.##', '...###....#']],
  ['px-bird', 'Pixel bird', ['...##....', '..####...', '.##.###..', '#######..', '..######.', '..#######', '...####..', '....#.#..']],
  ['px-duck', 'Pixel duck', ['...###....', '..#####...', '..##.###..', '...####...', '########..', '.#########', '.########.', '..######..']],
  ['px-snail', 'Pixel snail', ['...####...', '..##..##..', '.##.##.##.', '.##.#..##.', '.##..###..', '###########']],
  ['px-crab', 'Pixel crab', ['##......##', '#.#....#.#', '..######..', '.##.##.##.', '##########', '.########.', '#.#....#.#']],
  ['px-frog', 'Pixel frog', ['.##....##.', '#.##..##.#', '##########', '##########', '.########.', '#.######.#', '##......##']],
  ['px-robot', 'Pixel robot', ['....##....', '..######..', '..#.##.#..', '..######..', '..#....#..', '##########', '#.######.#', '..##..##..']],
  ['px-ufo', 'Pixel UFO', ['....##....', '...####...', '.########.', '##.#.#.#.#', '##########', '..#....#..']],
  ['px-rocket', 'Pixel rocket', ['...##...', '..####..', '..#..#..', '..####..', '..####..', '.######.', '##.##.##', '#..##..#']],
  ['px-car', 'Pixel car', ['...#####....', '..##..###...', '.##...####..', '############', '############', '..##....##..']],
  ['px-boat', 'Pixel boat', ['....#.....', '....##....', '....###...', '....####..', '....#.....', '##########', '.########.', '..######..']],
  ['px-plane', 'Pixel plane', ['....##....', '....##....', '..######..', '##########', '....##....', '....##....', '...####...']],
  ['px-umbrella', 'Pixel umbrella', ['...####...', '.########.', '##########', '....#.....', '....#.....', '....#.#...', '.....#....']],
  ['px-cactus', 'Pixel cactus', ['...##...', '#..##...', '#..##..#', '#####..#', '...#####', '...##...', '...##...', '..####..']],
  ['px-flower', 'Pixel flower', ['.#.#.#.', '#######', '.##.##.', '#######', '.#.#.#.', '...#...', '.#.#.#.', '..###..']],
  ['px-apple', 'Pixel apple', ['....#...', '...#....', '.##.##..', '#######.', '########', '########', '.######.', '..##.#..']],
  ['px-cherry', 'Pixel cherries', ['.....##', '....#..', '...#.#.', '..#...#', '.##..##', '####.##', '.##....']],
  ['px-banana', 'Pixel banana', ['......##', '.....###', '.....###', '....###.', '...####.', '.#####..', '####....']],
  ['px-carrot', 'Pixel carrot', ['.#.#....', '..##....', '.####...', '.####...', '..###...', '..###...', '...##...', '...#....']],
  ['px-icecream', 'Pixel ice cream', ['..####..', '.######.', '########', '.######.', '..####..', '..####..', '...##...', '...##...']],
  ['px-cake', 'Pixel cake', ['.#..#..#.', '.#..#..#.', '#########', '#.#.#.#.#', '#########', '#########', '#########']],
  ['px-burger', 'Pixel burger', ['..######..', '.########.', '##########', '..........', '##########', '.########.', '..........', '##########']],
  ['px-anchor', 'Pixel anchor', ['...##...', '..#..#..', '...##...', '########', '...##...', '#..##..#', '##.##.##', '.######.']],
  ['px-bell', 'Pixel bell', ['...##...', '..####..', '..####..', '.######.', '.######.', '########', '...##...']],
  ['px-trophy', 'Pixel trophy', ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.']],
  ['px-lock', 'Pixel padlock', ['..####..', '.#....#.', '.#....#.', '########', '###..###', '###..###', '########']],
  ['px-sword', 'Pixel sword', ['.......##', '......###', '.....###.', '....###..', '#..###...', '.####....', '..##.....', '.#..#....', '#........']],
  ['px-ghost', 'Pixel ghost', ['..####..', '.######.', '##.##.##', '########', '########', '########', '#.#..#.#']],
  ['px-mushroom', 'Pixel toadstool', ['..####..', '.#.##.#.', '########', '##.##.##', '...##...', '..####..', '..####..']],
  ['px-heart-big', 'Big pixel heart', ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....']],
];
const icons = PIXEL_ICONS.map(([id, name, rows]) => shape(id, name, pixels(rows)));

export const EXTRA_SHAPES: ShapeDef[] = [
  ...polygons, ...stars, ...gears, ...flowers, ...pinwheels, ...arcs, ...roundish, ...polygonsHand,
  ...staircases, ...combs, ...tetro, ...pentominoes, ...glyphs, ...icons,
];
