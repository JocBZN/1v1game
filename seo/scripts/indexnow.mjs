// Pings IndexNow (Bing, Yandex, Seznam, Naver; Bing also powers ChatGPT/Copilot search) with every
// URL in public/sitemap-i18n.xml. Run AFTER deploying, so the key file is live at https://1v1game.net/<key>.txt
//   node scripts/indexnow.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const key = readFileSync(join(ROOT, 'data', 'indexnow-key.txt'), 'utf8').trim();
const xml = readFileSync(join(ROOT, 'public', 'sitemap-i18n.xml'), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const host = new URL(urlList[0]).host;

const keyCheck = await fetch(`https://${host}/${key}.txt`);
if (!keyCheck.ok) { console.error(`Key file not live yet (https://${host}/${key}.txt -> ${keyCheck.status}). Deploy first.`); process.exit(1); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs (200/202 = accepted)`);

