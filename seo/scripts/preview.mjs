// Zero-dependency local preview of public/ :  node scripts/preview.mjs  ->  http://localhost:4173/quiz/
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml','.webmanifest': 'application/manifest+json' };
const PORT = process.env.PORT || 4173;

createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  if (p === '' || p === '.') { res.writeHead(302, { Location: '/ro/' }); return res.end(); }
  let f = join(OUT, p);
  try {
    if ((await stat(f)).isDirectory()) {
      if (!req.url.endsWith('/')) { res.writeHead(301, { Location: req.url + '/' }); return res.end(); }
      f = join(f, 'index.html');
    }
    const data = await readFile(f);
    res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); }
}).listen(PORT, () => console.log(`Preview on http://localhost:${PORT}/ro/  (English pages that already exist on the live site are not here)`));
