// Generates the multilingual SEO layer for 1v1game.net, on top of the pages the site ALREADY has.
//
// The live site (checked in Search Console, 25 Nov 2026) already serves English pages:
//   /  /quiz  /quiz/{geography,history,science,sports,movies-music,...}  /flag-quiz  /trivia ...
// So this build does NOT recreate them. It adds:
//   public/<lang>/                     localized landing pages (es, pt, fr, de, it, ro, pl, tr)
//   public/<lang>/quiz/                localized category hubs
//   public/<lang>/quiz/<category>/     localized quiz pages (8 categories)
//   public/quiz/{space,music,art-literature}/   NEW English categories the site doesn't have yet
//   public/sitemap-i18n.xml            all of the above + the existing English URLs, with hreflang
//   public/llms.txt                    summary for AI search engines
//   public/<indexnow-key>.txt          IndexNow ownership file
//   snippets/lang-links.html           language links to add to the existing English pages
// It does NOT touch the site's own robots.txt, sitemap.xml, manifest, icons or og.png.
// Run:  node scripts/build.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { SITE, LANGS, CAT_KEYS, FEATURES } from '../data/i18n.mjs';
import { QUESTIONS } from '../data/questions.mjs';
import { X, CONTINENTS, CONT_KEYS } from '../data/extras-i18n.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const SNIP = join(ROOT, 'snippets');
const TODAY = new Date().toISOString().slice(0, 10);
const LANG_KEYS = Object.keys(LANGS);

// English URLs that already exist on the live site (no trailing slash, as the site uses them).
// A category listed here is NOT generated in English; its translations point to it via hreflang.
export const EN_EXISTING = {
  home: '/',
  hub: '/quiz',
  cats: { geography: '/quiz/geography', history: '/quiz/history', science: '/quiz/science', sports: '/quiz/sports', movies: '/quiz/movies-music' },
  // flag-by-continent pages the game server already serves (it has no north/south America split, so those two are generated)
  flags: { europe: '/flag-quiz/europe', asia: '/flag-quiz/asia', africa: '/flag-quiz/africa', oceania: '/flag-quiz/oceania' },
  // other live English pages, used for internal links and llms.txt
  other: {
    '/trivia': '1v1 trivia duels', '/flag-quiz': 'Flag quiz (194 countries)', '/chess-puzzles': 'Chess puzzles',
    '/mental-math': 'Mental math game', '/rubiks-cube': 'Rubik’s Cube online (3D)', '/how-to-play': 'How to play',
    '/quiz/general-knowledge': 'General knowledge quiz', '/quiz/football': 'Football quiz', '/quiz/tv-shows': 'TV shows quiz',
    '/quiz/medical': 'Medical quiz', '/quiz/math': 'Math quiz', '/quiz/technology': 'Technology quiz',
    '/quiz/beauty': 'Beauty quiz', '/quiz/celebrities': 'Celebrities quiz',
  },
};

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => SITE.origin + p;
const ans = (a, l) => (typeof a === 'string' ? a : a[l] ?? a.en);
const write = (rel, content) => { const f = join(OUT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); };
const fitTitle = (t) => (t.length > 68 ? t.replace(/ \| 1v1game$/, '') : t); // Google cuts ~600px
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const paths = {
  home: (l) => (l === 'en' ? EN_EXISTING.home : `${LANGS[l].prefix}/`),
  hub: (l) => (l === 'en' ? EN_EXISTING.hub : `${LANGS[l].prefix}/quiz/`),
  cat: (l, k) => (l === 'en' && EN_EXISTING.cats[k]) || `${LANGS[l].prefix}/quiz/${LANGS[l].cats[k][1]}/`,
};
const enExists = (k) => Boolean(EN_EXISTING.cats[k]);

