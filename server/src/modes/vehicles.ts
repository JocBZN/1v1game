/**
 * "Vehicles": a photo of a car, aircraft, motorcycle, ship or kind of vehicle, and a question about it:
 * which model / brand / ship / kind it is (4 options), or now and then how much it cost (slider).
 *
 * Data (server/data/vehicles.json): models and kinds from Wikidata, each with the photo Wikidata
 * itself gives for it (P18, a Wikimedia Commons file), so the picture and the name come from the
 * same record. Prices are documented launch / list / auction prices with their year. The photo is
 * served through /api/photo so its file name (which usually spells out the answer) stays hidden.
 */
import fs from 'node:fs';
import type { Rng } from '../rng';
import { dataFile } from '../paths';
import { imagePath, onImageLookup } from '../images';
import { validateChoice, simulateChoiceBot, type ChoiceItem } from './choice';
import { estimatePoints } from './estimate';
import { isNum } from './sim';
import { sumScore, type GameMode, type RoundContent } from './types';

export type VehicleKind = 'car' | 'plane' | 'moto' | 'ship' | 'shipclass' | 'type';

interface Row {
  /** kind */
  k: VehicleKind;
  /** name (the answer) */
  l: string;
  /** brand, for "which brand made this car?" (only when it is certain) */
  b?: string;
  /** family of a kind of vehicle: land / water / air (distractors come from the same family) */
  f?: 'land' | 'water' | 'air';
  /** Wikipedia sitelinks: how well known it is */
  sl: number;
  img: string;
  /** credit: author · licence */
  c: string;
  /** Commons file page */
  u: string;
}

interface PriceRow {
  /** what it is, shown with the answer */
  l: string;
  /** the question */
  q: string;
  /** US dollars */
  a: number;
  /** where the number comes from (year, launch / list / auction) */
  n: string;
  img: string;
  c: string;
  u: string;
}

export interface VehicleItem extends ChoiceItem {
  kind: 'choice' | 'price';
  q: string;
  img: string;
  credit: { text: string; url: string };
  /** the right name, or what the price is for */
  name: string;
  /** price items: dollars */
  price?: number;
  note?: string;
}
export type VehicleContent = RoundContent<VehicleItem>;

export const VEHICLE_ITEMS = 5;
export const VEHICLE_ITEM_MS = 12_000;
const FEEDBACK_MS = 1_800;
const PRICE_INPUT = { kind: 'log' as const, min: 100, max: 1e10, prefix: '$' };

let data: { items: Row[]; prices: PriceRow[] } | null = null;
export function vehicleData() {
  if (!data) {
    data = JSON.parse(fs.readFileSync(dataFile('vehicles.json'), 'utf8')) as { items: Row[]; prices: PriceRow[] };
    for (const r of [...data.items, ...data.prices]) imagePath(r.img);
  }
  return data;
}
onImageLookup(vehicleData);

const QUESTION: Record<VehicleKind, string> = {
  car: 'Which car is this?',
  plane: 'Which aircraft is this?',
  moto: 'Which motorcycle is this?',
  ship: 'Which ship is this?',
  shipclass: 'Which class of ship is this?',
  type: 'What is this called?',
};

