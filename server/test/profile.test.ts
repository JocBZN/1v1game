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

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c90000000049454e44ae426082', 'hex');

function account(nick: string) {
  const g = auth.createGuest();
  const r = auth.register(nick, 'secret123', g);
  if (!r.ok) throw new Error(r.error);
  return r.user;
}
const call = (path: string, token: string, init: RequestInit = {}) =>
  fetch(base + path, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });

describe('profile photo', () => {
  it('uploads, serves with long caching, shows up in /me, and can be removed', async () => {
    const u = account('PhotoUser');
    const up = await call('/avatar', u.token, { method: 'POST', body: PNG, headers: { 'Content-Type': 'image/png' } });
    expect(up.status).toBe(200);
    const { avatar } = (await up.json()) as { avatar: string };
    expect(avatar).toMatch(new RegExp(`^/api/avatar/${u.id}\\?v=\\d+$`));

    const img = await fetch(base + avatar.slice(4));
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/png');
    expect(img.headers.get('cache-control')).toContain('immutable');
    expect(img.headers.get('x-content-type-options')).toBe('nosniff');
    expect(Buffer.from(await img.arrayBuffer()).equals(PNG)).toBe(true);

    const me = (await (await call("/me", u.token)).json()) as any;
    expect(me.user.avatar).toBe(avatar);

    expect((await call('/avatar', u.token, { method: 'DELETE' })).status).toBe(200);
    expect(((await (await call("/me", u.token)).json()) as any).user.avatar).toBeNull();
    expect((await fetch(`${base}/avatar/${u.id}`)).status).toBe(404);
  });

  it('rejects files that are not images, whatever they claim to be, and guests', async () => {
    const u = account('PhotoUser2');
    const fake = await call('/avatar', u.token, { method: 'POST', body: Buffer.from('<svg onload=alert(1)>'), headers: { 'Content-Type': 'image/png' } });
    expect(fake.status).toBe(400);
    const g = auth.createGuest();
    const guest = await call('/avatar', g.token, { method: 'POST', body: PNG, headers: { 'Content-Type': 'image/png' } });
    expect(guest.status).toBe(403);
    expect((await fetch(base + '/avatar', { method: 'POST', body: PNG, headers: { 'Content-Type': 'image/png' } })).status).toBe(401);
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