// ---- growth pages: Q&A list, flags by continent, quiz of the day, embeddable widget ----
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/ı/g, 'i').replace(/[’']/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cont = (l, k) => { const [name, of] = X[l].conts[k]; return { key: k, name, of: of || name, slug: slugify(name) }; };
const xp = {
  gk: (l) => X[l].gk.slug,
  daily: (l) => X[l].daily.slug,
  widget: (l) => X[l].widget.slug,
  flagHub: (l) => (l === 'en' ? '/flag-quiz' : `${X[l].flags.base}/`), // English hub = the live /flag-quiz page
  flag: (l, k) => (l === 'en' && EN_EXISTING.flags[k]) || `${X[l].flags.base}/${cont(l, k).slug}/`,
};
const ALLQ = CAT_KEYS.flatMap((k) => QUESTIONS[k].map((q) => ({ k, q })));
// Same deterministic daily pick in Node (static HTML) and in the browser (live page).
function pickDaily(n, total, day) {
  let s = (day * 2654435761) >>> 0;
  const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const idx = [...Array(total).keys()];
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, n);
}
const inlineJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c'); // '<' escaped so data can't close the <script>
// Play buttons go to the game. `lang` lets the game pre-select its UI language if/when it supports it.
// (No UTM tags on internal links: they overwrite the visitor's real traffic source in GA4.)
const playHref = (l) => (l === 'en' ? '/' : `/?lang=${l}`);

const alternates = (fn) => LANG_KEYS.map((l) => ({ l, href: abs(fn(l)) }));
const hreflangTags = (alts) =>
  alts.map((a) => `<link rel="alternate" hreflang="${a.l}" href="${a.href}">`).join('\n') +
  `\n<link rel="alternate" hreflang="x-default" href="${alts.find((a) => a.l === 'en').href}">`;

function head({ l, title, desc, path, alts, type = 'website', extra = '' }) {
  const L = LANGS[l]; const url = abs(path);
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
${hreflangTags(alts)}
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="1v1game">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs(SITE.ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${L.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${abs(SITE.ogImage)}">
<meta name="theme-color" content="#fff1d1">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
${extra}`;
}

// Light, warm theme matching the site's theme-color (#fff1d1). Adjust the variables to the real palette.
const CSS = `:root{--bg:#fff8ea;--card:#fff;--line:#eedcb3;--text:#2b2118;--muted:#6f5f4d;--accent:#df301c;--link:#007f8f}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text)}
a{color:var(--link)}.wrap{max-width:860px;margin:0 auto;padding:0 20px}
header{background:#fff1d1;border-bottom:1px solid var(--line)}header .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;gap:12px}
.logo{font-weight:800;font-size:20px;color:var(--text);text-decoration:none}.logo b{color:var(--accent)}
nav a{color:var(--muted);text-decoration:none;margin-left:16px;font-size:15px}
.btn{display:inline-block;background:var(--accent);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px}
.btn.sm{padding:8px 14px;font-size:14px;color:#fff}
.crumbs{font-size:14px;color:var(--muted);margin:18px 0 0}.crumbs a{color:var(--muted)}
h1{font-size:clamp(28px,5vw,40px);line-height:1.15;margin:18px 0 12px}h2{font-size:24px;margin:40px 0 12px}
.lead{font-size:18px;color:var(--muted)}.cta{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}
.qs{counter-reset:q;padding:0;list-style:none}.qs li{counter-increment:q;margin:10px 0}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
summary{cursor:pointer;font-weight:600;list-style:none}summary::-webkit-details-marker{display:none}
.qs summary::before{content:counter(q) ". ";color:var(--accent)}
.toc{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.toc a{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 12px;text-decoration:none;font-size:14px}
.flags{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:0;list-style:none}
.flags details{padding:10px;text-align:center}.flags img{width:100%;height:auto;border:1px solid var(--line);border-radius:4px;display:block}
.flags summary::after{content:""}.flags p{margin:8px 0 0}
.daily{padding:0;list-style:none}.daily li{margin:10px 0}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.card .q{margin:0 0 10px;font-weight:600}.card .a{color:var(--link);font-weight:700;margin:0 0 10px}
.daily li.good .card{border-color:#3a9d5d;background:#f1fbf3}.daily li.bad .card{border-color:var(--accent);background:#fff4f1}
button.btn{border:0;cursor:pointer;font:inherit}.btn.ghost{background:var(--card);color:var(--text);border:1px solid var(--line)}button.btn:disabled{opacity:.5;cursor:default}
.gen label{font-weight:600}.gen select,.gen textarea{font:inherit;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--card);width:100%}
.gen textarea{font:13px/1.4 ui-monospace,Consolas,monospace;height:120px}.gen iframe{width:100%;max-width:480px;height:340px;border:0;border-radius:12px;background:#fff}summary::after{content:" \\25BE";color:var(--muted)}
details p{margin:10px 0 0;color:var(--link);font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:0;list-style:none}
.grid a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;color:var(--text);text-decoration:none;font-weight:600}
.grid a:hover,.grid a[aria-current]{border-color:var(--accent)}
.feat{padding-left:20px}.feat li{margin:6px 0}.faq dt{font-weight:700;margin-top:16px}.faq dd{margin:4px 0 0;color:var(--muted)}
.box{background:#fff1d1;border:1px solid var(--line);border-radius:16px;padding:24px;margin:40px 0;text-align:center}
footer{border-top:1px solid var(--line);margin-top:48px;padding:24px 0;color:var(--muted);font-size:14px}footer a{color:var(--muted);margin-right:12px;display:inline-block}`;

function page({ l, headHtml, body, alts }) {
  const L = LANGS[l];
  const langLinks = alts.map((a) => `<a href="${a.href.replace(SITE.origin, '')}" hreflang="${a.l}" lang="${a.l}"${a.l === l ? ' aria-current="page"' : ''}>${LANGS[a.l].name}</a>`).join('');
  const catLinks = CAT_KEYS.map((k) => `<a href="${paths.cat(l, k)}">${esc(L.cats[k][2])}</a>`).join('');
  return `<!doctype html>
<html lang="${l}">
<head>
${headHtml}
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap"><a class="logo" href="${paths.home(l)}">1v1<b>game</b></a><nav><a href="${paths.hub(l)}">${esc(L.ui.quizzes)}</a><a class="btn sm" href="${playHref(l)}">${esc(L.ui.play)}</a></nav></div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">
<p><strong>${esc(L.ui.quizzes)}:</strong> ${catLinks}</p>
<p><a href="${xp.gk(l)}">${esc(X[l].gk.nav)}</a><a href="${xp.daily(l)}">${esc(X[l].daily.h1)}</a><a href="${xp.flagHub(l)}">${esc(X[l].flags.hubName)}</a><a href="${xp.widget(l)}">${esc(X[l].widget.nav)}</a></p>
<p><strong>${esc(L.ui.langs)}:</strong> ${langLinks}</p>
<p><a href="/flag-quiz">Flag quiz</a><a href="/chess-puzzles">Chess puzzles</a><a href="/mental-math">Mental math</a><a href="/rubiks-cube">Rubik’s Cube</a> · © ${new Date().getFullYear()} 1v1game.net</p>
</div></footer>
</body>
</html>
`;
}

const crumbsHtml = (items) => `<nav class="crumbs" aria-label="breadcrumb">${items.map((it, i) => (i < items.length - 1 ? `<a href="${it.path}">${esc(it.name)}</a> › ` : `<span>${esc(it.name)}</span>`)).join('')}</nav>`;
const crumbsLd = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })) });
const catGrid = (l, current) => `<ul class="grid">${CAT_KEYS.map((k) => `<li><a href="${paths.cat(l, k)}"${k === current ? ' aria-current="page"' : ''}>${esc(LANGS[l].cats[k][0])}</a></li>`).join('')}</ul>`;
const readyBox = (l) => { const u = LANGS[l].ui; return `<section class="box"><h2>${esc(u.ready)}</h2><p>${esc(u.readyText)}</p><div class="cta" style="justify-content:center"><a class="btn" href="${playHref(l)}">${esc(u.play)}</a></div></section>`; };
// Feature-flagged copy (see FEATURES in data/i18n.mjs): never describe an unreleased feature as live.
const featureText = (l, f) => (typeof f === 'string' ? f : FEATURES[f[0]] ? f[1] : `${f[1]} (${LANGS[l].ui.soon})`);
const faqItems = (l) => LANGS[l].home.faq.map((x) => (Array.isArray(x) ? x : [x.q, FEATURES[x.flag] ? x.on : x.off]));
const faqHtml = (l) => `<h2>${esc(LANGS[l].ui.faq)}</h2><dl class="faq">${faqItems(l).map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>`;
const faqLd = (l) => ({ '@type': 'FAQPage', mainEntity: faqItems(l).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const gameLd = (l) => ({
  '@type': 'VideoGame', name: '1v1game', alternateName: 'Duel', url: abs('/'), inLanguage: l,
  description: LANGS[l].home.desc, genre: ['Trivia', 'Puzzle', 'Educational'], gamePlatform: ['Web browser'],
  playMode: 'MultiPlayer', image: abs(SITE.ogImage), offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: '1v1game', url: abs('/') },
});

// ---------- builders ----------
const sitemap = []; // { loc, alts }

function buildCategory(l, k) {
  const L = LANGS[l]; const [name, , kw] = L.cats[k]; const qs = QUESTIONS[k]; const n = qs.length;
  const path = paths.cat(l, k); const alts = alternates((x) => paths.cat(x, k));
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: L.ui.quizzes, path: paths.hub(l) }, { name, path }];
  const quizLd = {
    '@type': 'Quiz', name: kw, about: { '@type': 'Thing', name }, inLanguage: l, url: abs(path), educationalLevel: 'beginner',
    hasPart: qs.map((q) => ({ '@type': 'Question', eduQuestionType: 'Flashcard', text: q.q[l], acceptedAnswer: { '@type': 'Answer', text: ans(q.a, l) } })),
  };
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), quizLd] });
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(L.cat.h1(kw))}</h1>
<p class="lead">${esc(L.cat.intro(kw, n))}</p>
<div class="cta"><a class="btn" href="${playHref(l)}">${esc(L.ui.play)}</a></div>
<ol class="qs">
${qs.map((q) => `<li><details><summary>${esc(q.q[l])}</summary><p>${esc(ans(q.a, l))}</p></details></li>`).join('\n')}
</ol>
${readyBox(l)}
<h2>${esc(L.ui.more)}</h2>
${catGrid(l, k)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: fitTitle(L.cat.title(kw, n)), desc: L.cat.desc(kw, n), path, alts, type: 'article', extra: ld }) }));
}

function buildHub(l) {
  const L = LANGS[l]; const path = paths.hub(l); const alts = alternates(paths.hub);
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: L.ui.quizzes, path }];
  const list = { '@type': 'ItemList', itemListElement: CAT_KEYS.map((k, i) => ({ '@type': 'ListItem', position: i + 1, name: L.cats[k][2], url: abs(paths.cat(l, k)) })) };
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), { '@type': 'CollectionPage', name: L.hub.h1, url: abs(path), inLanguage: l, mainEntity: list }] });
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(L.hub.h1)}</h1>
<p class="lead">${esc(L.hub.lead)}</p>
${catGrid(l)}
${readyBox(l)}
${faqHtml(l)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: L.hub.title, desc: L.hub.desc, path, alts, extra: ld }) }));
}

function buildLanding(l) {
  const L = LANGS[l]; const H = L.home; const path = paths.home(l); const alts = alternates(paths.home);
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [gameLd(l), faqLd(l)] });
  const body = `<h1>${esc(H.h1)}</h1>
<p class="lead">${esc(H.lead)}</p>
<div class="cta"><a class="btn" href="${playHref(l)}">${esc(H.cta)}</a></div>
<h2>${esc(L.ui.why)}</h2>
${H.paras.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<ul class="feat">${H.features.map((f) => `<li>${esc(featureText(l, f))}</li>`).join('')}</ul>
<p>${esc(H.modes)}</p>
<h2>${esc(L.hub.h1)}</h2>
${catGrid(l)}
${faqHtml(l)}
${readyBox(l)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: H.title, desc: H.desc, path, alts, extra: ld }) }));
}

// ---- Q&A list: "general knowledge questions and answers" (all categories on one page) ----
function buildGk(l) {
  // A readable page: the first GK_PER questions of each category (category pages carry the full lists).
  const GK_PER = 20; const pick = (k) => QUESTIONS[k].slice(0, GK_PER);
  const list = CAT_KEYS.flatMap((k) => pick(k).map((q) => ({ k, q })));
  const L = LANGS[l]; const G = X[l].gk; const n = list.length; const path = xp.gk(l); const alts = alternates(xp.gk);
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: L.ui.quizzes, path: paths.hub(l) }, { name: G.h1, path }];
  const quizLd = { '@type': 'Quiz', name: G.h1, inLanguage: l, url: abs(path), educationalLevel: 'beginner',
    hasPart: list.map(({ q }) => ({ '@type': 'Question', eduQuestionType: 'Flashcard', text: q.q[l], acceptedAnswer: { '@type': 'Answer', text: ans(q.a, l) } })) };
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), quizLd] });
  const sections = CAT_KEYS.map((k) => `<h2 id="${k}">${esc(L.cats[k][0])}</h2>
<ol class="qs">
${pick(k).map((q) => `<li><details><summary>${esc(q.q[l])}</summary><p>${esc(ans(q.a, l))}</p></details></li>`).join('\n')}
</ol>
<p><a href="${paths.cat(l, k)}">${esc(L.cats[k][2])} →</a></p>`).join('\n');
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(G.h1)}</h1>
<p class="lead">${esc(G.intro(n))}</p>
<div class="cta"><a class="btn" href="${playHref(l)}">${esc(L.ui.play)}</a><a class="btn ghost" href="${xp.daily(l)}">${esc(X[l].daily.h1)}</a></div>
<ul class="toc">${CAT_KEYS.map((k) => `<li><a href="#${k}">${esc(L.cats[k][0])}</a></li>`).join('')}</ul>
${sections}
${readyBox(l)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: fitTitle(G.title(n)), desc: G.desc(n), path, alts, type: 'article', extra: ld }) }));
}

