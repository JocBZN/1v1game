import crypto from 'node:crypto';
import { createUser, getUserByNickname, getUserByToken, type User } from './db';

export const NICK_MIN = 3;
export const NICK_MAX = 16;
// Letters (incl. Romanian diacritics), digits, underscore, dash, dot.
const NICK_RE = /^[\p{L}\p{N}_.-]+$/u;

export type NicknameError = 'too_short' | 'too_long' | 'invalid_chars' | 'taken';

export function validateNickname(raw: unknown): { ok: true; nickname: string } | { ok: false; error: NicknameError } {
  const nickname = typeof raw === 'string' ? raw.trim() : '';
  if (nickname.length < NICK_MIN) return { ok: false, error: 'too_short' };
  if (nickname.length > NICK_MAX) return { ok: false, error: 'too_long' };
  if (!NICK_RE.test(nickname)) return { ok: false, error: 'invalid_chars' };
  return { ok: true, nickname };
}

export function register(raw: unknown): { ok: true; user: User } | { ok: false; error: NicknameError } {
  const v = validateNickname(raw);
  if (!v.ok) return v;
  if (getUserByNickname(v.nickname)) return { ok: false, error: 'taken' };
  const token = crypto.randomBytes(24).toString('base64url');
  try {
    return { ok: true, user: createUser(v.nickname, token) };
  } catch (e: any) {
    if (String(e?.code).startsWith('SQLITE_CONSTRAINT')) return { ok: false, error: 'taken' };
    throw e;
  }
}

export function authenticate(token: unknown): User | undefined {
  if (typeof token !== 'string' || token.length < 10) return undefined;
  return getUserByToken(token);
}
