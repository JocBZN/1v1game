/**
 * Programmatic SEO: crawlable quiz pages built from the public practice questions.
 *   /quiz                      hub (all quizzes)
 *   /quiz/general-knowledge    mixed questions from every category
 *   /quiz/<topic>              one page per trivia category (questions, options, answers, FAQ)
 *   /flag-quiz/<continent>     all flags of a continent with names
 * Every page has Quiz/FAQ/Breadcrumb structured data and links to its neighbours.
 */
import crypto from 'node:crypto';
import type express from 'express';
import { loadCountries } from './modes/flags';
import { practiceQuestions, TRIVIA_CATEGORIES, type Question } from './modes/trivia';
import { publicUrl, shell } from './seo';
import { FLAG_REGIONS, GENERAL_KNOWLEDGE, QUIZ_HUB, QUIZ_PAGES } from './seo-quiz-content';
import { hasPack } from './seo-pack';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DIFF = ['', 'Easy', 'Medium', 'Hard'];

/** Stable pseudo-random order (same every deploy, so pages don't "change" for crawlers). */
function stableSort<T>(items: T[], key: (t: T) => string): T[] {
  const h = (s: string) => crypto.createHash('sha1').update(s).digest('hex');
  return [...items].sort((a, b) => (h(key(a)) < h(key(b)) ? -1 : 1));
}

function options(q: Question): string[] {
  return stableSort([q.correct, ...q.wrong], (o) => q.id + o);
}

function questionsHtml(qs: Question[]): string {
  return `<ol class="qs">${qs
    .map((q) => {
      const opts = options(q);
      const letter = String.fromCharCode(65 + opts.indexOf(q.correct));
      return `<li><h3>${esc(q.q)}<span class="diff">${DIFF[q.difficulty]}</span></h3><ol class="opts">${opts
        .map((o) => `<li>${esc(o)}</li>`)
        .join('')}</ol><details><summary>Show answer</summary><p>Answer: <span class="ans">${letter}. ${esc(q.correct)}</span></p></details></li>`;
    })
    .join('')}</ol>`;
}

function quizLd(name: string, path: string, qs: Question[], about: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name,
    url: `${publicUrl()}${path}`,
    about: { '@type': 'Thing', name: about },
    educationalAlignment: { '@type': 'AlignmentObject', alignmentType: 'educationalSubject', targetName: about },
    educationalLevel: 'beginner to advanced',
    inLanguage: 'en',
    isAccessibleForFree: true,
    hasPart: qs.map((q) => ({
      '@type': 'Question',
      eduQuestionType: 'Multiple choice',
      text: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.correct },
      suggestedAnswer: q.wrong.map((w) => ({ '@type': 'Answer', text: w })),
    })),
  };
}