// ---- flag quiz by continent (country names from ICU, so they are correct in every language) ----
// Flags: self-hosted SVGs from flag-icons (MIT, data/flags/) copied to /flags/<cc>.svg.
const flagImg = (cc, alt) => `<img src="/flags/${cc}.svg" width="160" height="120" alt="${esc(alt)}" loading="lazy" decoding="async">`;
function copyFlags() {
  const src = join(ROOT, 'data', 'flags'); mkdirSync(join(OUT, 'flags'), { recursive: true });
  for (const f of readdirSync(src)) copyFileSync(join(src, f), join(OUT, 'flags', f));
}
const contItems = (l, k) => { const dn = new Intl.DisplayNames([l], { type: 'region' }); return CONTINENTS[k].map((c) => ({ cc: c.toLowerCase(), name: dn.of(c) })); };
const contGrid = (l, current) => `<ul class="grid">${CONT_KEYS.map((k) => `<li><a href="${xp.flag(l, k)}"${k === current ? ' aria-current="page"' : ''}>${esc(cont(l, k).name)} (${CONTINENTS[k].length})</a></li>`).join('')}</ul>`;

function buildFlagContinent(l, k) {
  const L = LANGS[l]; const F = X[l].flags; const c = cont(l, k); const items = contItems(l, k); const n = items.length;
  const path = xp.flag(l, k); const alts = alternates((x) => xp.flag(x, k));
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: F.hubName, path: xp.flagHub(l) }, { name: c.name, path }];
  const quizLd = { '@type': 'Quiz', name: F.h1(c), inLanguage: l, url: abs(path), educationalLevel: 'beginner',
    hasPart: items.map((it) => ({ '@type': 'Question', eduQuestionType: 'Flashcard', text: F.q, image: abs(`/flags/${it.cc}.svg`), acceptedAnswer: { '@type': 'Answer', text: it.name } })) };
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), quizLd] });
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(F.h1(c))}</h1>
<p class="lead">${esc(F.intro(c, n))}</p>
<div class="cta"><a class="btn" href="${playHref(l)}">${esc(L.ui.play)}</a></div>
<ol class="flags">
${items.map((it) => `<li><details><summary>${flagImg(it.cc, it.name)}</summary><p><strong>${esc(it.name)}</strong></p></details></li>`).join('\n')}
</ol>
${readyBox(l)}
<h2>${esc(L.ui.more)}</h2>
${contGrid(l, k)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: fitTitle(F.title(c, n)), desc: F.desc(c, n), path, alts, type: 'article', extra: ld }) }));
}

