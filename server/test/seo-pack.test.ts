// The generated multilingual pages (seo/public, built by `npm run build:seo`) served by the game server.
import express from 'express';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mountSecurity } from '../src/security';
import { mountSeo } from '../src/seo';
import { hasPack, mountSeoPack, PACK_PUBLIC } from '../src/seo-pack';
import { mountQuizPages, quizPaths } from '../src/seo-quiz';

process.env.PUBLIC_URL = 'https://1v1game.net';

let base = '';
let server: import('node:http').Server;
beforeAll(async () => {
  const app = express();
  mountSecurity(app);
  mountSeoPack(app);
  mountQuizPages(app);
  mountSeo(app, quizPaths);
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

const get = (p: string) => fetch(base + p, { redirect: 'manual' });

describe.skipIf(!hasPack())('SEO pack', () => {
  it('sends the removed language pages (/es/, /ro/ …) to the home page', async () => {
    for (const p of ['/es', '/es/', '/ro/quiz/', '/de/quiz/geographie/', '/tr']) {
      const r = await get(p);
      expect(r.status, p).toBe(301);
      expect(r.headers.get('location'), p).toBe('/');
    }
  });

  it('leaves the game server’s own /quiz and /flag-quiz pages alone', async () => {
    for (const p of ['/quiz', '/flag-quiz', '/flag-quiz/europe']) {
      const r = await get(p);
      expect(r.status, p).toBe(200);
      expect(await r.text(), p).toContain(`<link rel="canonical" href="https://1v1game.net${p}">`);
    }
  });

  it('allows exactly the inline scripts of a generated page in its CSP', async () => {
    const r = await get('/quiz-of-the-day/');
    expect(r.status).toBe(200);
    const csp = r.headers.get('content-security-policy') ?? '';
    expect(csp).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(r.headers.get('x-frame-options')).toBe('DENY');
  });

  it('lets other sites frame only the /embed/ widget', async () => {
    const r = await get('/embed/en.html');
    expect(r.status).toBe(200);
    expect(r.headers.get('x-frame-options')).toBeNull();
    expect(r.headers.get('content-security-policy')).toContain('frame-ancestors *');
  });

  it('declares no translations any more, only the English page itself', async () => {
    const html = await (await get('/quiz/geography')).text();
    expect(html).not.toContain('hreflang="es"');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://1v1game.net/quiz/geography">');
  });

  it('robots.txt lets crawlers create the guest session and lists both sitemaps', async () => {
    const txt = await (await get('/robots.txt')).text();
    expect(txt.indexOf('Allow: /api/guest')).toBeLessThan(txt.indexOf('Disallow: /api/'));
    expect(txt).toContain('Sitemap: https://1v1game.net/sitemap-i18n.xml');
    expect((await get('/sitemap-i18n.xml')).status).toBe(200);
    expect(fs.existsSync(`${PACK_PUBLIC}/flags/ro.svg`)).toBe(true);
  });
});
