import { beforeAll, describe, expect, it } from 'vitest';

// In-memory database: must be set before db.ts is imported.
process.env.DB_PATH = ':memory:';
let auth: typeof import('../src/auth');
let dbm: typeof import('../src/db');

beforeAll(async () => {
  dbm = await import('../src/db');
  auth = await import('../src/auth');
});

describe('guests and accounts', () => {
  it('creates guests with a Guest-#### nickname and their own token', () => {
    const a = auth.createGuest();
    const b = auth.createGuest();
    expect(a.nickname).toMatch(/^Guest-\d+$/);
    expect(a.is_guest).toBe(1);
    expect(a.token).not.toBe(b.token);
    expect(auth.authenticate(a.token)?.id).toBe(a.id);
  });

  it('registering as a guest upgrades the same account (keeps id, token and rating)', () => {
    const g = auth.createGuest();
    dbm.saveRating({ ...dbm.getRating(g.id, 'general'), rating: 1662, games: 1, wins: 1 });
    const r = auth.register('Razvan_1', 'secret123', g);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.upgraded).toBe(true);
    expect(r.user.id).toBe(g.id);
    expect(r.user.token).toBe(g.token);
    const u = dbm.getUserById(g.id)!;
    expect(u.is_guest).toBe(0);
    expect(u.nickname).toBe('Razvan_1');
    expect(dbm.getRating(g.id, 'general').rating).toBe(1662);
  });

  it('logs in with the right password only, and never stores the password itself', () => {
    expect(auth.login('Razvan_1', 'secret123').ok).toBe(true);
    expect(auth.login('razvan_1', 'secret123').ok).toBe(true); // nicknames are case-insensitive
    expect(auth.login('Razvan_1', 'nope')).toEqual({ ok: false, error: 'bad_credentials' });
    expect(auth.login('nobody', 'secret123')).toEqual({ ok: false, error: 'bad_credentials' });
    expect(dbm.getUserByNickname('Razvan_1')!.pass_hash).not.toContain('secret123');
  });

  it('rejects taken, reserved and badly formed names and short passwords', () => {
    expect(auth.register('Razvan_1', 'secret123')).toEqual({ ok: false, error: 'taken' });
    expect(auth.register('Guest-42', 'secret123')).toEqual({ ok: false, error: 'reserved' });
    expect(auth.register('ab', 'secret123')).toEqual({ ok: false, error: 'too_short' });
    expect(auth.register('has space', 'secret123')).toEqual({ ok: false, error: 'invalid_chars' });
    expect(auth.register('NewPlayer', '123')).toEqual({ ok: false, error: 'weak_password' });
  });

  it('a registered player registering again creates a separate new account', () => {
    const me = dbm.getUserByNickname('Razvan_1')!;
    const r = auth.register('SecondAcc', 'secret123', me);
    expect(r.ok && r.upgraded).toBe(false);
    expect(r.ok && r.user.id).not.toBe(me.id);
  });

  it('keeps guests off the leaderboard', () => {
    const g = auth.createGuest();
    dbm.saveRating({ ...dbm.getRating(g.id, 'general'), rating: 2500, games: 3, wins: 3 });
    const top = dbm.getLeaderboard('general', 100);
    expect(top.some((r) => r.user_id === g.id)).toBe(false);
    expect(top[0].nickname).toBe('Razvan_1');
    expect(dbm.getRank('general', 1662)).toBe(1);
  });
});
