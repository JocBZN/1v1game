/**
 * Tell IndexNow search engines (Bing, Yandex, Seznam, Naver…) that every page in the live sitemap changed.
 * Run after a deploy that changes content:  npm run indexnow -w server  [-- https://1v1game.net]
 */
import { INDEXNOW_KEY } from '../src/seo';

const base = (process.argv[2] ?? process.env.PUBLIC_URL ?? 'https://1v1game.net').replace(/\/+$/, '');
const host = new URL(base).host;

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).host === host);
if (!urlList.length) throw new Error('no URLs found in the sitemap');

const keyCheck = await fetch(`${base}/${INDEXNOW_KEY}.txt`);
if ((await keyCheck.text()).trim() !== INDEXNOW_KEY) throw new Error('the key file is not live yet: deploy first');

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs`);
if (res.status >= 400) console.log(await res.text());
