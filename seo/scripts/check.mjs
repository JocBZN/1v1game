// Validates the generated site: broken internal links, title/description lengths, duplicate titles,
// JSON-LD syntax, hreflang reciprocity, canonical/self consistency.  node scripts/check.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const ORIGIN = 'https://1v1game.net';
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? (f !== 'embed' && walk(p)) : p.endsWith('.html') && files.push(p); } })(OUT); // embed/ = noindex iframe pages

const urlOf = (f) => '/' + relative(OUT, f).split(sep).join('/').replace(/index\.html$/, '');
const LIVE = new Set(['/', '/quiz', '/quiz/geography', '/quiz/history', '/quiz/science', '/quiz/sports', '/quiz/movies-music', '/flag-quiz', '/chess-puzzles', '/mental-math', '/rubiks-cube', '/trivia', '/how-to-play', '/flag-quiz/europe', '/flag-quiz/asia', '/flag-quiz/africa', '/flag-quiz/oceania', '/quiz/general-knowledge', '/quiz/football', '/quiz/tv-shows', '/quiz/medical', '/quiz/math', '/quiz/technology', '/quiz/beauty', '/quiz/celebrities']);
const exists = (u) => LIVE.has(u) || existsSync(join(OUT, u.replace(/^\//, ''), u.endsWith('/') ? 'index.html' : '')) ;
const problems = []; const titles = new Map(); const hreflangMap = new Map();
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

for (const f of files) {
  const h = readFileSync(f, 'utf8'); const url = urlOf(f);
  const title = decode((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  const desc = decode((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!title) problems.push(`${url}: missing title`);
  if (title.length > 70) problems.push(`${url}: title ${title.length} chars (may truncate): ${title}`);
  if (desc.length < 70 || desc.length > 170) problems.push(`${url}: description ${desc.length} chars`);
  if (canon !== ORIGIN + url) problems.push(`${url}: canonical ${canon}`);
  if ((h.match(/<h1[ >]/g) || []).length !== 1) problems.push(`${url}: h1 count != 1`);
  titles.set(title, [...(titles.get(title) || []), url]);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { problems.push(`${url}: bad JSON-LD ${e.message}`); } }
  for (const m of h.matchAll(/href="(\/[^"#?]*)/g)) if (!/^\/(favicon|apple-touch|manifest|og\.png)/.test(m[1]) && !exists(m[1])) problems.push(`${url}: broken link ${m[1]}`);
  hreflangMap.set(ORIGIN + url, [...h.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
}
for (const [t, us] of titles) if (us.length > 1) problems.push(`duplicate title on ${us.join(', ')}: ${t}`);
for (const [page, alts] of hreflangMap) for (const [lang, href] of alts) {
  if (lang === 'x-default' || LIVE.has(href.replace(ORIGIN, ''))) continue;
  const back = hreflangMap.get(href);
  if (!back) problems.push(`${page}: hreflang ${lang} -> ${href} not generated`);
  else if (!back.some(([, h]) => h === page) && page !== ORIGIN + '/') problems.push(`${href} does not link back to ${page}`);
}
console.log(`${files.length} pages checked.`);
console.log(problems.length ? problems.join('\n') : 'No problems found.');
process.exitCode = problems.length ? 1 : 0;

