import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_ROOT } from './paths';
import { RATING_TRACKS, type DomainId, type RatingTrack } from './domains';

import { CONTENT_VERSION, DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOL } from './constants';
export { DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOL };

const dbPath = process.env.DB_PATH ?? path.join(SERVER_ROOT, 'db', 'duel.sqlite');
if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  token       TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track    TEXT NOT NULL,           -- 'general' | domain id
  rating   REAL NOT NULL,
  rd       REAL NOT NULL,
  vol      REAL NOT NULL,
  wins     INTEGER NOT NULL DEFAULT 0,
  losses   INTEGER NOT NULL DEFAULT 0,
  draws    INTEGER NOT NULL DEFAULT 0,
  games    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, track)
);
CREATE INDEX IF NOT EXISTS idx_ratings_track ON ratings(track, rating DESC);

CREATE TABLE IF NOT EXISTS duels (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  INTEGER NOT NULL,
  domains     TEXT NOT NULL,        -- JSON array of domain ids actually played
  rounds      TEXT NOT NULL,        -- JSON: [{domain, scores:[a,b]}]
  forfeit     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS duel_players (
  duel_id        INTEGER NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  slot           INTEGER NOT NULL,  -- 0 | 1
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL, -- null for bots
  kind           TEXT NOT NULL,     -- 'human' | 'ghost' | 'bot'
  name           TEXT NOT NULL,
  result         TEXT NOT NULL,     -- 'W' | 'L' | 'D'
  rounds_won     INTEGER NOT NULL,
  total_score    INTEGER NOT NULL,
  rating_before  REAL NOT NULL,
  rating_after   REAL NOT NULL,
  changes        TEXT NOT NULL,     -- JSON: {track: {before, after}}
  PRIMARY KEY (duel_id, slot)
);
CREATE INDEX IF NOT EXISTS idx_duel_players_user ON duel_players(user_id, duel_id DESC);

-- Every round a real human plays is recorded so it can be replayed as a ghost.
CREATE TABLE IF NOT EXISTS round_recordings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain          TEXT NOT NULL,
  content_key     TEXT NOT NULL,    -- hash of the round content
  content         TEXT NOT NULL,    -- JSON, full server-side content (incl. answers)
  events          TEXT NOT NULL,    -- JSON: [{t, item, points, correct, done}]
  score           INTEGER NOT NULL,
  duration_ms     INTEGER NOT NULL,
  rating          REAL NOT NULL,    -- domain rating snapshot
  rd              REAL NOT NULL,
  general_rating  REAL NOT NULL,    -- general rating snapshot
  general_rd      REAL NOT NULL,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rec_domain ON round_recordings(domain, general_rating);
CREATE INDEX IF NOT EXISTS idx_rec_user ON round_recordings(user_id, domain);
`);

// Migration: content version of each recording (rows from before this column count as version 1).
if (!(db.prepare('PRAGMA table_info(round_recordings)').all() as { name: string }[]).some((c) => c.name === 'content_version')) {
  db.exec('ALTER TABLE round_recordings ADD COLUMN content_version INTEGER NOT NULL DEFAULT 1');
}

// ---------- users ----------

export interface User {
  id: number;
  nickname: string;
  token: string;
  created_at: number;
}

const stmtInsertUser = db.prepare('INSERT INTO users (nickname, token, created_at) VALUES (?, ?, ?)');
const stmtInsertRating = db.prepare(
  'INSERT OR IGNORE INTO ratings (user_id, track, rating, rd, vol) VALUES (?, ?, ?, ?, ?)',
);

export const createUser = db.transaction((nickname: string, token: string): User => {
  const now = Date.now();
  const info = stmtInsertUser.run(nickname, token, now);
  const id = Number(info.lastInsertRowid);
  for (const t of RATING_TRACKS) stmtInsertRating.run(id, t, DEFAULT_RATING, DEFAULT_RD, DEFAULT_VOL);
  return { id, nickname, token, created_at: now };
});

const stmtUserByToken = db.prepare('SELECT * FROM users WHERE token = ?');
const stmtUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtUserByNick = db.prepare('SELECT * FROM users WHERE nickname = ?');

export const getUserByToken = (token: string) => stmtUserByToken.get(token) as User | undefined;
export const getUserById = (id: number) => stmtUserById.get(id) as User | undefined;
export const getUserByNickname = (nick: string) => stmtUserByNick.get(nick) as User | undefined;

// ---------- ratings ----------

export interface RatingRow {
  user_id: number;
  track: RatingTrack;
  rating: number;
  rd: number;
  vol: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

const stmtRatings = db.prepare('SELECT * FROM ratings WHERE user_id = ?');
const stmtRating = db.prepare('SELECT * FROM ratings WHERE user_id = ? AND track = ?');

export function getRatings(userId: number): Record<RatingTrack, RatingRow> {
  const rows = stmtRatings.all(userId) as RatingRow[];
  const out = {} as Record<RatingTrack, RatingRow>;
  for (const t of RATING_TRACKS) {
    out[t] = rows.find((r) => r.track === t) ?? {
      user_id: userId, track: t, rating: DEFAULT_RATING, rd: DEFAULT_RD, vol: DEFAULT_VOL,
      wins: 0, losses: 0, draws: 0, games: 0,
    };
  }
  return out;
}

export function getRating(userId: number, track: RatingTrack): RatingRow {
  const row = stmtRating.get(userId, track) as RatingRow | undefined;
  return row ?? {
    user_id: userId, track, rating: DEFAULT_RATING, rd: DEFAULT_RD, vol: DEFAULT_VOL,
    wins: 0, losses: 0, draws: 0, games: 0,
  };
}

const stmtUpsertRating = db.prepare(`
  INSERT INTO ratings (user_id, track, rating, rd, vol, wins, losses, draws, games)
  VALUES (@user_id, @track, @rating, @rd, @vol, @wins, @losses, @draws, @games)
  ON CONFLICT(user_id, track) DO UPDATE SET
    rating = excluded.rating, rd = excluded.rd, vol = excluded.vol,
    wins = excluded.wins, losses = excluded.losses, draws = excluded.draws, games = excluded.games
`);

export function saveRating(row: RatingRow) {
  stmtUpsertRating.run(row);
}

// ---------- leaderboard ----------

export interface LeaderboardRow {
  user_id: number;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

const stmtTop = db.prepare(`
  SELECT r.user_id, u.nickname, r.rating, r.wins, r.losses, r.draws, r.games
  FROM ratings r JOIN users u ON u.id = r.user_id
  WHERE r.track = ? AND r.games > 0
  ORDER BY r.rating DESC, r.games DESC, u.id ASC
  LIMIT ?
`);
const stmtRank = db.prepare(`
  SELECT COUNT(*) + 1 AS rank FROM ratings
  WHERE track = ? AND games > 0 AND rating > ?
`);

export function getLeaderboard(track: RatingTrack, limit = 100): LeaderboardRow[] {
  return stmtTop.all(track, limit) as LeaderboardRow[];
}

export function getRank(track: RatingTrack, rating: number): number {
  return (stmtRank.get(track, rating) as { rank: number }).rank;
}

// ---------- duels ----------

export interface DuelPlayerRecord {
  slot: 0 | 1;
  userId: number | null;
  kind: 'human' | 'ghost' | 'bot';
  name: string;
  result: 'W' | 'L' | 'D';
  roundsWon: number;
  totalScore: number;
  ratingBefore: number;
  ratingAfter: number;
  changes: Record<string, { before: number; after: number }>;
}

const stmtInsertDuel = db.prepare('INSERT INTO duels (created_at, domains, rounds, forfeit) VALUES (?, ?, ?, ?)');
const stmtInsertDuelPlayer = db.prepare(`
  INSERT INTO duel_players (duel_id, slot, user_id, kind, name, result, rounds_won, total_score, rating_before, rating_after, changes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export const saveDuel = db.transaction(
  (domains: DomainId[], rounds: { domain: DomainId; scores: [number, number] }[], forfeit: boolean, players: DuelPlayerRecord[]) => {
    const info = stmtInsertDuel.run(Date.now(), JSON.stringify(domains), JSON.stringify(rounds), forfeit ? 1 : 0);
    const duelId = Number(info.lastInsertRowid);
    for (const p of players) {
      stmtInsertDuelPlayer.run(
        duelId, p.slot, p.userId, p.kind, p.name, p.result, p.roundsWon, p.totalScore,
        p.ratingBefore, p.ratingAfter, JSON.stringify(p.changes),
      );
    }
    return duelId;
  },
);

const stmtRecentDuels = db.prepare(`
  SELECT d.id, d.created_at, d.domains, d.rounds, d.forfeit,
         me.slot AS my_slot, me.result, me.rounds_won, me.total_score, me.rating_before, me.rating_after, me.changes,
         op.name AS opp_name, op.kind AS opp_kind, op.rounds_won AS opp_rounds_won, op.total_score AS opp_total_score
  FROM duel_players me
  JOIN duels d ON d.id = me.duel_id
  JOIN duel_players op ON op.duel_id = me.duel_id AND op.slot <> me.slot
  WHERE me.user_id = ?
  ORDER BY d.id DESC
  LIMIT ?
`);

export function getRecentDuels(userId: number, limit = 10) {
  const rows = stmtRecentDuels.all(userId, limit) as any[];
  return rows.map((r) => ({
    id: r.id as number,
    createdAt: r.created_at as number,
    domains: JSON.parse(r.domains) as DomainId[],
    rounds: (JSON.parse(r.rounds) as { domain: DomainId; scores: [number, number] }[]).map((x) => ({
      domain: x.domain,
      mine: x.scores[r.my_slot],
      theirs: x.scores[1 - r.my_slot],
    })),
    forfeit: !!r.forfeit,
    result: r.result as 'W' | 'L' | 'D',
    roundsWon: r.rounds_won as number,
    oppRoundsWon: r.opp_rounds_won as number,
    totalScore: r.total_score as number,
    oppTotalScore: r.opp_total_score as number,
    ratingBefore: r.rating_before as number,
    ratingAfter: r.rating_after as number,
    opponent: r.opp_name as string,
    opponentAsync: r.opp_kind !== 'human',
  }));
}

// ---------- round recordings ----------

export interface RecordingRow {
  id: number;
  user_id: number;
  domain: DomainId;
  content_key: string;
  content: string;
  events: string;
  score: number;
  duration_ms: number;
  rating: number;
  rd: number;
  general_rating: number;
  general_rd: number;
  created_at: number;
}

const stmtInsertRecording = db.prepare(`
  INSERT INTO round_recordings (user_id, domain, content_key, content, events, score, duration_ms, rating, rd, general_rating, general_rd, created_at, content_version)
  VALUES (@user_id, @domain, @content_key, @content, @events, @score, @duration_ms, @rating, @rd, @general_rating, @general_rd, @created_at, ${CONTENT_VERSION})
`);

export function saveRecording(r: Omit<RecordingRow, 'id'>) {
  stmtInsertRecording.run(r);
}

/** Ghost candidates: other users with current-version recordings (the caller sorts them by rating). */
const stmtGhostCandidates = db.prepare(`
  SELECT rr.user_id, u.nickname, MAX(rr.id) AS last_id
  FROM round_recordings rr JOIN users u ON u.id = rr.user_id
  WHERE rr.user_id <> ? AND rr.content_version = ${CONTENT_VERSION}
  GROUP BY rr.user_id
`);

export function getGhostCandidates(excludeUserId: number) {
  return stmtGhostCandidates.all(excludeUserId) as { user_id: number; nickname: string; last_id: number }[];
}

const stmtRecordingById = db.prepare('SELECT * FROM round_recordings WHERE id = ?');
export const getRecordingById = (id: number) => stmtRecordingById.get(id) as RecordingRow | undefined;

/** Recordings of `ghostUserId` in `domain` whose content `viewerId` has not already played. */
const stmtGhostRecordings = db.prepare(`
  SELECT * FROM round_recordings
  WHERE user_id = ? AND domain = ? AND content_version = ${CONTENT_VERSION}
    AND content_key NOT IN (SELECT content_key FROM round_recordings WHERE user_id = ?)
  ORDER BY id DESC
  LIMIT 20
`);

export function getGhostRecordings(ghostUserId: number, domain: DomainId, viewerId: number) {
  return stmtGhostRecordings.all(ghostUserId, domain, viewerId) as RecordingRow[];
}
