import { capture } from './analytics';
import express, { type Request, type Response, type NextFunction } from 'express';
import { authenticate, changePassword, createGuest, login, register } from './auth';
import { getLeaderboard, getRank, getRatings, getRecentDuels, getUserById, type User, buyIcon, getCoins, ownedIcons, ownsIcon, setAvatarIcon } from './db';
import { PROFILE_ICONS, getProfileIcon } from './icons';
import { RATING_TRACKS, isRatingTrack, type RatingTrack } from './domains';
import { leagueFor } from './leagues';

type AuthedRequest = Request & { user?: User };


function bearer(req: Request): string | undefined {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = authenticate(bearer(req));
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
}

export function publicRatings(userId: number) {
  const rows = getRatings(userId);
  const out = {} as Record<RatingTrack, { rating: number; rd: number; wins: number; losses: number; draws: number; games: number }>;
  for (const t of RATING_TRACKS) {
    const r = rows[t];
    out[t] = { rating: Math.round(r.rating), rd: Math.round(r.rd), wins: r.wins, losses: r.losses, draws: r.draws, games: r.games };
  }
  return out;
}

function me(user: User) {
  const ratings = publicRatings(user.id);
  return {
    user: { id: user.id, nickname: user.nickname, guest: !!user.is_guest, avatar: user.avatar_icon ?? null },
    ratings,
    league: leagueFor(ratings.general.rating),
  };
}

/** Simple fixed-window limiter per client IP (in memory: fine for a single server). */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip ?? 'unknown';
    let h = hits.get(ip);
    if (!h || now >= h.resetAt) {
      if (hits.size > 10_000) for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
      h = { n: 0, resetAt: now + windowMs };
      hits.set(ip, h);
    }
    if (++h.n > max) return res.status(429).json({ error: 'rate_limited' });
    next();
  };
}

export function createApi() {
  const api = express.Router();
  api.use(express.json({ limit: '10kb' }));

  // Instant guest account (play first, sign up later).
  api.post('/guest', rateLimit(30, 10 * 60_000), (_req, res) => {
    const user = createGuest();
    res.json({ token: user.token, ...me(user) });
  });

  // Create an account; a guest caller is upgraded in place (keeps rating and history).
  api.post('/register', rateLimit(10, 10 * 60_000), (req, res) => {
    const current = authenticate(bearer(req));
    const r = register(req.body?.nickname, req.body?.password, current);
    if (!r.ok) return res.status(400).json({ error: r.error });
    capture(r.user.id, 'signed_up', {
      from_guest: r.upgraded,
      games_as_guest: r.upgraded ? getRatings(r.user.id).general.games : 0,
      $set: { nickname: r.user.nickname, is_guest: false },
      $set_once: { signed_up_at: new Date().toISOString() },
    });
    res.json({ token: r.user.token, upgraded: r.upgraded, ...me(r.user) });
  });

  api.post('/login', rateLimit(20, 10 * 60_000), (req, res) => {
    const r = login(req.body?.nickname, req.body?.password);
    if (!r.ok) return res.status(401).json({ error: r.error });
    capture(r.user.id, 'logged_in', { $set: { nickname: r.user.nickname, is_guest: false } });
    res.json({ token: r.user.token, ...me(r.user) });
  });

  api.get('/me', requireAuth, (req: AuthedRequest, res) => {
    res.json(me(req.user!));
  });

  api.get('/leaderboard/:track', requireAuth, (req: AuthedRequest, res) => {
    const track = req.params.track;
    if (!isRatingTrack(track)) return res.status(400).json({ error: 'bad_track' });
    const rows = getLeaderboard(track, 100).map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      nickname: r.nickname,
      avatar: r.avatar_icon ?? null,
      rating: Math.round(r.rating),
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      games: r.games,
      league: leagueFor(r.rating).id,
    }));
    const mine = getRatings(req.user!.id)[track];
    // Guests are never ranked: they see the board and an invitation to sign up.
    const myEntry = mine.games > 0 && !req.user!.is_guest
      ? {
          rank: getRank(track, mine.rating),
          userId: req.user!.id,
          nickname: req.user!.nickname,
          avatar: req.user!.avatar_icon ?? null,
          rating: Math.round(mine.rating),
          wins: mine.wins, losses: mine.losses, draws: mine.draws, games: mine.games,
          league: leagueFor(mine.rating).id,
        }
      : null;
    res.json({ track, rows, me: myEntry, guest: !!req.user!.is_guest });
  });

  // ---- profile icons (registered accounts) ----
  const iconState = (user: User) => {
    const owned = new Set(ownedIcons(user.id));
    for (const i of PROFILE_ICONS) if (i.price === 0) owned.add(i.id);
    return { coins: getCoins(user.id), owned: [...owned], selected: getUserById(user.id)?.avatar_icon ?? null };
  };

  api.get('/icons', requireAuth, (req: AuthedRequest, res) => {
    res.json(iconState(req.user!));
  });

  api.post('/icons/:id/buy', rateLimit(60, 10 * 60_000), requireAuth, (req: AuthedRequest, res) => {
    if (req.user!.is_guest) return res.status(403).json({ error: 'not_registered' });
    const icon = getProfileIcon(req.params.id);
    if (!icon) return res.status(404).json({ error: 'not_found' });
    const r = icon.price === 0 ? 'owned' : buyIcon(req.user!.id, icon.id, icon.price);
    if (r === 'not_enough_coins') return res.status(402).json({ error: r, ...iconState(req.user!) });
    res.json(iconState(req.user!));
  });

  api.post('/icons/:id/select', rateLimit(60, 10 * 60_000), requireAuth, (req: AuthedRequest, res) => {
    if (req.user!.is_guest) return res.status(403).json({ error: 'not_registered' });
    const icon = getProfileIcon(req.params.id);
    if (!icon) return res.status(404).json({ error: 'not_found' });
    if (icon.price > 0 && !ownsIcon(req.user!.id, icon.id)) return res.status(402).json({ error: 'not_owned' });
    setAvatarIcon(req.user!.id, icon.id);
    res.json(iconState(req.user!));
  });

  api.delete('/icons/selected', requireAuth, (req: AuthedRequest, res) => {
    setAvatarIcon(req.user!.id, null);
    res.json(iconState(req.user!));
  });

  // ---- password ----
  api.post('/password', rateLimit(10, 10 * 60_000), requireAuth, (req: AuthedRequest, res) => {
    const r = changePassword(req.user!, req.body?.current, req.body?.next);
    if (!r.ok) return res.status(r.error === 'bad_credentials' ? 401 : 400).json({ error: r.error });
    res.json({ token: r.user.token, ...me(r.user) });
  });

  api.get('/profile/:id', requireAuth, (req: AuthedRequest, res) => {
    const id = req.params.id === 'me' ? req.user!.id : Number(req.params.id);
    const user = Number.isInteger(id) ? getUserById(id) : undefined;
    if (!user) return res.status(404).json({ error: 'not_found' });
    const base = me(user);
    res.json({ ...base, recent: getRecentDuels(user.id, 10) });
  });

  return api;
}
