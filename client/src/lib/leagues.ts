import type { League } from './api';

export const LEAGUE_META: Record<League['id'], { name: string; emoji: string; color: string; gradient: string }> = {
  bronze: { name: 'Bronz', emoji: '🥉', color: '#d08b5b', gradient: 'from-orange-700 to-amber-600' },
  silver: { name: 'Argint', emoji: '🥈', color: '#c0c7d6', gradient: 'from-slate-400 to-slate-200' },
  gold: { name: 'Aur', emoji: '🥇', color: '#fbbf24', gradient: 'from-amber-500 to-yellow-300' },
  platinum: { name: 'Platină', emoji: '💠', color: '#67e8f9', gradient: 'from-cyan-500 to-teal-300' },
  diamond: { name: 'Diamant', emoji: '💎', color: '#a78bfa', gradient: 'from-violet-500 to-sky-400' },
  legend: { name: 'Legendă', emoji: '👑', color: '#f472b6', gradient: 'from-pink-500 via-fuchsia-500 to-amber-400' },
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
  let id: League['id'] = 'bronze';
  for (const l of LEAGUE_THRESHOLDS) if (rating >= l.min) id = l.id;
  return id;
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
