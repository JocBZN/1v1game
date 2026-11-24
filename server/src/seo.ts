/**
 * SEO for a single-page game: crawlable landing pages per topic, robots.txt, sitemap.xml, structured data
 * and the runtime values injected into the client's index.html (public URL, analytics IDs).
 */
import fs from 'node:fs';
import path from 'node:path';
import type express from 'express';

export const SITE = {
  name: 'Duel',
  title: 'Duel – 1v1 Trivia, Chess Puzzles & Brain Games Online',
  description:
    'Challenge a real opponent in 30 seconds: trivia, chess puzzles, mental math, flags and a real Rubik’s Cube. Best of 3 rounds, ranked leagues, free in your browser.',
  themeColor: '#fff1d1',
};

/** Public base URL, without trailing slash. */
export function publicUrl(): string {
  const explicit = process.env.PUBLIC_URL?.replace(/\/+$/, '');
  if (explicit) return explicit;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

/** Analytics/config values the client reads at runtime (no rebuild needed to change them). */
export function clientConfig() {
  return {
    publicUrl: publicUrl(),
    ga4: process.env.GA4_ID || null, // e.g. G-XXXXXXX
    clarity: process.env.CLARITY_ID || null, // Microsoft Clarity project id
    umami: process.env.UMAMI_WEBSITE_ID
      ? { src: process.env.UMAMI_SRC || 'https://cloud.umami.is/script.js', websiteId: process.env.UMAMI_WEBSITE_ID }
      : null,
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface TopicPage {
  slug: string;
  emoji: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  how: string[];
  faq: [string, string][];
}

export const TOPIC_PAGES: TopicPage[] = [
  {
    slug: 'trivia',
    emoji: '🧠',
    name: 'Trivia',
    title: '1v1 Trivia Quiz Online – Live Trivia Duels | Duel',
    description:
      'Play a live 1v1 trivia quiz against real people. 1,200+ questions on history, football, science, movies, TV, medicine, tech and more. Fast answers score more.',
    h1: '1v1 trivia duels, live',
    intro:
      'Answer five questions from five different categories before your opponent does. Duel has over 1,200 hand-checked questions on history, geography, science, sport, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.',
    how: [
      '5 questions per round, 10 seconds each, from 5 different categories.',
      'A correct answer is worth 500 points plus up to 500 for speed.',
      'You see your opponent’s score live while you play.',
      'Win 2 of the 3 rounds of a duel to win it and climb the leagues.',
    ],
    faq: [
      ['Is the trivia quiz free?', 'Yes. Duel is free and runs in your browser, on phone or desktop. Pick a nickname and play — no email, no password.'],
      ['Do I play against real people?', 'Yes. If nobody is online within 5 seconds you play a “ghost”: a replay of a real player’s round with their original timing.'],
      ['How many questions are there?', 'More than 1,200 questions in 12 categories, with at least 90 per category.'],
    ],
  },
  {
    slug: 'chess-puzzles',
    emoji: '♞',
    name: 'Chess puzzles',
    title: 'Chess Puzzles Duel Online – Mate in 1, Mate in 2 vs Real Players | Duel',
    description:
      'Race a real opponent on chess puzzles: mate in 1, mate in 2 and winning material. 90 seconds, one wrong move loses the puzzle. Free, in the browser.',
    h1: 'Chess puzzle races against real players',
    intro:
      'Solve as many chess puzzles as you can in 90 seconds while your opponent does the same. Every move is checked on the server, so the board is always fair.',
    how: [
      'Mate in 1, mate in 2 and win-material tactics.',
      '1,000 points per solved puzzle plus a small speed bonus.',
      'One wrong move and the puzzle is lost — the board shows you the right move.',
      'Drag or tap pieces; works great on a phone.',
    ],
    faq: [
      ['Is any checkmate accepted?', 'Yes. If you find a different move that also mates, it counts.'],
      ['Do I need an account?', 'No. Choose a nickname and start playing.'],
    ],
  },
  {
    slug: 'mental-math',
    emoji: '🧮',
    name: 'Mental math',
    title: 'Mental Math Game Online – 1v1 Speed Arithmetic Duels | Duel',
    description:
      'Speed arithmetic against a real opponent: 60 seconds of mental math that gets harder as you go. Addition, subtraction, multiplication, division. Free online.',
    h1: 'Mental math, head to head',
    intro: 'Sixty seconds, as many problems as you can solve. The problems get harder the more you get right, and a mistake only costs a little.',
    how: [
      'Integer answers only: no decimals, no tricks.',
      '100 to 250 points per answer depending on difficulty, −50 for a miss.',
      'Use the on-screen keypad or your keyboard.',
    ],
    faq: [['Is it good practice for exams?', 'It trains fast, accurate arithmetic under time pressure — the same skill used in timed tests.']],
  },
  {
    slug: 'flag-quiz',
    emoji: '🚩',
    name: 'Flags',
    title: 'Flag Quiz Online – Guess the Country, 1v1 | Duel',
    description:
      'Guess the flags of 194 countries against a real opponent. 8 flags, 6 seconds each, wrong answers from the same region. Free flag quiz game in your browser.',
    h1: 'Flag quiz duels',
    intro:
      'Eight flags, six seconds each. The wrong options always come from the same region, so you really need to know your flags — from Europe to Oceania.',
    how: ['194 countries from every continent.', 'At most 3 lesser-known flags per round.', 'Speed bonus for fast answers.'],
    faq: [['Which countries are included?', 'Every country in Europe, Asia, Africa, the Americas and Oceania, 194 in total.']],
  },
  {
    slug: 'rubiks-cube',
    emoji: '🧊',
    name: 'Rubik’s Cube',
    title: 'Rubik’s Cube Online – Solve a 3D Cube vs a Real Player | Duel',
    description:
      'Solve a real 3D Rubik’s Cube online against an opponent. Drag a row to turn it, drag outside to spin the cube. 5 minutes, scored on progress and speed.',
    h1: 'A real Rubik’s Cube, online, 1v1',
    intro:
      'A genuine 3×3 cube rendered in 3D. Drag a row or column with your finger or mouse to turn it, and drag outside the cube to look around. Both players get a scramble and five minutes.',
    how: [
      '20 points for every sticker that matches its face while you work.',
      'Solving it scores 3,000 plus up to 2,000 for speed.',
      'Every turn is checked on the server — no shortcuts.',
    ],
    faq: [['Do I need to know how to solve it?', 'No. Partial progress scores points, so beginners can still win a round.']],
  },
];

const HOW_TO_PLAY: TopicPage = {
  slug: 'how-to-play',
  emoji: '⚔️',
  name: 'How to play',
  title: 'How to Play Duel – Rules, Leagues and Ratings',
  description:
    'Duel rules: 3 rounds on random topics, best of 3 wins. Glicko-2 ratings per topic, leagues from Bronze to Legend, ghosts when nobody is online.',
  h1: 'How Duel works',
  intro:
    'Press Play and you are matched with someone of a similar rating. The server picks three different topics; win two rounds to win the duel. Your overall rating and your rating in each topic change after every duel.',
  how: [
    'Topics: trivia, chess puzzles, mental math, flags and Rubik’s Cube.',
    'Leagues: Bronze, Silver (1300), Gold (1500), Platinum (1700), Diamond (1900), Legend (2100).',
    'Ratings use the Glicko-2 system, like many chess sites.',
    'Leaving or being disconnected for more than 15 seconds counts as a loss.',
  ],
  faq: [
    ['Is Duel free?', 'Yes, completely free. It runs in the browser and can be installed on your phone’s home screen.'],
    ['What is a ghost?', 'When nobody is online, you play a replay of a real player’s round, with their real timing and score.'],
  ],
};

const ALL_PAGES = [...TOPIC_PAGES, HOW_TO_PLAY];

const PAGE_CSS = `
*{box-sizing:border-box}body{margin:0;background:#fff1d1;color:#2b1b12;font:16px/1.6 Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:#007f8f}main,header,footer{max-width:720px;margin:0 auto;padding:0 20px}
header{display:flex;align-items:center;justify-content:space-between;padding-top:20px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.03em;color:#2b1b12;text-decoration:none}
.dots{display:inline-flex;gap:5px;margin-right:8px;vertical-align:middle}.dots i{width:9px;height:9px;border-radius:50%;display:block}
h1{font-size:clamp(32px,7vw,48px);line-height:1.1;letter-spacing:-.03em;margin:40px 0 16px}
h2{font-size:20px;margin:36px 0 8px;letter-spacing:-.01em}.lead{font-size:18px;color:#5c4734}
.cta{display:inline-block;background:#df301c;color:#fff1d1;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:16px;margin:24px 0}
.cta:hover{background:#b8240f}ul{padding-left:20px}li{margin:6px 0}
.card{background:#fff8e8;border:1px solid #ecd6a8;border-radius:20px;padding:4px 20px;margin-top:12px}
.topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}
.topics a{background:#fff8e8;border:1px solid #ecd6a8;border-radius:16px;padding:14px;text-decoration:none;color:#2b1b12;font-weight:600}
.topics a:hover{border-color:#d8bb83}footer{color:#8a6e52;font-size:14px;padding:48px 20px 32px}
details{border-top:1px solid #ecd6a8;padding:12px 0}details:first-child{border-top:0}summary{font-weight:600;cursor:pointer}`;

function pageHtml(p: TopicPage): string {
  const base = publicUrl();
  const url = `${base}/${p.slug}`;
  const others = ALL_PAGES.filter((o) => o.slug !== p.slug);
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name, item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: p.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="${SITE.themeColor}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${base}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${base}/og.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>${PAGE_CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header><a class="logo" href="/"><span class="dots"><i style="background:#00b7cd"></i><i style="background:#ff9100"></i><i style="background:#df301c"></i></span>Duel</a><a href="/" class="logo" style="font-size:15px;font-weight:600;color:#df301c">Play free →</a></header>
<main>
<h1>${esc(p.emoji)} ${esc(p.h1)}</h1>
<p class="lead">${esc(p.intro)}</p>
<a class="cta" href="/">Play now — it’s free</a>
<h2>How it works</h2>
<ul>${p.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
<h2>Questions</h2>
<div class="card">${p.faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
<h2>More ways to duel</h2>
<nav class="topics">${others.map((o) => `<a href="/${o.slug}">${esc(o.emoji)} ${esc(o.name)}</a>`).join('')}</nav>
</main>
<footer>© ${new Date().getFullYear()} Duel · 1v1 brain games in your browser · <a href="/privacy">Privacy</a></footer>
</body>
</html>`;
}

export function homeJsonLd(): string {
  const base = publicUrl();
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: `${base}/`, description: SITE.description },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: SITE.name,
      url: `${base}/`,
      description: SITE.description,
      image: `${base}/og.png`,
      genre: ['Trivia', 'Puzzle', 'Educational'],
      gamePlatform: ['Web browser', 'Android', 'iOS'],
      playMode: 'MultiPlayer',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    },
  ];
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}

/** client/dist/index.html with the public URL, structured data and runtime config filled in. */
export function makeIndexRenderer(distDir: string): () => string {
  let cached: string | null = null;
  return () => {
    if (cached) return cached;
    const tpl = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    cached = tpl
      .replaceAll('__PUBLIC_URL__', publicUrl())
      .replace('<!--HOME_JSONLD-->', `<script type="application/ld+json">${homeJsonLd()}</script>`)
      .replace('<!--DUEL_CONFIG-->', `<script>window.__DUEL__=${JSON.stringify(clientConfig()).replace(/</g, '\\u003c')}</script>`);
    return cached;
  };
}

function privacyHtml(): string {
  const base = publicUrl();
  const contact = process.env.CONTACT_EMAIL;
  const section = (h: string, body: string) => `<h2>${h}</h2><p>${body}</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy | Duel</title><meta name="description" content="How Duel handles your data: nickname, game results and optional analytics.">
<link rel="canonical" href="${base}/privacy"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>${PAGE_CSS}</style></head><body>
<header><a class="logo" href="/"><span class="dots"><i style="background:#00b7cd"></i><i style="background:#ff9100"></i><i style="background:#df301c"></i></span>Duel</a></header>
<main><h1>Privacy Policy</h1><p class="lead">Short version: we store what the game needs, nothing more, and we never sell data.</p>
${section('What we store', 'Your nickname, a hashed password if you create an account (never the password itself), your ratings, and the results and moves of the duels you play. Rounds you play may be replayed to other players as a “ghost” opponent, shown with your nickname.')}
${section('Guests', 'Guests get a random nickname and a token saved in their browser. Guest data stays on our server until it is cleaned up; guests never appear on the leaderboard.')}
${section('Analytics', 'We count page views and game events (for example “duel finished”) to improve the game. Cookie-based analytics (Google Analytics, Microsoft Clarity) only run if you accept them in the banner. You can change your mind by clearing this site’s data in your browser.')}
${section('Your rights', `You can ask us to delete your account and all its data${contact ? ` by writing to <a href="mailto:${esc(contact)}">${esc(contact)}</a>` : ''}. We answer within 30 days.`)}
${section('Children', 'Duel is a general-audience game and does not knowingly collect personal data from children beyond a nickname.')}
<p class="lead" style="font-size:14px">Last updated: ${new Date().toISOString().slice(0, 10)}</p>
</main><footer>© ${new Date().getFullYear()} Duel</footer></body></html>`;
}

export function mountSeo(app: express.Express) {
  app.get('/privacy', (_req, res) => res.type('html').send(privacyHtml()));

  // Digital Asset Links: lets the Google Play (TWA) version open full screen without a URL bar.
  // Set TWA_PACKAGE (e.g. app.duel.twa) and TWA_SHA256 (signing key fingerprint, comma-separated) on Railway.
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    const pkg = process.env.TWA_PACKAGE;
    const fps = (process.env.TWA_SHA256 ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    res.json(
      pkg && fps.length
        ? [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fps } }]
        : [],
    );
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${publicUrl()}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (_req, res) => {
    const base = publicUrl();
    const today = new Date().toISOString().slice(0, 10);
    const urls = [{ loc: `${base}/`, pr: '1.0' }, ...ALL_PAGES.map((p) => ({ loc: `${base}/${p.slug}`, pr: '0.8' })), { loc: `${base}/privacy`, pr: '0.2' }];
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u.pr}</priority></url>`)
        .join('\n')}\n</urlset>\n`,
    );
  });

  for (const p of ALL_PAGES) {
    app.get(`/${p.slug}`, (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.type('html').send(pageHtml(p));
    });
  }
}