const faqLd = (faq: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const crumbsLd = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${publicUrl()}${path}` })),
});

const crumbsHtml = (items: [string, string][]) =>
  `<div class="crumbs">${items.map(([n, p], i) => (i === items.length - 1 ? esc(n) : `<a href="${p}">${esc(n)}</a> › `)).join('')}</div>`;

const faqHtml = (faq: [string, string][]) =>
  `<h2>FAQ</h2><div class="card">${faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

const relatedHref = (slug: string) => (slug === 'flags' ? '/flag-quiz' : `/quiz/${slug}`);
const relatedName = (slug: string) =>
  slug === 'flags' ? 'Flag quiz' : slug === GENERAL_KNOWLEDGE.slug ? 'General knowledge quiz' : `${QUIZ_PAGES.find((p) => p.slug === slug)?.name ?? slug} quiz`;

const playCta = (what: string) =>
  `<p><a class="cta" href="/">Play ${esc(what)} 1v1 — free</a></p><p>Duel finds you an opponent in seconds. Three rounds on random topics; win two to win the duel and climb from Bronze to Legend.</p>`;

// ---------------------------------------------------------------- pages

function categoryPage(slug: string): { html: string } | null {
  const copy = QUIZ_PAGES.find((p) => p.slug === slug);
  if (!copy) return null;
  const qs = stableSort(practiceQuestions(copy.cat), (q) => q.id);
  const n = qs.length;
  const path = `/quiz/${slug}`;
  const crumbs: [string, string][] = [['Home', '/'], ['Quizzes', '/quiz'], [`${copy.name} quiz`, path]];
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(copy.h1)}</h1>
<p class="lead">${esc(copy.intro)}</p>
${playCta(`${copy.name.toLowerCase()} trivia`)}
<h2>${n} ${esc(copy.name.toLowerCase())} quiz questions with answers</h2>
${questionsHtml(qs)}
${faqHtml(copy.faq)}
<h2>More quizzes</h2>
<nav class="topics">${copy.related.map((s) => `<a href="${relatedHref(s)}">${esc(relatedName(s))}</a>`).join('')}<a href="/quiz">All quizzes</a></nav>`;
  return {
    html: shell({
      path,
      title: copy.title.replace('{n}', String(n)),
      description: copy.description.replace('{n}', String(n)),
      bodyHtml: body,
      jsonLd: [quizLd(`${copy.name} quiz`, path, qs, copy.name), faqLd(copy.faq), crumbsLd(crumbs)],
    }),
  };
}

function generalKnowledgePage(): string {
  // Up to 5 questions from every category, interleaved so the page reads like a mixed quiz.
  const per = TRIVIA_CATEGORIES.map((c) => stableSort(practiceQuestions(c), (q) => 'gk' + q.id).slice(0, 5));
  const qs: Question[] = [];
  for (let i = 0; i < 5; i++) for (const list of per) if (list[i]) qs.push(list[i]);
  const n = qs.length;
  const path = `/quiz/${GENERAL_KNOWLEDGE.slug}`;
  const crumbs: [string, string][] = [['Home', '/'], ['Quizzes', '/quiz'], ['General knowledge quiz', path]];
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(GENERAL_KNOWLEDGE.h1)}</h1>
<p class="lead">${esc(GENERAL_KNOWLEDGE.intro)}</p>
${playCta('a trivia duel')}
<h2>${n} general knowledge questions with answers</h2>
${questionsHtml(qs)}
${faqHtml(GENERAL_KNOWLEDGE.faq)}
<h2>Quizzes by topic</h2>
<nav class="topics">${QUIZ_PAGES.map((p) => `<a href="/quiz/${p.slug}">${esc(p.name)} quiz</a>`).join('')}<a href="/flag-quiz">Flag quiz</a></nav>`;
  return shell({
    path,
    title: GENERAL_KNOWLEDGE.title.replace('{n}', String(n)),
    description: GENERAL_KNOWLEDGE.description.replace('{n}', String(n)),
    bodyHtml: body,
    brand: false,
    jsonLd: [quizLd('General knowledge quiz', path, qs, 'General knowledge'), faqLd(GENERAL_KNOWLEDGE.faq), crumbsLd(crumbs)],
  });
}

function hubPage(): string {
  const total = practiceQuestions().length;
  const cards = [
    `<a href="/quiz/${GENERAL_KNOWLEDGE.slug}">General knowledge</a>`,
    ...QUIZ_PAGES.map((p) => `<a href="/quiz/${p.slug}">${esc(p.name)} quiz <small>(${practiceQuestions(p.cat).length})</small></a>`),
    `<a href="/flag-quiz">Flag quiz</a>`,
    `<a href="/chess-puzzles">Chess puzzles</a>`,
    `<a href="/timeline-game">Timeline game</a>`,
    `<a href="/rubiks-cube">Rubik’s Cube</a>`,
    ...(hasPack()
      ? [
          `<a href="/quiz/world-capitals/">World capitals</a>`,
          `<a href="/quiz/space/">Space</a>`,
          `<a href="/quiz/music/">Music</a>`,
          `<a href="/quiz/art-literature/">Art &amp; literature</a>`,
          `<a href="/quiz-of-the-day/">Quiz of the day</a>`,
          `<a href="/general-knowledge-questions/">General knowledge Q&amp;A</a>`,
        ]
      : []),
  ];
  const crumbs: [string, string][] = [['Home', '/'], ['Quizzes', '/quiz']];
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(QUIZ_HUB.h1)}</h1>
<p class="lead">${esc(QUIZ_HUB.intro)}</p>
<a class="cta" href="/">Play a 1v1 quiz now — free</a>
<h2>Pick a quiz</h2>
<nav class="topics">${cards.join('')}</nav>
<h2>Why play quizzes on Duel?</h2>
<ul>
<li><strong>Instant opponents:</strong> a live player matched by rating, or a recorded duel of a real player when nobody is online.</li>
<li><strong>${total} free practice questions</strong> with answers on these pages, and more than 1,200 in the game.</li>
<li><strong>More than trivia:</strong> flags of 194 countries, chess puzzles, a 3D Rubik’s Cube, mini golf, a timeline game and more.</li>
<li><strong>Ranked:</strong> Glicko-2 ratings, leagues from Bronze to Legend and a global leaderboard.</li>
<li><strong>Free on any device:</strong> no download, play as a guest, install it like an app.</li>
</ul>`;
  return shell({
    path: '/quiz',
    title: QUIZ_HUB.title,
    description: QUIZ_HUB.description,
    bodyHtml: body,
    brand: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: QUIZ_HUB.h1,
        url: `${publicUrl()}/quiz`,
        hasPart: [GENERAL_KNOWLEDGE.slug, ...QUIZ_PAGES.map((p) => p.slug)].map((s) => ({ '@type': 'Quiz', url: `${publicUrl()}/quiz/${s}` })),
      },
      crumbsLd(crumbs),
    ],
  });
}

/** Flags people mix up, per continent (same groups as the multilingual pages in seo/data/extras-i18n.mjs). */
const LOOKALIKES: Record<string, string[][]> = {
  europe: [['RO', 'MD', 'AD'], ['NL', 'LU'], ['SI', 'SK', 'RU'], ['MC', 'PL'], ['IT', 'IE'], ['NO', 'IS'], ['AT', 'LV'], ['BE', 'DE']],
  asia: [['ID', 'SG'], ['QA', 'BH'], ['AE', 'KW', 'JO'], ['IQ', 'SY', 'YE'], ['BD', 'JP']],
  africa: [['ML', 'GN', 'SN'], ['CI', 'NE'], ['EG', 'SD'], ['GH', 'CM']],
  americas: [['HN', 'NI', 'SV', 'GT'], ['CO', 'EC', 'VE'], ['AR', 'UY'], ['DO', 'PA']],
  oceania: [['AU', 'NZ'], ['FJ', 'TV']],
};

function flagStudyHtml(id: string, regionName: string): string {
  const byCode = new Map(loadCountries().map((c) => [c.code, c.name]));
  const groups = (LOOKALIKES[id] ?? []).map((g) => g.filter((c) => byCode.has(c))).filter((g) => g.length > 1);
  const flag = (c: string) => `<img class="flag" src="/flags/${c.toLowerCase()}.svg" alt="Flag of ${esc(byCode.get(c)!)}" width="44" height="33" loading="lazy">`;
  return `${groups.length ? `<h2>Flags of ${esc(regionName)} that are easy to mix up</h2>
<p>Some of these flags look almost the same at first sight. Check the details: the order of the colors, the exact shade, and the emblem, star or crest.</p>
<div class="flags">${groups.map((g) => `<div style="grid-column:1/-1;flex-wrap:wrap">${g.map((c) => `${flag(c)}${esc(byCode.get(c)!)}`).join(' · ')}</div>`).join('')}</div>` : ''}
<h2>How to learn the flags faster</h2>
<ul><li>Learn the look-alike flags as groups: the small difference is what sticks.</li><li>Sort flags by layout: vertical stripes, horizontal stripes, crosses, stars and emblems.</li><li>Test yourself for a few minutes a day, then play a 1v1 flag duel: 8 flags, 6 seconds each, with wrong options from the same region.</li></ul>`;
}

export function flagRegionPage(id: string): string | null {
  const region = FLAG_REGIONS.find((r) => r.id === id);
  if (!region) return null;
  const countries = loadCountries()
    .filter((c) => c.region === id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const n = countries.length;
  const path = `/flag-quiz/${id}`;
  const name = region.name.replace(/^the /, '');
  const crumbs: [string, string][] = [['Home', '/'], ['Flag quiz', '/flag-quiz'], [`Flags of ${name}`, path]];
  const others = FLAG_REGIONS.filter((r) => r.id !== id);
  const body = `${crumbsHtml(crumbs)}
<h1>Flags of ${esc(region.name)}: all ${n} ${esc(region.adjective)} flags with names</h1>
<p class="lead">Every country flag of ${esc(region.name)} in one list, alphabetically, with its name. Study them here, then test yourself in a live flag quiz: eight flags, six seconds each, and the wrong answers always come from the same continent.</p>
<a class="cta" href="/">Play the flag quiz 1v1</a>
<h2>${n} flags of ${esc(region.name)}</h2>
<div class="flags">${countries.map((c) => `<div><img class="flag" src="/flags/${c.code.toLowerCase()}.svg" alt="Flag of ${esc(c.name)}" width="44" height="33" loading="lazy">${esc(c.name)}</div>`).join('')}</div>
${flagStudyHtml(id, name)}
<h2>Flags of other continents</h2>
<nav class="topics">${others.map((r) => `<a href="/flag-quiz/${r.id}">Flags of ${esc(r.name.replace(/^the /, ''))}</a>`).join('')}<a href="/quiz/geography">Geography quiz</a></nav>`;
  return shell({
    path,
    title: `Flags of ${name}: All ${n} ${region.adjective} Flags with Names`,
    description: `All ${n} flags of ${region.name} with country names, in one list. Learn every ${region.adjective} flag, then play a free 1v1 flag quiz in your browser.`,
    bodyHtml: body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Flags of ${region.name}`,
        numberOfItems: n,
        itemListElement: countries.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `Flag of ${c.name}` })),
      },
      crumbsLd(crumbs),
    ],
  });
}

