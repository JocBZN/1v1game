import fs from 'node:fs';
import { dataFile } from '../paths';
import { simulateChoiceBot, validateChoice, type ChoiceItem } from './choice';
import { sumScore, type GameMode, type RoundContent } from './types';

export interface Country {
  code: string;
  name: string;
  region: string;
  /** Lesser-known country: at most RARE_PER_ROUND of these per round. */
  rare?: boolean;
}

export interface FlagItem extends ChoiceItem {
  code: string;
}

export type FlagsContent = RoundContent<FlagItem>;

export const FLAGS_PER_ROUND = 8;
export const RARE_PER_ROUND = 3;

let cache: Country[] | null = null;
export function loadCountries(): Country[] {
  if (!cache) cache = JSON.parse(fs.readFileSync(dataFile('flags.json'), 'utf8')) as Country[];
  return cache;
}

/** ISO 3166-1 alpha-2 → flag emoji (two regional indicator symbols). */
export function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Well-known countries are easier. */
const EASY = new Set(['RO', 'MD', 'FR', 'DE', 'IT', 'ES', 'GB', 'US', 'CA', 'JP', 'BR', 'CN', 'GR', 'TR', 'UA', 'CH', 'SE', 'PT', 'AU', 'KR']);

export const flagsMode: GameMode<FlagsContent> = {
  id: 'flags',
  name: 'Flags',
  itemTimeLimit: 6_000,
  feedbackDelay: 1_000,
  timeLimit: FLAGS_PER_ROUND * (6_000 + 1_000) + 1_000,

  generateRound(rng) {
    const all = loadCountries();
    // 0–3 lesser-known flags per round, the rest well-known ones, in random order.
    const rareCount = rng.int(0, RARE_PER_ROUND);
    const picks = rng.shuffle([
      ...rng.shuffle(all.filter((c) => c.rare)).slice(0, rareCount),
      ...rng.shuffle(all.filter((c) => !c.rare)).slice(0, FLAGS_PER_ROUND - rareCount),
    ]);
    const rare = new Set(all.filter((c) => c.rare).map((c) => c.code));
    const items = picks.map((c): FlagItem => {
      // Distractors from the same region when possible — makes it a real test.
      const sameRegion = all.filter((x) => x.region === c.region && x.code !== c.code);
      const pool = sameRegion.length >= 3 ? sameRegion : all.filter((x) => x.code !== c.code);
      const wrong = rng.shuffle(pool).slice(0, 3).map((x) => x.name);
      const options = rng.shuffle([c.name, ...wrong]);
      return { code: c.code, options, answer: options.indexOf(c.name), difficulty: EASY.has(c.code) ? 1 : rare.has(c.code) ? 3 : 2, stars: EASY.has(c.code) ? 1 : rare.has(c.code) ? 5 : 3 };
    });
    return { items };
  },

  publicItem(content, index) {
    const it = content.items[index];
    return { flag: flagEmoji(it.code), options: it.options, stars: it.stars ?? 3, index, total: content.items.length };
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
