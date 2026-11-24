import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import cors from 'cors';
import { mountAdmin } from './admin';
import { createApi } from './api';
import { db } from './db';
import { SERVER_ROOT } from './paths';
import { makeIndexRenderer, mountSeo } from './seo';
import { attachSockets } from './socket';

const PORT = Number(process.env.PORT ?? 3001);
/** Built client (`npm run build`). In production the server hosts it, so everything is on one origin. */
const CLIENT_DIST = process.env.CLIENT_DIST ?? path.resolve(SERVER_ROOT, '..', 'client', 'dist');

const app = express();
// Behind the host's proxy: use X-Forwarded-For for the client IP (rate limits).
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', createApi());
mountAdmin(app);
mountSeo(app);

if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  const renderIndex = makeIndexRenderer(CLIENT_DIST);
  const sendIndex = (_req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.type('html').send(renderIndex());
  };
  app.get('/', sendIndex);
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

// Hosts stop the old instance with SIGTERM on every deploy: close cleanly so SQLite is checkpointed.
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.once(sig, () => {
    console.log(`[duel] ${sig}, shutting down`);
    server.close();
    db.close();
    process.exit(0);
  });
}
