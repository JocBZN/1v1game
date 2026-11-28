import { simulateItemBot } from './sim';
import { EXTRA_EVENTS } from './timeline-extra';
import { sumScore, type GameMode, type RoundContent } from './types';

export interface TimelineEvent {
  label: string;
  year: number;
  kind: 'history' | 'game' | 'movie' | 'tech' | 'music';
}

/** Well-documented dates only (first release / the year it happened). */
const BASE_EVENTS: TimelineEvent[] = [
  // history
  { label: 'Fall of the Western Roman Empire', year: 476, kind: 'history' },
  { label: 'Charlemagne crowned emperor', year: 800, kind: 'history' },
  { label: 'Battle of Hastings', year: 1066, kind: 'history' },
  { label: 'Magna Carta sealed', year: 1215, kind: 'history' },
  { label: 'Black Death reaches Europe', year: 1347, kind: 'history' },
  { label: 'Fall of Constantinople', year: 1453, kind: 'history' },
  { label: 'Columbus reaches the Americas', year: 1492, kind: 'history' },
  { label: 'Luther posts the 95 Theses', year: 1517, kind: 'history' },
  { label: 'Shakespeare is born', year: 1564, kind: 'history' },
  { label: 'The Mayflower lands in America', year: 1620, kind: 'history' },
  { label: 'Great Fire of London', year: 1666, kind: 'history' },
  { label: 'Newton publishes the Principia', year: 1687, kind: 'history' },
  { label: 'US Declaration of Independence', year: 1776, kind: 'history' },
  { label: 'Storming of the Bastille', year: 1789, kind: 'history' },
  { label: 'Battle of Waterloo', year: 1815, kind: 'history' },
  { label: 'Darwin publishes On the Origin of Species', year: 1859, kind: 'history' },
  { label: 'American Civil War ends', year: 1865, kind: 'history' },
  { label: 'Bell patents the telephone', year: 1876, kind: 'history' },
  { label: 'Eiffel Tower completed', year: 1889, kind: 'history' },
  { label: 'Wright brothers’ first powered flight', year: 1903, kind: 'history' },
  { label: 'The Titanic sinks', year: 1912, kind: 'history' },
  { label: 'World War I begins', year: 1914, kind: 'history' },
  { label: 'Russian Revolution', year: 1917, kind: 'history' },
  { label: 'Wall Street Crash', year: 1929, kind: 'history' },
  { label: 'World War II begins', year: 1939, kind: 'history' },
  { label: 'World War II ends', year: 1945, kind: 'history' },
  { label: 'Sputnik 1 launched', year: 1957, kind: 'history' },
  { label: 'Yuri Gagarin flies into space', year: 1961, kind: 'history' },
  { label: 'First Moon landing', year: 1969, kind: 'history' },
  { label: 'Fall of the Berlin Wall', year: 1989, kind: 'history' },
  { label: 'Dissolution of the Soviet Union', year: 1991, kind: 'history' },
  { label: 'Euro coins and notes enter circulation', year: 2002, kind: 'history' },
  // video games and consoles
  { label: 'Pong released', year: 1972, kind: 'game' },
  { label: 'Space Invaders released', year: 1978, kind: 'game' },
  { label: 'Pac-Man released', year: 1980, kind: 'game' },
  { label: 'Tetris created', year: 1984, kind: 'game' },
  { label: 'Super Mario Bros. released', year: 1985, kind: 'game' },
  { label: 'The Legend of Zelda released', year: 1986, kind: 'game' },
  { label: 'Game Boy released', year: 1989, kind: 'game' },
  { label: 'Sonic the Hedgehog released', year: 1991, kind: 'game' },
  { label: 'Doom released', year: 1993, kind: 'game' },
  { label: 'First PlayStation released', year: 1994, kind: 'game' },
  { label: 'Pokémon Red and Green released', year: 1996, kind: 'game' },
  { label: 'First Grand Theft Auto released', year: 1997, kind: 'game' },
  { label: 'The Sims released', year: 2000, kind: 'game' },
  { label: 'First Xbox released', year: 2001, kind: 'game' },
  { label: 'World of Warcraft released', year: 2004, kind: 'game' },
  { label: 'Wii Sports released', year: 2006, kind: 'game' },
  { label: 'Minecraft first public version', year: 2009, kind: 'game' },
  { label: 'Skyrim released', year: 2011, kind: 'game' },
  { label: 'Grand Theft Auto V released', year: 2013, kind: 'game' },
  { label: 'Pokémon Go released', year: 2016, kind: 'game' },
  { label: 'Nintendo Switch released', year: 2017, kind: 'game' },
  { label: 'Among Us released', year: 2018, kind: 'game' },
  { label: 'Elden Ring released', year: 2022, kind: 'game' },
  // movies
  { label: 'Snow White and the Seven Dwarfs (Disney)', year: 1937, kind: 'movie' },
  { label: 'Casablanca premieres', year: 1942, kind: 'movie' },
  { label: 'Psycho premieres', year: 1960, kind: 'movie' },
  { label: 'Jaws premieres', year: 1975, kind: 'movie' },
  { label: 'Star Wars premieres', year: 1977, kind: 'movie' },
  { label: 'E.T. the Extra-Terrestrial premieres', year: 1982, kind: 'movie' },
  { label: 'Back to the Future premieres', year: 1985, kind: 'movie' },
  { label: 'Jurassic Park premieres', year: 1993, kind: 'movie' },
  { label: 'Toy Story premieres', year: 1995, kind: 'movie' },
  { label: 'Titanic (the film) premieres', year: 1997, kind: 'movie' },
  { label: 'The Matrix premieres', year: 1999, kind: 'movie' },
  { label: 'Shrek premieres', year: 2001, kind: 'movie' },
  { label: 'Finding Nemo premieres', year: 2003, kind: 'movie' },
  { label: 'Avatar premieres', year: 2009, kind: 'movie' },
  { label: 'Inception premieres', year: 2010, kind: 'movie' },
  { label: 'Frozen premieres', year: 2013, kind: 'movie' },
  { label: 'Avengers: Endgame premieres', year: 2019, kind: 'movie' },
  { label: 'Oppenheimer premieres', year: 2023, kind: 'movie' },
  // tech
  { label: 'Windows 95 (operating system) released', year: 1995, kind: 'tech' },
  { label: 'Google (search engine company) founded', year: 1998, kind: 'tech' },
  { label: 'Wikipedia (online encyclopedia) launched', year: 2001, kind: 'tech' },
  { label: 'Facebook (social network) launched', year: 2004, kind: 'tech' },
  { label: 'YouTube (video website) launched', year: 2005, kind: 'tech' },
  { label: 'First iPhone (smartphone) released', year: 2007, kind: 'tech' },
  { label: 'Instagram (photo app) launched', year: 2010, kind: 'tech' },
  { label: 'ChatGPT (AI chatbot) released', year: 2022, kind: 'tech' },
];

