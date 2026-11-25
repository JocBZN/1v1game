import crypto from 'node:crypto';
import fs from 'node:fs';
import { dataFile } from '../paths';
import type { Rng } from '../rng';
import { simulateChoiceBot, validateChoice, type ChoiceItem } from './choice';
import { sumScore, type GameMode, type RoundContent } from './types';

export const TRIVIA_CATEGORIES = [
  'history', 'geography', 'science', 'sport', 'film_music',
  'football', 'medicine', 'math', 'technology', 'cosmetics', 'tv_shows', 'celebrities',
] as const;
export type TriviaCategory = (typeof TRIVIA_CATEGORIES)[number];

export const TRIVIA_CATEGORY_NAMES: Record<TriviaCategory, string> = {
  history: 'History',
  geography: 'Geography',
  science: 'Science',
  sport: 'Sport',
  film_music: 'Film & Music',
  football: 'Football',
  medicine: 'Medicine',
  math: 'Math',
  technology: 'Technology',
  cosmetics: 'Beauty & Cosmetics',
  tv_shows: 'TV & Shows',
  celebrities: 'Famous People',
};

export interface Question {
  id: string;
  cat: TriviaCategory;
  difficulty: 1 | 2 | 3;
  /** 1–5 stars, initial estimate (live answer rates override it) */
  stars?: number;
  q: string;
  correct: string;
  wrong: [string, string, string];
}

export interface TriviaItem extends ChoiceItem {
  qid: string;
  cat: TriviaCategory;
  q: string;
}

export type TriviaContent = RoundContent<TriviaItem>;

export const TRIVIA_QUESTIONS_PER_ROUND = 5;

let cache: Question[] | null = null;
export function loadQuestions(): Question[] {
  if (!cache) cache = JSON.parse(fs.readFileSync(dataFile('questions.json'), 'utf8')) as Question[];
  return cache;
}

/**
 * About a quarter of the questions are public "practice" questions, published with their answers on the
 * SEO quiz pages. They are never asked in ranked duels, so the published answers can't be used to cheat.
 * The split is a stable hash of the question id, so it never changes between deploys.
 */
export function isPracticeQuestion(q: Pick<Question, 'id'>): boolean {
  return crypto.createHash('sha1').update(q.id).digest()[0] < 64;
}

let rankedCache: Question[] | null = null;
/** Questions used in ranked duels (everything except the public practice set). */
export function rankedQuestions(): Question[] {
  if (!rankedCache) rankedCache = loadQuestions().filter((q) => !isPracticeQuestion(q));
  return rankedCache;
}

export function practiceQuestions(cat?: TriviaCategory): Question[] {
  return loadQuestions().filter((q) => isPracticeQuestion(q) && (!cat || q.cat === cat));
}

/** Live difficulty from real answer rates (set by the server from the DB; empty in tests). */
const liveStars = new Map<string, number>();
export function setLiveStars(m: Map<string, number>) {
  liveStars.clear();
  for (const [k, v] of m) liveStars.set(k, v);
}
export const questionStars = (q: Question) => liveStars.get(q.id) ?? q.stars ?? ({ 1: 2, 2: 3, 3: 4 } as const)[q.difficulty];

/** Builds a round item: options shuffled, correct index kept server-side. */
export function toItem(q: Question, rng: Rng): TriviaItem {
  const options = rng.shuffle([q.correct, ...q.wrong]);
  return { qid: q.id, cat: q.cat, q: q.q, difficulty: q.difficulty, stars: questionStars(q), options, answer: options.indexOf(q.correct) };
}

export const triviaMode: GameMode<TriviaContent> = {
  id: 'trivia',
  name: 'Trivia',
  itemTimeLimit: 10_000,
  feedbackDelay: 1_300,
  timeLimit: TRIVIA_QUESTIONS_PER_ROUND * (10_000 + 1_300) + 1_000,

  generateRound(rng) {
    const all = rankedQuestions();
    // 5 different random categories, one question from each.
    const cats = rng.shuffle(TRIVIA_CATEGORIES).slice(0, TRIVIA_QUESTIONS_PER_ROUND);
    const items = cats.map((cat) => toItem(rng.pick(all.filter((q) => q.cat === cat)), rng));
    return { items };
  },

  publicItem(content, index) {
    const it = content.items[index];
    return {
      q: it.q,
      options: it.options,
      category: TRIVIA_CATEGORY_NAMES[it.cat],
      difficulty: it.difficulty,
      stars: it.stars,
      index,
      total: content.items.length,
    };
  },

  validateAnswer(content, index, answer, ctx) {
    return validateChoice(content.items[index], answer, ctx.elapsedMs, this.itemTimeLimit!);
  },

  timeoutFeedback(content, index) {
    return { correctIndex: content.items[index].answer, chosen: null };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    return simulateChoiceBot(content, rating, rng, this.itemTimeLimit!, this.feedbackDelay);
  },
};
