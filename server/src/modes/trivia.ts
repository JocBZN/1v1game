import fs from 'node:fs';
import { dataFile } from '../paths';
import type { Rng } from '../rng';
import { simulateChoiceBot, validateChoice, type ChoiceItem } from './choice';
import { sumScore, type GameMode, type RoundContent } from './types';

export const TRIVIA_CATEGORIES = ['istorie', 'geografie', 'stiinta', 'sport', 'film_muzica'] as const;
export type TriviaCategory = (typeof TRIVIA_CATEGORIES)[number];

export const TRIVIA_CATEGORY_NAMES: Record<TriviaCategory, string> = {
  istorie: 'Istorie',
  geografie: 'Geografie',
  stiinta: 'Știință',
  sport: 'Sport',
  film_muzica: 'Film & muzică',
};

export interface Question {
  id: string;
  cat: TriviaCategory;
  difficulty: 1 | 2 | 3;
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

/** Builds a round item: options shuffled, correct index kept server-side. */
export function toItem(q: Question, rng: Rng): TriviaItem {
  const options = rng.shuffle([q.correct, ...q.wrong]);
  return { qid: q.id, cat: q.cat, q: q.q, difficulty: q.difficulty, options, answer: options.indexOf(q.correct) };
}

export const triviaMode: GameMode<TriviaContent> = {
  id: 'trivia',
  name: 'Cultură generală',
  itemTimeLimit: 10_000,
  feedbackDelay: 1_300,
  timeLimit: TRIVIA_QUESTIONS_PER_ROUND * (10_000 + 1_300) + 1_000,

  generateRound(rng) {
    const all = loadQuestions();
    // One question per subcategory, in random order.
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
