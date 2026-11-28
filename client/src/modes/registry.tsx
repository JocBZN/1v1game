import { lazy, type ComponentType } from 'react';
import type { DomainId } from '../lib/domains';
// three.js and the chessboard are big: kept out of the first download, then fetched in the
// background (prefetchHeavyModes) so a cube or chess round never waits on the network.
const loadCube = () => import('./CubeRound');
const loadChess = () => import('./ChessRound');
const CubeRound = lazy(() => loadCube().then((m) => ({ default: m.CubeRound })));
const ChessRound = lazy(() => loadChess().then((m) => ({ default: m.ChessRound })));

let prefetched = false;
/** Download the cube and chess code while the player is on the home screen or searching. */
export function prefetchHeavyModes() {
  if (prefetched) return;
  prefetched = true;
  const go = () => void Promise.all([loadCube(), loadChess()]).catch(() => { prefetched = false; });
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(go, { timeout: 3000 });
  else setTimeout(go, 1500);
}
import { ColorRound } from './ColorRound';
import { EstimateRound } from './EstimateRound';
import { FlagsRound } from './FlagsRound';
import { GlobeRound } from './GlobeRound';
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
  opinion: EstimateRound,
  year: EstimateRound,
  globe: GlobeRound,
  price: EstimateRound,
  followers: EstimateRound,
};