const CONSOLE_RE = /^(First )?(Atari 2600|Commodore 64|NES|Famicom|Sega Genesis \/ Mega Drive|SNES|Game Boy( Color| Advance)?|Nintendo (64|DS|3DS|Wii|Switch 2|Switch)|Sega Dreamcast|PlayStation( 2| 3| 4| 5)?|GameCube|Xbox( 360| One| Series X\|S)?|PSP|Wii U|Steam Deck) released/;
const VERB_RE = / (released|early access|full release|first public version|created|launched|sells)\b/;

/**
 * Every card must say what it is: "Gone with the Wind (film)", "Portal (video game) released",
 * "Wii U (console) released". TV series and awards already say so in their labels.
 */
export function specificLabel(e: TimelineEvent): string {
  const l = e.label;
  if (e.kind === 'movie') {
    if (/\b(airs|series|anime|Oscars?|Palme|Best Picture)\b|\(film|\bfilm\b/i.test(l)) return l;
    if (/ premieres$/.test(l)) return l.replace(/ premieres$/, ' (film) premieres');
    const m = l.match(/^(.*) \(([^)]*)\)$/);
    return m ? `${m[1]} (film, ${m[2]})` : `${l} (film)`;
  }
  if (e.kind === 'game') {
    if (/^Steam platform/.test(l)) return l.replace('Steam platform', 'Steam (PC game store)');
    const type = /^Commodore 64/.test(l) ? 'home computer' : /^Steam Deck/.test(l) ? 'handheld gaming PC' : /^Roblox/.test(l) ? 'online game platform' : CONSOLE_RE.test(l) ? 'console' : 'video game';
    const v = l.match(VERB_RE);
    if (!v || v.index === undefined) return `${l} (${type})`;
    const head = l.slice(0, v.index);
    const tail = l.slice(v.index);
    return head.endsWith(')') ? `${head.slice(0, -1)} ${type})${tail}` : `${head} (${type})${tail}`;
  }
  return l;
}

