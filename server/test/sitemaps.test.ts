import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mountSeo } from '../src/seo';
import { hasPack } from '../src/seo-pack';
import { flagRegionPage, mountQuizPages, quizPaths } from '../src/seo-quiz';
import { FLAG_REGIONS } from '../src/seo-quiz-content';
import { flagImagesIn, mountSitemaps } from '../src/sitemaps';

process.env.PUBLIC_URL = 'https://1v1game.net';

let base = '';
let server: import('node:http').Server;
beforeAll(async () => {
  const app = express();
  mountQuizPages(app);
  mountSeo(app, quizPaths);
  mountSitemaps(app, {
    base: () => 'https://1v1game.net',
    lastmod: '2026-11-27',
    serverPages: () => FLAG_REGIONS.map((r) => ({ path: `/flag-quiz/${r.id}`, html: flagRegionPage(r.id) })),
  });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

const get = async (p: string) => {
  const r = await fetch(base + p);
  return { status: r.status, type: r.headers.get('content-type') ?? '', text: await r.text() };
};

describe('sitemaps', () => {
  it('reads flag images and their alt text once each', () => {
    const html = '<img src="/flags/ro.svg" alt="Flag of Romania"><img class="x" src="/flags/ro.svg" alt="dup"><img src="/og.png" alt="x"><img alt="Flag of C&amp;te" src="/flags/fr.svg">';
    expect(flagImagesIn(html)).toEqual([
      { src: '/flags/ro.svg', title: 'Flag of Romania' },
      { src: '/flags/fr.svg', title: 'Flag of C&te' },
    ]);
  });

  it('serves an image sitemap with every flag on the flag quiz pages', async () => {
    const r = await get('/sitemap-images.xml');
    expect(r.status).toBe(200);
    expect(r.type).toContain('xml');
    expect(r.text).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(r.text).toContain('<loc>https://1v1game.net/flag-quiz/europe</loc>');
    expect(r.text).toContain('<image:loc>https://1v1game.net/flags/ro.svg</image:loc>');
    // Each page lists 1000 images at most (the sitemap protocol limit).
    for (const block of r.text.split('<url>').slice(1)) expect((block.match(/<image:image>/g) ?? []).length).toBeLessThanOrEqual(1000);
    if (hasPack()) expect(r.text).not.toMatch(/<loc>https:\/\/1v1game\.net\/(es|pt|fr|de|it|ro|pl|tr)\//);
  });

  it('serves a sitemap index and robots.txt lists every sitemap', async () => {
    const idx = await get('/sitemap_index.xml');
    expect(idx.text).toContain('<sitemapindex');
    expect(idx.text).toContain('<loc>https://1v1game.net/sitemap.xml</loc>');
    expect(idx.text).toContain('<loc>https://1v1game.net/sitemap-images.xml</loc>');
    const robots = (await get('/robots.txt')).text;
    for (const n of ['sitemap_index.xml', 'sitemap.xml', 'sitemap-images.xml']) expect(robots).toContain(`Sitemap: https://1v1game.net/${n}`);
  });
});
