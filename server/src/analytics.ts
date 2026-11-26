/**
 * PostHog, server side. Turned on by the POSTHOG_KEY env var (the project API key, "phc_…").
 *
 *  - capture(): game events sent from the server (duel started/finished, rounds, rating changes…).
 *    They can't be blocked by ad blockers and are the source of truth for game numbers.
 * *distinct_id is "1v1game:<user id>", the same id the browser uses in posthog.identify(), so server and
 *    browser events land on the same person. A guest who signs up keeps their id.
 *  - mountPosthogProxy(): /ingest/* is forwarded to PostHog, so the browser SDK talks to our own
 *    domain (ad blockers drop requests to *.posthog.com, losing ~20–40 % of events).
 */
import express from 'express';

const key = () => process.env.POSTHOG_KEY || null;
/** API host: https://eu.i.posthog.com (EU cloud, default) or https://us.i.posthog.com. */
export const posthogHost = () => (process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/+$/, '');
const assetsHost = () =>
  (process.env.POSTHOG_ASSETS_HOST || (posthogHost().includes('://us.') ? 'https://us-assets.i.posthog.com' : 'https://eu-assets.i.posthog.com')).replace(/\/+$/, '');
/** Where the PostHog app lives (links in the toolbar, etc.). */
export const posthogUiHost = () => (posthogHost().includes('://us.') ? 'https://us.posthog.com' : 'https://eu.posthog.com');

export const posthogEnabled = () => !!key();

/**
 * The PostHog project can be shared with other sites: every event carries `app` (filter on it) and
 * person ids are prefixed, so player 7 here is never merged with user 7 of another site.
 */
export const APP = process.env.POSTHOG_APP || '1v1game';
export const personId = (userId: number | string) => `${APP}:${userId}`;

type Props = Record<string, unknown>;
interface QueuedEvent {
  event: string;
  distinct_id: string;
  properties: Props;
  timestamp: string;
}

let queue: QueuedEvent[] = [];
let timer: NodeJS.Timeout | null = null;
const MAX_BATCH = 100;
const FLUSH_MS = 5_000;

/** Queue an event; sent in batches every few seconds. No-op when PostHog isn't configured. */
export function capture(distinctId: number | string, event: string, properties: Props = {}) {
  if (!key()) return;
  const clean = Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== undefined));
  queue.push({
    event,
    distinct_id: personId(distinctId),
    properties: { ...clean, app: APP, $lib: 'duel-server', source: 'server' },
    timestamp: new Date().toISOString(),
  });
  if (queue.length >= MAX_BATCH) void flush();
  else if (!timer) {
    timer = setTimeout(() => void flush(), FLUSH_MS);
    timer.unref();
  }
}

export async function flush(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  const k = key();
  if (!k || !queue.length) return;
  const batch = queue;
  queue = [];
  try {
    const res = await fetch(`${posthogHost()}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: k, batch }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.warn(`[posthog] batch rejected: HTTP ${res.status}`);
  } catch (e) {
    console.warn('[posthog] batch failed', (e as Error).message);
  }
}

/** Reverse proxy for the browser SDK: /ingest/static/* → assets host, /ingest/* → API host. */
export function mountPosthogProxy(app: express.Express) {
  const router = express.Router();
  router.use(express.raw({ type: () => true, limit: '20mb' }));
  router.all('/{*rest}', async (req, res) => {
    if (!key()) return res.status(404).end();
    const upstream = req.path.startsWith('/static/') ? assetsHost() : posthogHost();
    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    const headers: Record<string, string> = {};
    for (const h of ['content-type', 'content-encoding', 'accept', 'user-agent', 'accept-language']) {
      const v = req.headers[h];
      if (typeof v === 'string') headers[h] = v;
    }
    // PostHog uses the client IP for country/city; it would otherwise see ours.
    if (req.ip) headers['x-forwarded-for'] = req.ip;
    try {
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0;
      const r = await fetch(`${upstream}${req.path}${qs}`, {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
        signal: AbortSignal.timeout(20_000),
      });
      res.status(r.status);
      const ct = r.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);
      const cc = r.headers.get('cache-control');
      if (cc) res.setHeader('Cache-Control', cc);
      // fetch() already decompressed the body, so content-encoding is not passed on.
      res.send(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      console.warn('[posthog] proxy failed', (e as Error).message);
      if (!res.headersSent) res.status(502).end();
    }
  });
  app.use('/ingest', router);
}