/** Base list plus the extra events, every label made specific; the first occurrence of a label wins. */
export const EVENTS: TimelineEvent[] = (() => {
  const seen = new Set<string>();
  return [...BASE_EVENTS, ...EXTRA_EVENTS]
    .map((e) => ({ ...e, label: specificLabel(e) }))
    .filter((e) => !seen.has(e.label.toLowerCase()) && seen.add(e.label.toLowerCase()));
})();

export interface TimelineItem {
  /** in the order shown to the player (shuffled) */
  events: { label: string; year: number }[];
}
export type TimelineContent = RoundContent<TimelineItem>;

export const TIMELINE_ITEMS = 3;
export const TIMELINE_ITEM_MS = 25_000;
const FEEDBACK_MS = 3_000;
const MIN_GAP = 3;

/** 1000 × share of pairs in the right relative order (6 pairs for 4 events). */
export function timelinePoints(years: readonly number[]): number {
  let ok = 0;
  let all = 0;
  for (let i = 0; i < years.length; i++)
    for (let j = i + 1; j < years.length; j++) {
      all++;
      if (years[i] < years[j]) ok++;
    }
  return all ? Math.round((1000 * ok) / all) : 0;
}

export function parseOrder(x: unknown, n: number): number[] | null {
  if (!Array.isArray(x) || x.length !== n) return null;
  if (!x.every((v) => Number.isInteger(v) && v >= 0 && v < n)) return null;
  return new Set(x).size === n ? (x as number[]) : null;
}

export const timelineMode: GameMode<TimelineContent> = {
  id: 'timeline',
  name: 'Timeline',
  itemTimeLimit: TIMELINE_ITEM_MS,
  feedbackDelay: FEEDBACK_MS,
  timeLimit: TIMELINE_ITEMS * (TIMELINE_ITEM_MS + FEEDBACK_MS) + 1_000,

  generateRound(rng) {
    const used = new Set<string>();
    const items: TimelineItem[] = [];
    for (let k = 0; k < TIMELINE_ITEMS; k++) {
      const picks: TimelineEvent[] = [];
      for (const e of rng.shuffle(EVENTS)) {
        if (used.has(e.label) || picks.some((p) => Math.abs(p.year - e.year) < MIN_GAP)) continue;
        picks.push(e);
        if (picks.length === 4) break;
      }
      picks.forEach((p) => used.add(p.label));
      items.push({ events: picks.map(({ label, year }) => ({ label, year })) });
    }
    return { items };
  },

  publicItem(content, index) {
    return { labels: content.items[index].events.map((e) => e.label), index, total: content.items.length };
  },

  validateAnswer(content, index, answer) {
    const ev = content.items[index].events;
    const order = parseOrder(answer, ev.length);
    const years = ev.map((e) => e.year);
    if (!order) return { correct: false, points: 0, itemDone: true, feedback: { years } };
    const points = timelinePoints(order.map((i) => ev[i].year));
    return { correct: points === 1000, points, itemDone: true, feedback: { years } };
  },

  timeoutFeedback(content, index) {
    return { years: content.items[index].events.map((e) => e.year) };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    return simulateItemBot({
      count: content.items.length, rating, rng, itemTimeLimit: TIMELINE_ITEM_MS, feedbackDelay: FEEDBACK_MS,
      roundLimit: this.timeLimit, thinkMs: 14_000,
      points: (_i, q) => (q > 0.85 ? 1000 : q > 0.6 ? 833 : q > 0.35 ? 667 : 500),
    });
  },
};