function buildFlagHub(l) { // not for English: /flag-quiz already exists on the live site
  const L = LANGS[l]; const F = X[l].flags; const path = xp.flagHub(l); const alts = alternates(xp.flagHub);
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: F.hubName, path }];
  const list = { '@type': 'ItemList', itemListElement: CONT_KEYS.map((k, i) => ({ '@type': 'ListItem', position: i + 1, name: F.h1(cont(l, k)), url: abs(xp.flag(l, k)) })) };
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), { '@type': 'CollectionPage', name: F.hubH1, url: abs(path), inLanguage: l, mainEntity: list }] });
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(F.hubH1)}</h1>
<p class="lead">${esc(F.hubIntro)}</p>
${contGrid(l)}
<ul class="flags" style="margin-top:20px">${CONT_KEYS.map((k) => { const it = contItems(l, k)[0]; return `<li><a href="${xp.flag(l, k)}">${flagImg(it.cc, it.name)}</a></li>`; }).join('')}</ul>
${readyBox(l)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: F.hubTitle, desc: F.hubDesc, path, alts, extra: ld }) }));
}

// ---- quiz of the day: static set for crawlers + client-side daily rotation, score and share grid ----
function buildDaily(l) {
  const L = LANGS[l]; const D = X[l].daily; const path = xp.daily(l); const alts = alternates(xp.daily);
  const data = ALLQ.map(({ q }) => [q.q[l], ans(q.a, l)]);
  const ids = pickDaily(10, data.length, Math.floor(Date.now() / 864e5));
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: L.ui.quizzes, path: paths.hub(l) }, { name: D.h1, path }];
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), { '@type': 'Quiz', name: D.h1, inLanguage: l, url: abs(path), educationalLevel: 'beginner' }] });
  const T = { reveal: D.reveal, got: D.got, missed: D.missed, score: D.score, copied: D.copied, share: D.shareText('{d}', '{k}', '{n}') };
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(D.h1)}</h1>
<p class="lead">${esc(D.intro)} <span id="qd"></span></p>
<ol class="qs" id="daily">
${ids.map((i) => `<li><details><summary>${esc(data[i][0])}</summary><p>${esc(data[i][1])}</p></details></li>`).join('\n')}
</ol>
<section class="box" id="result" hidden><h2 id="score"></h2><p id="grid" style="font-size:26px;letter-spacing:3px;margin:0"></p>
<div class="cta" style="justify-content:center"><button class="btn" id="share" type="button">${esc(D.share)}</button><a class="btn ghost" href="${playHref(l)}">${esc(L.ui.play)}</a></div><p>${esc(D.tomorrow)}</p></section>
<p><a href="${xp.gk(l)}">${esc(X[l].gk.h1)} →</a></p>
<script>
(() => {
  const Q = ${inlineJson(data)}, T = ${inlineJson(T)}, N = 10;
  const pick = ${pickDaily.toString()};
  const now = new Date(); const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 6e4) / 864e5);
  const date = now.toLocaleDateString(${JSON.stringify(l)}); document.getElementById('qd').textContent = '(' + date + ')';
  const ids = pick(N, Q.length, day); const res = [];
  const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ol = document.getElementById('daily'); ol.className = 'daily';
  ol.innerHTML = ids.map((i, n) => '<li><div class="card"><p class="q">' + (n + 1) + '. ' + e(Q[i][0]) + '</p><button type="button" class="btn sm rv">' + e(T.reveal) + '</button>'
    + '<div class="ans" hidden><p class="a">' + e(Q[i][1]) + '</p><button type="button" class="btn sm ok" data-n="' + n + '">✓ ' + e(T.got) + '</button> <button type="button" class="btn sm ghost ko" data-n="' + n + '">✗ ' + e(T.missed) + '</button></div></div></li>').join('');
  ol.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return; const li = b.closest('li');
    if (b.classList.contains('rv')) { b.hidden = true; li.querySelector('.ans').hidden = false; return; }
    const n = +b.dataset.n; if (res[n] !== undefined) return;
    res[n] = b.classList.contains('ok'); li.classList.add(res[n] ? 'good' : 'bad'); li.querySelectorAll('.ok,.ko').forEach((x) => (x.disabled = true));
    if (res.filter((x) => x !== undefined).length === N) done();
  });
  function done() {
    const k = res.filter(Boolean).length; const grid = res.map((x) => (x ? '🟩' : '🟥')).join('');
    document.getElementById('score').textContent = T.score + ': ' + k + '/' + N; document.getElementById('grid').textContent = grid;
    const box = document.getElementById('result'); box.hidden = false; box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const text = T.share.replace('{d}', date).replace('{k}', k).replace('{n}', N) + '\\n' + grid + '\\n' + location.href;
    document.getElementById('share').onclick = (ev) => {
      if (navigator.share) navigator.share({ text }).catch(() => {});
      else navigator.clipboard.writeText(text).then(() => { ev.target.textContent = T.copied; });
    };
  }
})();
</script>
${readyBox(l)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: fitTitle(D.title), desc: D.desc, path, alts, extra: ld }) }));
}

