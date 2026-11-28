import type { DomainId } from '../domains';
import { isNum, simulateItemBot } from './sim';
import { sumScore, type GameMode, type RoundContent } from './types';

/** One "how many / how much / which year" question with the reference answer known to the server. */
export interface EstimateQ {
  q: string;
  answer: number;
  /** shown next to the number, e.g. "$", "km", "subscribers" */
  unit?: string;
  /** revealed with the answer: the assumption behind it or the source year */
  note?: string;
  /** a picture shown with the question (photo year game) */
  img?: string;
  /** shown with the answer: who made the picture, its licence, and a link to its source page */
  credit?: { text: string; url: string };
}

export type EstimateInput =
  | { kind: 'log'; min: number; max: number; prefix?: string }
  | { kind: 'year'; min: number; max: number };

export interface EstimateItem extends EstimateQ {}
export type EstimateContent = RoundContent<EstimateItem>;

/**
 * Points for a guess:
 *  - log games: by how many times off you are (×1 = 1000, ×`zeroAt` or more = 0, linear in log space)
 *  - year game: 1000 for the exact year, 0 from `yearTolerance(answer)` years off (12 for recent
 *    years, growing with age up to 60 for antiquity: nobody dates 776 BC to the year)
 */
export const yearTolerance = (answer: number) => Math.round(Math.min(60, Math.max(12, (2026 - answer) * 0.03)));

export function estimatePoints(input: EstimateInput, answer: number, guess: number, zeroAt = 10, yearZero?: number): number {
  if (input.kind === 'year') return Math.round(1000 * Math.max(0, 1 - Math.abs(guess - answer) / (yearZero ?? yearTolerance(answer))));
  if (guess <= 0 || answer <= 0) return 0;
  const off = Math.abs(Math.log10(guess / answer)) / Math.log10(zeroAt);
  return Math.round(1000 * Math.max(0, 1 - off));
}

export function makeEstimateMode(opts: {
  id: DomainId;
  name: string;
  questions: () => EstimateQ[];
  input: EstimateInput;
  perRound: number;
  itemMs: number;
  /** log games: how many times off scores 0 */
  zeroAt?: number;
  /** year games: how many years off scores 0 (default: grows with age, see yearTolerance) */
  yearZero?: number;
  /** at most `max` questions matching `re` per round (keeps one kind of question from crowding the others) */
  cap?: { re: RegExp; max: number };
  thinkMs: number;
}): GameMode<EstimateContent> {
  const FEEDBACK_MS = 3_000;
  const GRACE = 700; // auto-submit at the buzzer still counts
  return {
    id: opts.id,
    name: opts.name,
    itemTimeLimit: opts.itemMs + GRACE,
    feedbackDelay: FEEDBACK_MS,
    timeLimit: opts.perRound * (opts.itemMs + GRACE + FEEDBACK_MS) + 1_000,

    generateRound(rng) {
      const seen = new Set<string>();
      let capped = 0;
      const items = rng
        .shuffle(opts.questions())
        .filter((q) => {
          const k = q.img ?? q.q;
          if (seen.has(k)) return false;
          seen.add(k);
          if (opts.cap?.re.test(q.q)) return capped++ < opts.cap.max;
          return true;
        })
        .slice(0, opts.perRound);
      return { items };
    },

    publicItem(content, index) {
      const it = content.items[index];
      return { q: it.q, unit: it.unit ?? '', input: opts.input, seconds: opts.itemMs / 1000, index, total: content.items.length, ...(it.img ? { img: it.img } : {}) };
    },

    validateAnswer(content, index, answer) {
      const it = content.items[index];
      const fb = { answer: it.answer, note: it.note ?? null, credit: it.credit ?? null };
      if (!isNum(answer)) return { correct: false, points: 0, itemDone: true, feedback: fb };
      const g = opts.input.kind === 'year' ? Math.round(answer) : answer;
      const points = estimatePoints(opts.input, it.answer, g, opts.zeroAt, opts.yearZero);
      return { correct: points >= 750, points, itemDone: true, feedback: { ...fb, guess: g } };
    },

    timeoutFeedback(content, index) {
      const it = content.items[index];
      return { answer: it.answer, note: it.note ?? null, credit: it.credit ?? null };
    },

    scoreRound: sumScore,

    simulateBot(content, rating, rng) {
      return simulateItemBot({
        count: content.items.length, rating, rng, itemTimeLimit: opts.itemMs, feedbackDelay: FEEDBACK_MS,
        roundLimit: this.timeLimit, thinkMs: opts.thinkMs,
        points: (_i, q) => Math.round(250 + q * 650),
      });
    },
  };
}

import { followerQuestions, opinionQuestions, priceQuestions, yearQuestions } from './estimate-data';
import { photoQuestions } from './photos';

export const opinionMode = makeEstimateMode({
  id: 'opinion', name: 'Opinion', questions: opinionQuestions,
  input: { kind: 'log', min: 1, max: 1e20 }, perRound: 4, itemMs: 20_000, zeroAt: 30, thinkMs: 13_000,
});
export const yearMode = makeEstimateMode({
  id: 'year', name: 'Release year', questions: yearQuestions,
  // Negative years are BC. The slider is denser for recent years; players can also type the year.
  input: { kind: 'year', min: -3000, max: 2026 }, perRound: 5, itemMs: 15_000, thinkMs: 8_000,
});
/** Consoles, phones and Apple products (the "The right price" list has a lot of them). */
export const GADGETS =
  /iPhone|iPad|Mac(Book| mini| Pro|intosh)|iMac|Apple|AirPods|iPod|HomePod|PlayStation|Xbox|Nintendo|\bWii\b|Game ?Boy|GameCube|Sega|\bPSP\b|PS Vita|\bNES\b|Switch|Steam Deck|Galaxy|Pixel|phone|console|Dreamcast|Atari|Virtual Boy|Genesis/i;
export const priceMode = makeEstimateMode({
  id: 'price', name: 'The right price', questions: priceQuestions,
  input: { kind: 'log', min: 0.1, max: 1e12, prefix: '$' }, perRound: 5, itemMs: 15_000, zeroAt: 5, thinkMs: 9_000,
  // Gadgets are over a third of the list: at most one console, phone or Apple product per round.
  cap: { re: GADGETS, max: 1 },
});
export const followersMode = makeEstimateMode({
  id: 'followers', name: 'Followers', questions: followerQuestions,
  input: { kind: 'log', min: 1_000, max: 1e11 }, perRound: 5, itemMs: 15_000, zeroAt: 10, thinkMs: 9_000,
});
export const photoMode = makeEstimateMode({
  id: 'photo', name: 'Photo year', questions: photoQuestions,
  // Photography starts in the 1820s; full points for the exact year, 0 from 20 years off.
  input: { kind: 'year', min: 1830, max: 2026 }, perRound: 3, itemMs: 60_000, yearZero: 20, thinkMs: 20_000,
});
