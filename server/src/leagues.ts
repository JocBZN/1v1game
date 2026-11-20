export interface League {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
  name: string;
  min: number;
}

export const LEAGUES: League[] = [
  { id: 'bronze', name: 'Bronz', min: -Infinity },
  { id: 'silver', name: 'Argint', min: 1300 },
  { id: 'gold', name: 'Aur', min: 1500 },
  { id: 'platinum', name: 'Platină', min: 1700 },
  { id: 'diamond', name: 'Diamant', min: 1900 },
  { id: 'legend', name: 'Legendă', min: 2100 },
];

export function leagueFor(rating: number): League {
  let found = LEAGUES[0];
  for (const l of LEAGUES) if (rating >= l.min) found = l;
  return found;
}
