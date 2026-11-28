export type RatingTrack = 'general' | 'trivia' | 'chess' | 'flags' | 'cube' | 'split' | 'color' | 'golf' | 'timeline' | 'opinion' | 'year' | 'price' | 'followers' | 'globe' | 'photo' | 'vehicles';

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
  user: { id: number; nickname: string; guest: boolean; avatar?: string | null };
  ratings: Record<RatingTrack, TrackStats>;
  league: League;
}

const TOKEN_KEY = 'duel.token';

/**
 * The token lives in localStorage (as requested), but each tab may override it in sessionStorage so
 * two tabs of the same browser can play as two different players ("Switch player").
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

/** Log out on this device. */
export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
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
  guest: () => request<Me & { token: string }>('/guest', { method: 'POST', body: '{}' }),
  register: (nickname: string, password: string) =>
    request<Me & { token: string; upgraded: boolean }>('/register', { method: 'POST', body: JSON.stringify({ nickname, password }) }),
  login: (nickname: string, password: string) =>
    request<Me & { token: string }>('/login', { method: 'POST', body: JSON.stringify({ nickname, password }) }),
  me: () => request<Me>('/me'),
  leaderboard: (track: RatingTrack) => request<LeaderboardResponse>(`/leaderboard/${track}`),
  profile: (id: number | 'me') => request<ProfileResponse>(`/profile/${id}`),
  icons: () => request<IconState>('/icons'),
  buyIcon: (id: string) => request<IconState>(`/icons/${encodeURIComponent(id)}/buy`, { method: 'POST', body: '{}' }),
  selectIcon: (id: string) => request<IconState>(`/icons/${encodeURIComponent(id)}/select`, { method: 'POST', body: '{}' }),
  clearIcon: () => request<IconState>('/icons/selected', { method: 'DELETE' }),
  changePassword: (current: string, next: string) =>
    request<Me & { token: string }>('/password', { method: 'POST', body: JSON.stringify({ current, next }) }),
};

/** Coins, icons the player may use (free ones included) and the one in use. */
export interface IconState {
  coins: number;
  owned: string[];
  selected: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  nickname: string;
  avatar?: string | null;
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
  guest: boolean;
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