// ---- embeddable widget: /embed/<lang>.html (noindex, framed by other sites) + an indexable landing page ----
function buildEmbed(l) {
  const L = LANGS[l]; const W = X[l].widget;
  const data = Object.fromEntries(CAT_KEYS.map((k) => [k, [L.cats[k][0], QUESTIONS[k].map((q) => [q.q[l], ans(q.a, l)])]]));
  write(`embed/${l}.html`, `<!doctype html>
<html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow"><title>1v1game quiz</title>
<style>*{box-sizing:border-box}html,body{margin:0;height:100%}body{font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#2b2118;background:#fff8ea}
.w{min-height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid #eedcb3;border-radius:12px}
.top{display:flex;justify-content:space-between;font-size:12px;color:#6f5f4d;text-transform:uppercase;letter-spacing:.04em}
.q{font-size:18px;font-weight:700;margin:0}.a{color:#007f8f;font-weight:800;font-size:18px;margin:0}
button{font:inherit;font-weight:700;border:0;border-radius:10px;padding:10px 14px;cursor:pointer;background:#df301c;color:#fff;align-self:flex-start}
button.n{background:#fff;color:#2b2118;border:1px solid #eedcb3}.sp{flex:1}
.play{font-size:13px;color:#007f8f;font-weight:700;text-decoration:none}</style></head>
<body><div class="w"><div class="top"><span id="c"></span><span>1v1game</span></div>
<p class="q" id="q"></p><button id="rv" type="button">${esc(L.ui.show)}</button><p class="a" id="a" hidden></p>
<button class="n" id="nx" type="button" hidden>${esc(W.next)} →</button><div class="sp"></div>
<a class="play" id="pl" href="${abs(playHref(l))}" target="_blank" rel="noopener">▶ ${esc(L.ui.play)} · 1v1game.net</a></div>
<script>
(() => {
  const D = ${inlineJson(data)};
  const cat = new URLSearchParams(location.search).get('cat');
  const keys = D[cat] ? [cat] : Object.keys(D);
  const pool = keys.flatMap((k) => D[k][1].map((x) => [D[k][0], x[0], x[1]]));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  let i = 0; const $ = (id) => document.getElementById(id);
  const show = () => { const [c, q, a] = pool[i % pool.length]; $('c').textContent = c; $('q').textContent = q; $('a').textContent = a; $('a').hidden = true; $('nx').hidden = true; $('rv').hidden = false; };
  $('rv').onclick = () => { $('a').hidden = false; $('nx').hidden = false; $('rv').hidden = true; };
  $('nx').onclick = () => { i++; show(); };
  show();
})();
</script></body></html>
`);
}