// ---------------------------------------------------------------- routes + sitemap

/** Paths of every page this module serves (for the sitemap). */
export function quizPaths(): string[] {
  return ['/quiz', `/quiz/${GENERAL_KNOWLEDGE.slug}`, ...QUIZ_PAGES.map((p) => `/quiz/${p.slug}`), ...FLAG_REGIONS.map((r) => `/flag-quiz/${r.id}`)];
}

export function mountQuizPages(app: express.Express) {
  const cache = new Map<string, string>();
  const send = (res: express.Response, key: string, render: () => string | null) => {
    let html = cache.get(key);
    if (html === undefined) {
      const r = render();
      if (r === null) return res.status(404).type('html').send('Not found');
      html = r;
      cache.set(key, html);
    }
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.type('html').send(html);
  };
  app.get('/quiz', (_req, res) => send(res, 'hub', hubPage));
  app.get(`/quiz/${GENERAL_KNOWLEDGE.slug}`, (_req, res) => send(res, 'gk', generalKnowledgePage));
  app.get('/quiz/:slug', (req, res) => send(res, `c:${req.params.slug}`, () => categoryPage(req.params.slug)?.html ?? null));
  app.get('/flag-quiz/:region', (req, res) => send(res, `f:${req.params.region}`, () => flagRegionPage(req.params.region)));
}
