import { lazy, type ComponentType } from 'react';
import type { DomainId } from '../lib/domains';
// three.js and the chessboard are big: load them only when such a round actually starts.
const CubeRound = lazy(() => import('./CubeRound').then((m) => ({ default: m.CubeRound })));
const ChessRound = lazy(() => import('./ChessRound').then((m) => ({ default: m.ChessRound })));
import { ColorRound } from './ColorRound';
import { FlagsRound } from './FlagsRound';
import { GolfRound } from './GolfRound';
import { SplitRound } from './SplitRound';
import { TimelineRound } from './TimelineRound';
import { TriviaRound } from './TriviaRound';
import type { ModeProps } from './types';

/** One React component per domain. Add new domains here (and on the server in `modes/index.ts`). */
export const MODE_COMPONENTS: Partial<Record<DomainId, ComponentType<ModeProps>>> = {
  trivia: TriviaRound,
  flags: FlagsRound,
  chess: ChessRound,
  cube: CubeRound,
  split: SplitRound,
  color: ColorRound,
  golf: GolfRound,
  timeline: TimelineRound,
};
