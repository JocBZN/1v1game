import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import cors from 'cors';
import { mountAdmin } from './admin';
import { createApi } from './api';
import { db } from './db';
import { SERVER_ROOT } from './paths';
import { contentSecurityPolicy, mountSecurity } from './security';
import { makeIndexRenderer, mountSeo } from './seo';
import { mountQuizPages, quizPaths } from './seo-quiz';
import { mountSeoPack } from './seo-pack';
import { pruneIdleGuests } from './db';
import { normalizeCode } from './rooms';
import { attachSockets } from './socket';

const PORT = Number(process.env.PORT ?? 3001);
/** Built client (`npm run build`). In production the server hosts it, so everything is on one origin. */
const CLIENT_DIST = process.env.CLIENT_DIST ?? path.resolve(SERVER_ROOT, '..', 'client', 'dist');

const app = express();
// Behind the host's proxy: use X-Forwarded-For for the client IP (rate limits).
app.set('trust proxy', 1);
app.disable('x-powered-by');
mountSecurity(app);
// Same-origin app: no cross-origin API access needed in production.
if (process.env.NODE_ENV !== 'production') app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', createApi());
mountAdmin(app);
// Generated multilingual pages first: they own /es/, /quiz/space/, /flag-quiz/north-america/ …
// The mental math game was retired: send old links and search traffic to the games hub.
app.get(['/mental-math', '/mental-math/'], (_req, res) => res.redirect(301, '/1v1-games'));
mountSeoPack(app);
mountQuizPages(app);
mountSeo(app, quizPaths);

if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  const renderIndex = makeIndexRenderer(CLIENT_DIST);
  const sendIndex = (_req: express.Request, res: express.Response) => {
    const { html, inlineScriptHash } = renderIndex();
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Security-Policy', contentSecurityPolicy([inlineScriptHash]));
    res.type('html').send(html);
  };
  app.get('/', sendIndex);
  // Private room links (/c/K7QX2): the app opens the room; never indexed, but with a link preview.
  app.get('/c/:code', (req, res) => {
    const code = normalizeCode(req.params.code);
    if (!code) return res.redirect(302, '/');
    const { html, inlineScriptHash } = renderIndex();
    const title = `Join my 1v1 duel · room ${code}`;
    const desc = 'Your friend challenged you to a 1v1 quiz duel: 3 rounds, best of three. Free in the browser, no sign-up.';
    const page = html
      .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex, nofollow" />')
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`)
      .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${desc}`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Content-Security-Policy', contentSecurityPolicy([inlineScriptHash]));
    res.type('html').send(page);
  });
  // Hashed assets can be cached forever; the rest (icons, manifest, service worker) briefly.
  app.use('/assets', express.static(path.join(CLIENT_DIST, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(
    express.static(CLIENT_DIST, {
      index: false,
      maxAge: '1h',
      setHeaders: (res, file) => {
        if (file.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
  // Anything else that isn't a file or an API route gets the app (it uses #hash routes).
  app.get('/{*page}', (req, res) => {
    if (path.extname(req.path)) return res.status(404).send('Not found');
    sendIndex(req, res);
  });
  console.log(`[duel] serving client from ${CLIENT_DIST}`);
}

const server = http.createServer(app);
attachSockets(server);

server.listen(PORT, () => {
  console.log(`[duel] server on http://localhost:${PORT}`);
});

// Every visit without a token (crawlers included, now that robots.txt allows /api/guest) creates a
// guest. Guests that never played anything are removed after two days.
const GUEST_TTL_MS = 2 * 24 * 3600 * 1000;
const prune = () => {
  const n = pruneIdleGuests(Date.now() - GUEST_TTL_MS);
  if (n) console.log(`[duel] removed ${n} idle guest accounts`);
};
prune();
setInterval(prune, 6 * 3600 * 1000).unref();

// Hosts stop the old instance with SIGTERM on every deploy: close cleanly so SQLite is checkpointed.
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.once(sig, () => {
    console.log(`[duel] ${sig}, shutting down`);
    server.close();
    db.close();
    process.exit(0);
  });
}
