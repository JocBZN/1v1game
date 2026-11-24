import crypto from 'node:crypto';
import { createUser, getUserByNickname, getUserByToken, upgradeUser, type User } from './db';

export const NICK_MIN = 3;
export const NICK_MAX = 16;
export const PASS_MIN = 6;
export const PASS_MAX = 128;
// Letters (incl. diacritics), digits, underscore, dash, dot.
const NICK_RE = /^[\p{L}\p{N}_.-]+$/u;

export type AuthError =
  | 'too_short' | 'too_long' | 'invalid_chars' | 'taken' | 'reserved'
  | 'weak_password' | 'bad_credentials' | 'already_registered';

export function validateNickname(raw: unknown): { ok: true; nickname: string } | { ok: false; error: AuthError } {
  const nickname = typeof raw === 'string' ? raw.trim() : '';
  if (nickname.length < NICK_MIN) return { ok: false, error: 'too_short' };
  if (nickname.length > NICK_MAX) return { ok: false, error: 'too_long' };
  if (!NICK_RE.test(nickname)) return { ok: false, error: 'invalid_chars' };
  if (/^guest/i.test(nickname)) return { ok: false, error: 'reserved' };
  return { ok: true, nickname };
}

// ---------- passwords (scrypt, built into Node) ----------

const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [algo, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(actual, expected);
}

function validPassword(raw: unknown): raw is string {
  return typeof raw === 'string' && raw.length >= PASS_MIN && raw.length <= PASS_MAX;
}

const newToken = () => crypto.randomBytes(24).toString('base64url');

// ---------- accounts ----------

/** A throwaway guest account so anyone can play instantly. */
export function createGuest(): User {
  for (let i = 0; i < 20; i++) {
    const nickname = `Guest-${crypto.randomInt(1000, 100000)}`;
    if (getUserByNickname(nickname)) continue;
    try {
      return createUser(nickname, newToken(), { guest: true });
    } catch (e: any) {
      if (!String(e?.code).startsWith('SQLITE_CONSTRAINT')) throw e;
    }
  }
  throw new Error('could not allocate a guest nickname');
}

/**
 * Create an account. If the caller is a guest (or an old nickname-only account), that same account is
 * upgraded, so the rating and duel history earned so far are kept.
 */
export function register(
  rawNick: unknown,
  rawPass: unknown,
  current?: User,
): { ok: true; user: User; upgraded: boolean } | { ok: false; error: AuthError } {
  const v = validateNickname(rawNick);
  if (!v.ok) return v;
  if (!validPassword(rawPass)) return { ok: false, error: 'weak_password' };
  const existing = getUserByNickname(v.nickname);
  const upgradable = current && (current.is_guest || !current.pass_hash);
  if (existing && existing.id !== (upgradable ? current!.id : -1)) return { ok: false, error: 'taken' };
  const passHash = hashPassword(rawPass);
  try {
    if (upgradable) {
      upgradeUser(current!.id, v.nickname, passHash);
      return { ok: true, upgraded: true, user: { ...current!, nickname: v.nickname, pass_hash: passHash, is_guest: 0 } };
    }
    return { ok: true, upgraded: false, user: createUser(v.nickname, newToken(), { passHash }) };
  } catch (e: any) {
    if (String(e?.code).startsWith('SQLITE_CONSTRAINT')) return { ok: false, error: 'taken' };
    throw e;
  }
}

export function login(rawNick: unknown, rawPass: unknown): { ok: true; user: User } | { ok: false; error: AuthError } {
  const nickname = typeof rawNick === 'string' ? rawNick.trim() : '';
  const user = nickname ? getUserByNickname(nickname) : undefined;
  // Always run scrypt, so response time doesn't reveal whether the nickname exists.
  const ok = verifyPassword(typeof rawPass === 'string' ? rawPass : '', user?.pass_hash ?? hashPassword('x'));
  if (!user || !user.pass_hash || !ok) return { ok: false, error: 'bad_credentials' };
  return { ok: true, user };
}

export function authenticate(token: unknown): User | undefined {
  if (typeof token !== 'string' || token.length < 10) return undefined;
  return getUserByToken(token);
}
