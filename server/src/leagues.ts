export interface League {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
  name: string;
  min: number;
}

export const LEAGUES: League[] = [
  { id: 'bronze', name: 'Bronze', min: -Infinity },
  { id: 'silver', name: 'Silver', min: 1300 },
  { id: 'gold', name: 'Gold', min: 1500 },
  { id: 'platinum', name: 'Platinum', min: 1700 },
  { id: 'diamond', name: 'Diamond', min: 1900 },
  { id: 'legend', name: 'Legend', min: 2100 },
];

/** League for a rating, using the rounded value players actually see (1299.6 shows as 1300 → Silver). */
export function leagueFor(rating: number): League {
  const r = Math.round(rating);
  let found = LEAGUES[0];
  for (const l of LEAGUES) if (r >= l.min) found = l;
  return found;
}