function buildWidgetPage(l) {
  const L = LANGS[l]; const W = X[l].widget; const path = xp.widget(l); const alts = alternates(xp.widget);
  const crumbs = [{ name: L.ui.home, path: paths.home(l) }, { name: W.h1, path }];
  // Each widget carries one visible, relevant credit link (category page + its keyword as anchor).
  const links = { all: [abs(xp.gk(l)), X[l].gk.h1], ...Object.fromEntries(CAT_KEYS.map((k) => [k, [abs(paths.cat(l, k)), L.cats[k][2]]])) };
  const snippet = (c) => `<div style="max-width:480px"><iframe src="${SITE.origin}/embed/${l}.html${c === 'all' ? '' : `?cat=${c}`}" title="${links[c][1]}" width="100%" height="340" style="border:0;border-radius:12px" loading="lazy"></iframe><p style="font:13px/1.4 system-ui,sans-serif;margin:6px 0 0">${W.by} <a href="${links[c][0]}">${links[c][1]}</a> · 1v1game</p></div>`;
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [crumbsLd(crumbs), { '@type': 'WebApplication', name: W.h1, url: abs(path), inLanguage: l, applicationCategory: 'GameApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }] });
  const body = `${crumbsHtml(crumbs)}
<h1>${esc(W.h1)}</h1>
<p class="lead">${esc(W.intro)}</p>
<ul class="feat">${W.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<h2>${esc(W.how)}</h2>
<div class="gen">
<p><label for="wcat">${esc(W.cat)}</label><br><select id="wcat"><option value="all">${esc(W.all)}</option>${CAT_KEYS.map((k) => `<option value="${k}">${esc(L.cats[k][0])}</option>`).join('')}</select></p>
<p><strong>${esc(W.preview)}</strong></p>
<iframe id="wpv" src="/embed/${l}.html" title="${esc(W.preview)}" loading="lazy"></iframe>
<p><label for="wcode">${esc(W.code)}</label><br><textarea id="wcode" readonly>${esc(snippet('all'))}</textarea></p>
<p><button class="btn" id="wcopy" type="button">${esc(W.copy)}</button></p>
</div>
<script>
(() => {
  const S = ${inlineJson(Object.fromEntries(['all', ...CAT_KEYS].map((c) => [c, snippet(c)])))};
  const sel = document.getElementById('wcat'), code = document.getElementById('wcode'), pv = document.getElementById('wpv'), btn = document.getElementById('wcopy');
  sel.onchange = () => { code.value = S[sel.value]; pv.src = '/embed/${l}.html' + (sel.value === 'all' ? '' : '?cat=' + sel.value); btn.textContent = ${JSON.stringify(W.copy)}; };
  btn.onclick = () => { code.select(); navigator.clipboard.writeText(code.value).then(() => { btn.textContent = ${JSON.stringify(W.copied)}; }); };
})();
</script>
${readyBox(l)}`;
  write(path.slice(1) + 'index.html', page({ l, alts, body, headHtml: head({ l, title: fitTitle(W.title), desc: W.desc, path, alts, extra: ld }) }));
}

// sitemap-i18n.xml lists EVERY member of every hreflang cluster (incl. the existing English URLs),
// which is what makes sitemap-based hreflang valid without editing the English pages' <head>.
function buildSitemap() {
  const clusters = [alternates(paths.home), alternates(paths.hub), ...CAT_KEYS.map((k) => alternates((x) => paths.cat(x, k))),
    alternates(xp.gk), alternates(xp.daily), alternates(xp.widget), alternates(xp.flagHub), ...CONT_KEYS.map((k) => alternates((x) => xp.flag(x, k)))];
  const entries = clusters.flatMap((alts) => alts.map((a) => ({ loc: a.href, alts })));
  const urls = entries.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n${u.alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.l}" href="${a.href}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${u.alts.find((a) => a.l === 'en').href}"/>\n  </url>`).join('\n');
  write('sitemap-i18n.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
  return entries.length;
}

function buildLlms() {
  const L = LANGS.en;
  write('llms.txt', `# 1v1game (Duel)

> ${LANGS.en.home.desc}

1v1game.net is a free, browser-based 1v1 brain game. Press Play and a duel starts instantly: three rounds on random topics, best of three wins. ${FEATURES.ranked ? 'Play matches you with a real player of similar rating (Glicko-2 ratings, leagues from Bronze to Legend, a leaderboard for registered players). If nobody is online within a few seconds, you play a recorded duel of a real player or a computer opponent instead.' : 'Duels are currently played against a bot; ranked online matches against real players are coming soon.'} ${FEATURES.friend ? 'Players can challenge a friend with a private invite link.' : 'Friend duels via a private invite link are coming soon.'} Available in: ${LANG_KEYS.map((l) => LANGS[l].name).join(', ')}.

## Play
- [Play now](${abs('/')})
${Object.entries(EN_EXISTING.other).filter(([p]) => !p.startsWith('/quiz/')).map(([p, t]) => `- [${t}](${abs(p)})`).join('\n')}

## Quizzes with answers
- [All quizzes](${abs(EN_EXISTING.hub)})
${CAT_KEYS.map((k) => `- [${L.cats[k][2]}](${abs(paths.cat('en', k))})`).join('\n')}
${Object.entries(EN_EXISTING.other).filter(([p]) => p.startsWith('/quiz/')).map(([p, t]) => `- [${t}](${abs(p)})`).join('\n')}

## More
- [${X.en.gk.h1}](${abs(xp.gk('en'))})
- [${X.en.daily.h1}](${abs(xp.daily('en'))}): 10 new questions every day
${CONT_KEYS.map((k) => `- [${X.en.flags.h1(cont('en', k))}](${abs(xp.flag('en', k))})`).join('\n')}
- [${X.en.widget.h1}](${abs(xp.widget('en'))})

## Other languages
${LANG_KEYS.filter((l) => l !== 'en').map((l) => `- [${LANGS[l].name}](${abs(paths.home(l))})`).join('\n')}
`);
}

function buildIndexNowKey() {
  const keyFile = join(ROOT, 'data', 'indexnow-key.txt');
  if (!existsSync(keyFile)) writeFileSync(keyFile, randomBytes(16).toString('hex'));
  const key = readFileSync(keyFile, 'utf8').trim();
  write(`${key}.txt`, key);
  return key;
}

function buildSnippets() {
  mkdirSync(SNIP, { recursive: true });
  rmSync(join(SNIP, 'head-home.html'), { force: true });
  rmSync(join(SNIP, 'home-seo-section.html'), { force: true });
  writeFileSync(join(SNIP, 'lang-links.html'),
    `<!-- Add to the footer of the existing English pages (home, /quiz, quiz pages) so Google finds the translations by links too. -->\n` +
    `<nav aria-label="Languages">${LANG_KEYS.map((l) => `<a href="${paths.home(l)}" hreflang="${l}" lang="${l}">${LANGS[l].name}</a>`).join(' · ')}</nav>\n`);
  writeFileSync(join(SNIP, 'flag-continents.html'),
    `<!-- Add to the existing English /flag-quiz page (above or below the game) so the continent pages get internal links. -->\n` +
    `<nav aria-label="Flags by continent"><h2>Flag quiz by continent</h2><ul>${CONT_KEYS.map((k) => `<li><a href="${xp.flag('en', k)}">Flags of ${cont('en', k).name} (${CONTINENTS[k].length})</a></li>`).join('')}</ul></nav>\n`);
  writeFileSync(join(SNIP, 'home-links.html'),
    `<!-- Add to the English homepage and /quiz (visible links, not hidden): -->\n` +
    `<nav aria-label="More quizzes"><a href="${xp.daily('en')}">Quiz of the day</a> · <a href="${xp.gk('en')}">General knowledge questions and answers</a> · <a href="${xp.widget('en')}">Quiz widget for your site</a></nav>\n`);
}

// ---------- run ----------
rmSync(OUT, { recursive: true, force: true });
for (const l of LANG_KEYS) {
  if (l !== 'en') { buildLanding(l); buildHub(l); }
  for (const k of CAT_KEYS) if (l !== 'en' || !enExists(k)) buildCategory(l, k);
  buildGk(l); buildDaily(l); buildEmbed(l); buildWidgetPage(l);
  if (l !== 'en') buildFlagHub(l);
  for (const k of CONT_KEYS) if (l !== 'en' || !EN_EXISTING.flags[k]) buildFlagContinent(l, k);
}
copyFlags();
const n = buildSitemap(); buildLlms(); buildSnippets();
const key = buildIndexNowKey();
console.log(`sitemap-i18n.xml: ${n} URLs (${LANG_KEYS.length} languages). IndexNow key: ${key}`);
