import { simulateItemBot } from './sim';
import { sumScore, type GameMode, type RoundContent } from './types';

export type Rgb = [number, number, number];
export interface ColorItem {
  rgb: Rgb;
}
export type ColorContent = RoundContent<ColorItem>;

export const COLOR_ITEMS = 4;
export const COLOR_ITEM_MS = 15_000;
const FEEDBACK_MS = 2_500;
/** A little grace on the server so an auto-submit at the buzzer still counts. */
const SERVER_ITEM_MS = COLOR_ITEM_MS + 700;

function toLab([r, g, b]: Rgb): [number, number, number] {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (t * 24389) / 27 / 116 + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Perceptual colour distance (CIE76 ΔE). ~2 is barely visible, 50+ is a different colour. */
export function deltaE(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Match 0..100 %. ΔE 0 → 100 %, ΔE 60 → 0 %. */
export function colorMatch(target: Rgb, guess: Rgb): number {
  return Math.max(0, Math.min(100, Math.round((1 - deltaE(target, guess) / 60) * 100)));
}

export const colorPoints = (match: number) => match * 10;

export function parseRgb(x: unknown): Rgb | null {
  if (!Array.isArray(x) || x.length !== 3) return null;
  if (!x.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) return null;
  return x as Rgb;
}

export const colorMode: GameMode<ColorContent> = {
  id: 'color',
  name: 'Guess the color',
  itemTimeLimit: SERVER_ITEM_MS,
  feedbackDelay: FEEDBACK_MS,
  timeLimit: COLOR_ITEMS * (SERVER_ITEM_MS + FEEDBACK_MS) + 1_000,

  generateRound(rng) {
    // Random hue/saturation/lightness so colours are varied and never muddy greys only.
    const items = Array.from({ length: COLOR_ITEMS }, (): ColorItem => {
      const h = rng() * 360;
      const s = 0.35 + rng() * 0.6;
      const l = 0.25 + rng() * 0.5;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const ch = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
      return { rgb: [ch(0), ch(8), ch(4)] };
    });
    return { items };
  },

  publicItem(content, index) {
    return { rgb: content.items[index].rgb, seconds: COLOR_ITEM_MS / 1000, index, total: content.items.length };
  },

  validateAnswer(content, index, answer) {
    const guess = parseRgb(answer);
    const target = content.items[index].rgb;
    if (!guess) return { correct: false, points: 0, itemDone: true, feedback: { match: 0, target } };
    const match = colorMatch(target, guess);
    return { correct: match >= 85, points: colorPoints(match), itemDone: true, feedback: { match, target, guess } };
  },

  timeoutFeedback(content, index) {
    return { match: 0, target: content.items[index].rgb };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    return simulateItemBot({
      count: content.items.length, rating, rng, itemTimeLimit: COLOR_ITEM_MS, feedbackDelay: FEEDBACK_MS,
      roundLimit: this.timeLimit, thinkMs: 11_000,
      points: (_i, q) => colorPoints(Math.round(45 + q * 50)),
    });
  },
};
