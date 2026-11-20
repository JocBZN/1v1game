import { clamp, type Rng } from '../rng';
import { botAccuracy, botSpeedFactor, sumScore, type GameMode, type ReplayEvent, type RoundContent } from './types';

export interface MathItem {
  a: number;
  b: number;
  op: '+' | '−' | '×' | '÷';
  /** Optional third term for the hardest tier: (a op b) + c */
  c?: number;
  answer: number;
  tier: 1 | 2 | 3 | 4;
}

export type MathContent = RoundContent<MathItem>;

export const MATH_ITEMS = 100; // nobody gets through 100 in 60s
export const MATH_POINTS: Record<MathItem['tier'], number> = { 1: 100, 2: 150, 3: 200, 4: 250 };
export const MATH_WRONG_PENALTY = 50;

export function tierFor(index: number): MathItem['tier'] {
  if (index < 6) return 1;
  if (index < 14) return 2;
  if (index < 24) return 3;
  return 4;
}

function addSub(rng: Rng, max: number): Omit<MathItem, 'tier'> {
  const a = rng.int(2, max);
  const b = rng.int(2, max);
  if (rng.chance(0.5)) return { a, b, op: '+', answer: a + b };
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return { a: hi, b: lo, op: '−', answer: hi - lo };
}

function mul(rng: Rng, aMin: number, aMax: number, bMin: number, bMax: number): Omit<MathItem, 'tier'> {
  const a = rng.int(aMin, aMax);
  const b = rng.int(bMin, bMax);
  return rng.chance(0.5) ? { a, b, op: '×', answer: a * b } : { a: b, b: a, op: '×', answer: a * b };
}

/** Division with an integer result: pick divisor and quotient, derive the dividend. */
function div(rng: Rng, dMin: number, dMax: number, qMin: number, qMax: number): Omit<MathItem, 'tier'> {
  const b = rng.int(dMin, dMax);
  const q = rng.int(qMin, qMax);
  return { a: b * q, b, op: '÷', answer: q };
}

export function generateMathItem(rng: Rng, index: number): MathItem {
  const tier = tierFor(index);
  let base: Omit<MathItem, 'tier'>;
  switch (tier) {
    case 1:
      base = addSub(rng, 20);
      break;
    case 2:
      base = rng.chance(0.6) ? addSub(rng, 99) : mul(rng, 2, 10, 2, 10);
      break;
    case 3: {
      const r = rng();
      base = r < 0.35 ? addSub(rng, 250) : r < 0.7 ? mul(rng, 11, 25, 2, 9) : div(rng, 2, 12, 2, 12);
      break;
    }
    default: {
      const r = rng();
      if (r < 0.35) base = mul(rng, 12, 35, 3, 12);
      else if (r < 0.65) base = div(rng, 3, 15, 5, 25);
      else {
        // a × b + c
        const m = mul(rng, 3, 12, 3, 12);
        const c = rng.int(5, 60);
        base = { ...m, c, answer: m.answer + c };
      }
    }
  }
  return { ...base, tier };
}

export function mathPrompt(item: MathItem): string {
  const core = `${item.a} ${item.op} ${item.b}`;
  return item.c !== undefined ? `${core} + ${item.c}` : core;
}

export function parseIntAnswer(answer: unknown): number | null {
  const n = typeof answer === 'number' ? answer : typeof answer === 'string' && answer.trim() !== '' ? Number(answer.trim()) : NaN;
  return Number.isInteger(n) ? n : null;
}

/** Points for a single math answer. */
export function mathPoints(item: MathItem, correct: boolean): number {
  return correct ? MATH_POINTS[item.tier] : -MATH_WRONG_PENALTY;
}

export const mathMode: GameMode<MathContent> = {
  id: 'math',
  name: 'Calcul mental',
  timeLimit: 60_000,
  feedbackDelay: 0,

  generateRound(rng) {
    return { items: Array.from({ length: MATH_ITEMS }, (_, i) => generateMathItem(rng, i)) };
  },

  publicItem(content, index) {
    const item = content.items[index];
    return { prompt: mathPrompt(item), tier: item.tier };
  },

  validateAnswer(content, index, answer) {
    const item = content.items[index];
    const n = parseIntAnswer(answer);
    const correct = n !== null && n === item.answer;
    return {
      correct,
      points: mathPoints(item, correct),
      itemDone: true,
      feedback: correct ? {} : { correctAnswer: item.answer },
    };
  },

  timeoutFeedback(content, index) {
    return { correctAnswer: content.items[index].answer };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    const events: ReplayEvent[] = [];
    const baseMs = { 1: 2200, 2: 3200, 3: 4800, 4: 6500 } as const;
    const speed = botSpeedFactor(rating);
    const acc = botAccuracy(rating);
    let t = 600;
    for (let i = 0; i < content.items.length; i++) {
      const item = content.items[i];
      t += clamp(rng.normal(baseMs[item.tier] * speed, baseMs[item.tier] * speed * 0.3), 700, 15000);
      if (t > this.timeLimit - 100) break;
      const p = clamp(acc + (item.tier === 1 ? 0.2 : item.tier === 2 ? 0.08 : item.tier === 3 ? -0.05 : -0.12), 0.1, 0.99);
      const correct = rng.chance(p);
      events.push({ t: Math.round(t), item: i, points: mathPoints(item, correct), correct, done: true });
    }
    return { events, durationMs: this.timeLimit };
  },
};
