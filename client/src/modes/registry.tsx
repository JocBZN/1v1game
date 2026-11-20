import { lazy, type ComponentType } from 'react';
import type { DomainId } from '../lib/domains';
import { ChessRound } from './ChessRound';

// three.js is big: load the cube only when a cube round actually starts.
const CubeRound = lazy(() => import('./CubeRound').then((m) => ({ default: m.CubeRound })));
import { FlagsRound } from './FlagsRound';
import { MathRound } from './MathRound';
import { TriviaRound } from './TriviaRound';
import type { ModeProps } from './types';

/** One React component per domain. Add new domains here (and on the server in `modes/index.ts`). */
export const MODE_COMPONENTS: Partial<Record<DomainId, ComponentType<ModeProps>>> = {
  math: MathRound,
  trivia: TriviaRound,
  flags: FlagsRound,
  chess: ChessRound,
  cube: CubeRound,
};