/** Better-known = easier = fewer stars. */
function starsOf(sl: number, kind: VehicleKind): number {
  const s = kind === 'type' ? sl - 25 : sl;
  return s >= 60 ? 1 : s >= 40 ? 2 : s >= 25 ? 3 : s >= 15 ? 4 : 5;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Brand + start of the model ("airbus a3", "honda cb"): same family, often the same silhouette. */
const family = (s: string) => {
  const [w1 = '', w2 = ''] = norm(s).split(' ');
  return `${w1} ${w2.slice(0, 2)}`;
};
/** Two names too close to tell apart fairly from a photo ("Ford Mustang" / "Ford Mustang Mach-E", "Airbus A319" / "Airbus A321"). */
function tooClose(a: string, b: string) {
  const x = norm(a);
  const y = norm(b);
  return x === y || x.includes(y) || y.includes(x) || family(a) === family(b);
}

function pickWrong(rng: Rng, answer: string, pool: string[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of rng.shuffle(pool)) {
    if (out.length >= n) break;
    if (tooClose(cand, answer) || out.some((o) => tooClose(o, cand))) continue;
    out.push(cand);
  }
  return out;
}

function choiceItem(rng: Rng, row: Row, q: string, answer: string, wrong: string[], stars: number): VehicleItem {
  const options = rng.shuffle([answer, ...wrong]);
  return {
    kind: 'choice', q, options, answer: options.indexOf(answer), difficulty: 2, stars,
    img: row.img, credit: { text: row.c, url: row.u }, name: row.l,
  };
}

/** Question for one row (null when no fair distractors exist). */
export function questionFor(rng: Rng, row: Row, all: Row[], askBrand = false): VehicleItem | null {
  if (askBrand && row.k === 'car' && row.b) {
    const brands = [...new Set(all.filter((r) => r.k === 'car' && r.b && r.b !== row.b).map((r) => r.b!))];
    const wrong = pickWrong(rng, row.b, brands);
    if (wrong.length === 3) return choiceItem(rng, row, 'Which brand made this car?', row.b, wrong, Math.max(1, starsOf(row.sl, 'car') - 1));
  }
  const same = all.filter((r) => r.k === row.k && r.l !== row.l && (row.k !== 'type' || r.f === row.f));
  // Cars and motorcycles: one option from the same brand when possible, so the badge alone isn't enough.
  const sameBrand = row.b ? same.filter((r) => r.b === row.b).map((r) => r.l) : [];
  const first = pickWrong(rng, row.l, sameBrand, 1);
  const rest = pickWrong(rng, row.l, same.map((r) => r.l).filter((l) => !first.some((f) => tooClose(f, l))), 3 - first.length);
  const wrong = [...first, ...rest];
  if (wrong.length < 3) return null;
  return choiceItem(rng, row, QUESTION[row.k], row.l, wrong, starsOf(row.sl, row.k));
}

function priceItem(p: PriceRow): VehicleItem {
  return {
    kind: 'price', q: p.q, options: [], answer: -1, difficulty: 2, stars: 3,
    img: p.img, credit: { text: p.c, url: p.u }, name: p.l, price: p.a, note: p.n,
  };
}

/** Round mix: mostly "which one is it?", with a brand, a kind of vehicle and sometimes a price. */
const SLOTS: [VehicleKind | 'brand' | 'price', number][] = [
  ['car', 33], ['plane', 21], ['moto', 10], ['shipclass', 5], ['type', 16], ['brand', 8], ['price', 7],
];

export const vehiclesMode: GameMode<VehicleContent> = {
  id: 'vehicles',
  name: 'Vehicles',
  itemTimeLimit: VEHICLE_ITEM_MS,
  feedbackDelay: FEEDBACK_MS,
  timeLimit: VEHICLE_ITEMS * (VEHICLE_ITEM_MS + FEEDBACK_MS) + 1_000,

  generateRound(rng) {
    const { items: all, prices } = vehicleData();
    const used = new Set<string>();
    const items: VehicleItem[] = [];
    let priced = 0;
    const total = SLOTS.reduce((s, [, w]) => s + w, 0);
    for (let guard = 0; items.length < VEHICLE_ITEMS && guard < 200; guard++) {
      let r = rng() * total;
      const slot = SLOTS.find(([, w]) => (r -= w) < 0)![0];
      if (slot === 'price') {
        if (priced) continue;
        const p = rng.pick(prices);
        if (used.has(p.img)) continue;
        used.add(p.img);
        priced++;
        items.push(priceItem(p));
        continue;
      }
      const kind: VehicleKind = slot === 'brand' ? 'car' : slot;
      const pool = all.filter((x) => x.k === kind && !used.has(x.img) && (slot !== 'brand' || x.b));
      if (!pool.length) continue;
      const row = rng.pick(pool);
      const it = questionFor(rng, row, all, slot === 'brand');
      if (!it) continue;
      used.add(row.img);
      items.push(it);
    }
    return { items };
  },

  publicItem(content, index) {
    const it = content.items[index];
    const base = { kind: it.kind, q: it.q, img: imagePath(it.img), index, total: content.items.length };
    if (it.kind === 'price') return { ...base, unit: '$', input: PRICE_INPUT, seconds: VEHICLE_ITEM_MS / 1000 };
    return { ...base, options: it.options, stars: it.stars ?? 3 };
  },

  validateAnswer(content, index, answer, ctx) {
    const it = content.items[index];
    const reveal = { credit: it.credit, name: it.name };
    if (it.kind === 'price') {
      const fb = { ...reveal, answer: it.price!, note: it.note ?? null };
      if (!isNum(answer) || answer <= 0) return { correct: false, points: 0, itemDone: true, feedback: fb };
      const points = estimatePoints(PRICE_INPUT, it.price!, answer, 5);
      return { correct: points >= 750, points, itemDone: true, feedback: { ...fb, guess: answer } };
    }
    const r = validateChoice(it, answer, ctx.elapsedMs, this.itemTimeLimit!);
    return { ...r, feedback: { ...r.feedback, ...reveal } };
  },

  timeoutFeedback(content, index) {
    const it = content.items[index];
    const reveal = { credit: it.credit, name: it.name };
    return it.kind === 'price' ? { ...reveal, answer: it.price!, note: it.note ?? null } : { ...reveal, correctIndex: it.answer, chosen: null };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    return simulateChoiceBot(content, rating, rng, this.itemTimeLimit!, this.feedbackDelay);
  },
};
