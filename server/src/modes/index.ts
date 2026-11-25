import type { DomainId } from '../domains';
import type { Rng } from '../rng';
import { chessMode } from './chess';
import { colorMode } from './color';
import { cubeMode } from './cube';
import { flagsMode } from './flags';
import { followersMode, opinionMode, priceMode, yearMode } from './estimate';
import { golfMode } from './golf';
import { splitMode } from './split';
import { timelineMode } from './timeline';
import { triviaMode } from './trivia';
import type { GameMode } from './types';

/** Registry of playable domains. Add new modes here. */
const REGISTERED: GameMode<any>[] = [triviaMode, chessMode, flagsMode, cubeMode, splitMode, colorMode, golfMode, timelineMode, opinionMode, yearMode, priceMode, followersMode];

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

/** Three different random domains (repeats only if fewer than 3 modes are registered). */
export function pickDomains(rng: Rng, count = 3): DomainId[] {
  // Dev/test only: FORCE_DOMAINS=chess,trivia,flags fixes the order of domains.
  const forced = process.env.FORCE_DOMAINS?.split(',').filter((d) => d in MODES) as DomainId[] | undefined;
  if (forced?.length) return Array.from({ length: count }, (_, i) => forced[i % forced.length]);
  const all = rng.shuffle(availableDomains());
  const out: DomainId[] = [];
  for (let i = 0; i < count; i++) out.push(all[i % all.length]);
  return out;
}
