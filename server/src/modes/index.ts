import type { DomainId } from '../domains';
import type { Rng } from '../rng';
import { chessMode } from './chess';
import { colorMode } from './color';
import { cubeMode } from './cube';
import { flagsMode } from './flags';
import { followersMode, opinionMode, photoMode, priceMode, yearMode } from './estimate';
import { globeMode } from './globe';
import { vehiclesMode } from './vehicles';
import { golfMode } from './golf';
import { splitMode } from './split';
import { timelineMode } from './timeline';
import { triviaMode } from './trivia';
import type { GameMode } from './types';

/** Registry of playable domains. Add new modes here. */
const REGISTERED: GameMode<any>[] = [triviaMode, chessMode, flagsMode, cubeMode, splitMode, colorMode, golfMode, timelineMode, opinionMode, yearMode, priceMode, followersMode, globeMode, photoMode, vehiclesMode];

/** For automated tests only: ROUND_TIME_SCALE=0.2 makes every round 5× shorter. */
const SCALE = Number(process.env.ROUND_TIME_SCALE ?? 1);

const MODES: Partial<Record<DomainId, GameMode<any>>> = Object.fromEntries(
  REGISTERED.map((m) => [
    m.id,
    SCALE === 1
      ? m
      : {
          ...m,
          timeLimit: m.timeLimit * SCALE,
          itemTimeLimit: m.itemTimeLimit && m.itemTimeLimit * SCALE,
          feedbackDelay: m.feedbackDelay * SCALE,
        },
  ]),
);

export function getMode(id: DomainId): GameMode {
  const m = MODES[id];
  if (!m) throw new Error(`unknown mode ${id}`);
  return m;
}

export function availableDomains(): DomainId[] {
  return Object.keys(MODES) as DomainId[];
}

/**
 * Three different random domains, chosen from `allowed` when given (bans, private-room settings).
 * With fewer allowed domains than rounds, domains repeat (one allowed game = every round is that game).
 */
export function pickDomains(rng: Rng, count = 3, allowed?: readonly DomainId[]): DomainId[] {
  // Dev/test only: FORCE_DOMAINS=chess,trivia,flags fixes the order of domains.
  const forced = process.env.FORCE_DOMAINS?.split(',').filter((d) => d in MODES) as DomainId[] | undefined;
  if (forced?.length) return Array.from({ length: count }, (_, i) => forced[i % forced.length]);
  let pool = allowed?.length ? availableDomains().filter((d) => allowed.includes(d)) : availableDomains();
  if (!pool.length) pool = availableDomains();
  const cycle = (list: DomainId[]) => {
    const all = rng.shuffle(list);
    return Array.from({ length: count }, (_, i) => all[i % all.length]);
  };
  // Some games come up less often than the rest (only when other games are allowed too).
  for (const [rare, factor] of Object.entries(RARER) as [DomainId, number][]) {
    if (!pool.includes(rare) || pool.length === 1) continue;
    const others = pool.filter((d) => d !== rare);
    const picks = cycle(others);
    // Same chance as before for every other game, `factor` × the usual chance for this one.
    if (rng.chance(factor * Math.min(1, count / pool.length))) picks[rng.int(0, count - 1)] = rare;
    return picks;
  }
  return cycle(pool);
}

/** Games that come up less often: multiplier on their usual chance of being in a duel. */
export const RARER: Partial<Record<DomainId, number>> = { color: 0.5 };
