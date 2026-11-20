import { Glicko2 } from 'glicko2';
import { DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOL } from './constants';

export const TAU = 0.5;

export interface Rating {
  rating: number;
  rd: number;
  vol: number;
}

export interface GameResult {
  opponent: Rating;
  /** 1 win, 0.5 draw, 0 loss — from the player's point of view */
  score: 0 | 0.5 | 1;
}

/**
 * One Glicko-2 rating period for `player` against the given results. The opponents' ratings are
 * treated as fixed inputs (they're updated separately — or not at all, for ghosts and bots).
 */
export function rate(player: Rating, results: readonly GameResult[]): Rating {
  const ranking = new Glicko2({ tau: TAU, rating: DEFAULT_RATING, rd: DEFAULT_RD, vol: DEFAULT_VOL });
  const me = ranking.makePlayer(player.rating, player.rd, player.vol);
  if (results.length === 0) return { ...player };
  const matches = results.map((r) => {
    const opp = ranking.makePlayer(r.opponent.rating, r.opponent.rd, r.opponent.vol);
    return [me, opp, r.score] as [typeof me, typeof opp, number];
  });
  ranking.updateRatings(matches);
  return { rating: me.getRating(), rd: me.getRd(), vol: me.getVol() };
}

/** Expected score of `a` vs `b` (Glicko-2 E function). */
export function expectedScore(a: Rating, b: Rating): number {
  const ranking = new Glicko2({ tau: TAU });
  return ranking.predict(ranking.makePlayer(a.rating, a.rd, a.vol), ranking.makePlayer(b.rating, b.rd, b.vol));
}
