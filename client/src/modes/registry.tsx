import type { ComponentType } from 'react';
import type { DomainId } from '../lib/domains';
import { MathRound } from './MathRound';
import type { ModeProps } from './types';

/** One React component per domain. Add new domains here (and on the server in `modes/index.ts`). */
export const MODE_COMPONENTS: Partial<Record<DomainId, ComponentType<ModeProps>>> = {
  math: MathRound,
};
