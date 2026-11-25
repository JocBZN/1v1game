import { Crown, Gem, Medal, Shield, type LucideIcon } from 'lucide-react';
import type { League } from './api';

/** League colours are tuned to read on the cream background. */
export const LEAGUE_META: Record<League['id'], { name: string; icon: LucideIcon; color: string }> = {
  bronze: { name: 'Bronze', icon: Medal, color: '#9c5a2e' },
  silver: { name: 'Silver', icon: Medal, color: '#7a7268' },
  gold: { name: 'Gold', icon: Medal, color: '#b56500' },
  platinum: { name: 'Platinum', icon: Shield, color: '#4f7f7a' },
  diamond: { name: 'Diamond', icon: Gem, color: '#007f8f' },
  legend: { name: 'Legend', icon: Crown, color: '#df301c' },
};

export const LEAGUE_THRESHOLDS: { id: League['id']; min: number }[] = [
  { id: 'bronze', min: -Infinity },
  { id: 'silver', min: 1300 },
  { id: 'gold', min: 1500 },
  { id: 'platinum', min: 1700 },
  { id: 'diamond', min: 1900 },
  { id: 'legend', min: 2100 },
];

export function leagueOf(rating: number): League['id'] {
  const r = Math.round(rating);
  let id: League['id'] = 'bronze';
  for (const l of LEAGUE_THRESHOLDS) if (r >= l.min) id = l.id;
  return id;
}

export function leagueRank(id: League['id']): number {
  return LEAGUE_THRESHOLDS.findIndex((l) => l.id === id);
}

/** Progress (0..1) towards the next league, and that league. */
export function leagueProgress(rating: number): { next: League['id'] | null; pct: number; toGo: number } {
  const idx = LEAGUE_THRESHOLDS.findIndex((l) => l.id === leagueOf(rating));
  const next = LEAGUE_THRESHOLDS[idx + 1];
  if (!next) return { next: null, pct: 1, toGo: 0 };
  const lo = idx === 0 ? 1100 : LEAGUE_THRESHOLDS[idx].min;
  const pct = Math.max(0, Math.min(1, (rating - lo) / (next.min - lo)));
  return { next: next.id, pct, toGo: Math.max(0, Math.ceil(next.min - rating)) };
}
