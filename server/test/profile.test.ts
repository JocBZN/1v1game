import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// In-memory database: must be set before db.ts is imported.
process.env.DB_PATH = ':memory:';
let auth: typeof import('../src/auth');
let base = '';
let server: import('node:http').Server;

beforeAll(async () => {
  auth = await import('../src/auth');
  const { createApi } = await import('../src/api');
  const app = express();
  app.use('/api', createApi());
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => server.close());

function account(nick: string) {
  const g = auth.createGuest();
  const r = auth.register(nick, 'secret123', g);
  if (!r.ok) throw new Error(r.error);
  return r.user;
}
const call = (path: string, token: string, init: RequestInit = {}) =>
  fetch(base + path, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });

describe('profile icons', () => {
  const post = (path: string, token: string) => call(path, token, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });

  it('there are 50 icons with unique ids, 8 of them free', async () => {
    const { PROFILE_ICONS } = await import('../src/icons');
    expect(PROFILE_ICONS).toHaveLength(50);
    expect(new Set(PROFILE_ICONS.map((i) => i.id)).size).toBe(50);
    expect(PROFILE_ICONS.filter((i) => i.price === 0)).toHaveLength(8);
  });

  it('free icons can be used right away and show in /me', async () => {
    const u = account('IconUser');
    const st = (await (await call('/icons', u.token)).json()) as any;
    expect(st.coins).toBe(0);
    expect(st.owned).toContain('smile');
    expect(st.owned).not.toContain('crown');
    expect((await post('/icons/star/select', u.token)).status).toBe(200);
    expect(((await (await call('/me', u.token)).json()) as any).user.avatar).toBe('star');
    expect((await call('/icons/selected', u.token, { method: 'DELETE' })).status).toBe(200);
    expect(((await (await call('/me', u.token)).json()) as any).user.avatar).toBeNull();
  });

  it('paid icons need coins; buying spends them once and unlocks the icon', async () => {
    const dbm = await import('../src/db');
    const u = account('IconBuyer');
    expect((await post('/icons/crown/select', u.token)).status).toBe(402);
    const poor = await post('/icons/crown/buy', u.token);
    expect(poor.status).toBe(402);
    expect(((await poor.json()) as any).error).toBe('not_enough_coins');

    dbm.addCoins(u.id, 1000);
    const bought = (await (await post('/icons/crown/buy', u.token)).json()) as any;
    expect(bought.coins).toBe(250);
    expect(bought.owned).toContain('crown');
    const again = (await (await post('/icons/crown/buy', u.token)).json()) as any;
    expect(again.coins).toBe(250); // no double charge
    expect((await post('/icons/crown/select', u.token)).status).toBe(200);
    expect(((await (await call('/me', u.token)).json()) as any).user.avatar).toBe('crown');
  });

  it('unknown icons and guests are refused', async () => {
    const u = account('IconUser3');
    expect((await post('/icons/nope/select', u.token)).status).toBe(404);
    const g = auth.createGuest();
    expect((await post('/icons/smile/select', g.token)).status).toBe(403);
    expect((await fetch(base + '/icons')).status).toBe(401);
  });
});

describe('change password', () => {
  it('needs the current password, then signs other devices out', async () => {
    const u = account('PassUser');
    const post = (body: object, token = u.token) =>
      call('/password', token, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

    expect((await post({ current: 'wrong', next: 'newpass1' })).status).toBe(401);
    expect(await (await post({ current: 'secret123', next: '123' })).json()).toEqual({ error: 'weak_password' });
    expect(await (await post({ current: 'secret123', next: 'secret123' })).json()).toEqual({ error: 'same_password' });

    const ok = await post({ current: 'secret123', next: 'newpass1' });
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as any;
    expect(body.token).not.toBe(u.token);
    expect(body.user.nickname).toBe('PassUser');

    expect((await call('/me', u.token)).status).toBe(401); // old session is gone
    expect((await call('/me', body.token)).status).toBe(200);
    expect(auth.login('PassUser', 'secret123').ok).toBe(false);
    expect(auth.login('PassUser', 'newpass1').ok).toBe(true);
  });

  it('guests have no password to change', async () => {
    const g = auth.createGuest();
    const r = await call('/password', g.token, { method: 'POST', body: JSON.stringify({ current: 'x', next: 'newpass1' }), headers: { 'Content-Type': 'application/json' } });
    expect(await r.json()).toEqual({ error: 'not_registered' });
  });
});
