import type { DomainId } from '../domains';
import type { Rng } from '../rng';
import { mathMode } from './math';
import type { GameMode } from './types';

/** Registry of playable domains. Add new modes here. */
const REGISTERED: GameMode<any>[] = [mathMode];

/** For automated tests only: ROUND_TIME_SCALE=0.2 makes every round 5× shorter. */
const SCALE = Number(process.env.ROUND_TIME_SCALE ?? 1);

const MODES: Partial<Record<DomainId, GameMode<any>>> = Object.fromEntries(
  REGISTERED.map((m) => [
    m.id,
    SCALE === 1
      ? m
      : { ...m, timeLimit: m.timeLimit * SCALE, itemTimeLimit: m.itemTimeLimit && m.itemTimeLimit * SCALE },
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
  const all = rng.shuffle(availableDomains());
  const out: DomainId[] = [];
  for (let i = 0; i < count; i++) out.push(all[i % all.length]);
  return out;
}
