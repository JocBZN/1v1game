import { lazy, type ComponentType } from 'react';
import type { DomainId } from '../lib/domains';
// three.js and the chessboard are big: load them only when such a round actually starts.
const CubeRound = lazy(() => import('./CubeRound').then((m) => ({ default: m.CubeRound })));
const ChessRound = lazy(() => import('./ChessRound').then((m) => ({ default: m.ChessRound })));
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
