import express from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadQuestions, practiceQuestions, rankedQuestions, TRIVIA_CATEGORIES, triviaMode } from '../src/modes/trivia';
import { createRng } from '../src/rng';
import { mountSeo, sitePaths } from '../src/seo';
import { mountQuizPages, quizPaths } from '../src/seo-quiz';

process.env.PUBLIC_URL = 'https://1v1game.net';

let base = '';
let server: import('node:http').Server;
beforeAll(async () => {
  const app = express();
  mountQuizPages(app);
  mountSeo(app, quizPaths);
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

const get = async (p: string) => {
  const r = await fetch(base + p);
  return { status: r.status, html: await r.text() };
};
const meta = (html: string, re: RegExp) => (html.match(re) ?? [])[1] ?? '';
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

describe('practice vs ranked questions', () => {
  it('splits ~25% into a public practice set, with plenty left for ranked play', () => {
    const all = loadQuestions();
    const practice = practiceQuestions();
    expect(practice.length + rankedQuestions().length).toBe(all.length);
    expect(practice.length / all.length).toBeGreaterThan(0.18);
    expect(practice.length / all.length).toBeLessThan(0.32);
    for (const c of TRIVIA_CATEGORIES) {
      expect(practiceQuestions(c).length, c).toBeGreaterThanOrEqual(15);
      expect(rankedQuestions().filter((q) => q.cat === c).length, c).toBeGreaterThanOrEqual(60);
    }
  });
  it('never asks a published practice question in a ranked round', () => {
    const practiceIds = new Set(practiceQuestions().map((q) => q.id));
    for (let s = 0; s < 300; s++) {
      for (const it of triviaMode.generateRound(createRng(s)).items) expect(practiceIds.has(it.qid)).toBe(false);
    }
  });
});

describe('SEO pages', () => {
  const pages = sitePaths(quizPaths()).map((p) => p.path).filter((p) => p !== '/'); // "/" is the app (tested live)

  it('every page renders with a unique title, a good description, one h1 and a canonical URL', async () => {
    const titles = new Set<string>();
    for (const p of pages) {
      const { status, html } = await get(p);
      expect(status, p).toBe(200);
      const title = decode(meta(html, /<title>([^<]+)<\/title>/));
      const desc = decode(meta(html, /<meta name="description" content="([^"]+)"/));
      expect(title.length, `${p} title "${title}"`).toBeGreaterThan(20);
      expect(title.length, `${p} title "${title}"`).toBeLessThanOrEqual(70);
      expect(desc.length, `${p} description`).toBeGreaterThan(70);
      expect(desc.length, `${p} description "${desc}"`).toBeLessThanOrEqual(165);
      expect((html.match(/<h1>/g) ?? []).length, p).toBe(1);
      expect(meta(html, /<link rel="canonical" href="([^"]+)"/), p).toBe(`https://1v1game.net${p}`);
      expect(titles.has(title), `duplicate title ${title}`).toBe(false);
      titles.add(title);
    }
  });

  it('quiz pages publish only practice questions, with valid Quiz structured data', async () => {
    const practice = new Set(practiceQuestions().map((q) => q.q));
    const ranked = new Set(rankedQuestions().map((q) => q.q));
    for (const p of quizPaths().filter((x) => x.startsWith('/quiz/'))) {
      const { html } = await get(p);
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      const quiz = blocks.flat().find((b) => b['@type'] === 'Quiz');
      expect(quiz, p).toBeTruthy();
      expect(quiz.hasPart.length, p).toBeGreaterThanOrEqual(15);
      for (const q of quiz.hasPart) {
        expect(practice.has(q.text), `${p}: ${q.text}`).toBe(true);
        expect(ranked.has(q.text)).toBe(false);
        expect(q.acceptedAnswer.text).toBeTruthy();
      }
      expect((html.match(/<li><h3>/g) ?? []).length, p).toBe(quiz.hasPart.length);
    }
  });

  it('flag pages list every country of their continent', async () => {
    const { html } = await get('/flag-quiz/europe');
    expect(html).toContain('Flags of Europe');
    expect(html).toContain('aria-label="Flag of Romania"');
    expect((await get('/flag-quiz/atlantis')).status).toBe(404);
    expect((await get('/quiz/not-a-topic')).status).toBe(404);
  });

  it('sitemap lists every page exactly once, robots points to it, IndexNow key is served', async () => {
    const { html: sm } = await get('/sitemap.xml');
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
    for (const p of [...quizPaths(), '/trivia', '/flag-quiz', '/privacy', '/']) expect(locs, p).toContain(`https://1v1game.net${p}`);
    expect((await get('/robots.txt')).html).toContain('Sitemap: https://1v1game.net/sitemap.xml');
    const { INDEXNOW_KEY } = await import('../src/seo');
    expect((await get(`/${INDEXNOW_KEY}.txt`)).html).toBe(INDEXNOW_KEY);
  });
});
