export type RatingTrack = 'general' | 'trivia' | 'chess' | 'math' | 'flags';

export interface TrackStats {
  rating: number;
  rd: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

export interface League {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend';
  name: string;
  min: number;
}

export interface Me {
  user: { id: number; nickname: string };
  ratings: Record<RatingTrack, TrackStats>;
  league: League;
}

const TOKEN_KEY = 'duel.token';

/**
 * The token lives in localStorage (as requested), but each tab may override it in sessionStorage so
 * two tabs of the same browser can play as two different players ("Alt jucător").
 */
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

/** Forget the identity for this tab only (other tabs keep theirs). */
export function forgetTabIdentity() {
  try {
    sessionStorage.setItem(TOKEN_KEY, '');
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error ?? 'error');
  return body as T;
}

export const api = {
  register: (nickname: string) =>
    request<Me & { token: string }>('/register', { method: 'POST', body: JSON.stringify({ nickname }) }),
  me: () => request<Me>('/me'),
  leaderboard: (track: RatingTrack) => request<LeaderboardResponse>(`/leaderboard/${track}`),
  profile: (id: number | 'me') => request<ProfileResponse>(`/profile/${id}`),
};

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  league: League['id'];
}

export interface LeaderboardResponse {
  track: RatingTrack;
  rows: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export interface RecentDuel {
  id: number;
  createdAt: number;
  domains: string[];
  rounds: { domain: string; mine: number; theirs: number }[];
  forfeit: boolean;
  result: 'W' | 'L' | 'D';
  roundsWon: number;
  oppRoundsWon: number;
  totalScore: number;
  oppTotalScore: number;
  ratingBefore: number;
  ratingAfter: number;
  opponent: string;
  opponentAsync: boolean;
}

export interface ProfileResponse extends Me {
  recent: RecentDuel[];
}
