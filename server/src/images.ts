/**
 * Picture proxy for games that show Wikimedia Commons photos (photo year, vehicles).
 * The browser only ever sees /api/photo/<opaque id>, never the Commons file name, which often
 * contains the answer (a year, a car model).
 *
 * Speed: pictures are 500 px Commons thumbnails, kept in memory (small LRU) and on disk. A round's
 * pictures are fetched as soon as the round is created (`prefetchImages`), and after start-up a slow
 * background pass fills the disk cache with every picture, so players rarely wait on Commons.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Request, Response } from 'express';

const urls = new Map<string, string>();
const ids = new Map<string, string>();
/** Lazy loaders of the games' data, so a cold server can still resolve ids. */
const loaders: (() => void)[] = [];

export function onImageLookup(load: () => void) {
  loaders.push(load);
}

const idOf = (url: string) => crypto.createHash('sha256').update(url).digest('base64url').slice(0, 16);

/** Registers a Commons thumbnail and returns the public path to it. */
export function imagePath(url: string): string {
  let id = ids.get(url);
  if (!id) {
    id = idOf(url);
    ids.set(url, id);
    urls.set(id, url);
  }
  return `/api/photo/${id}`;
}

const CACHE_DIR = path.join(os.tmpdir(), 'duel-photos');
const UA = '1v1game.net image cache/1.0 (https://1v1game.net; fetches each picture once, then serves it from disk)';
const inflight = new Map<string, Promise<Buffer | null>>();

/** Recently served pictures in memory (~60 KB each, so ~25 MB at most). */
const MEM_MAX = 400;
const mem = new Map<string, Buffer>();
function remember(id: string, buf: Buffer) {
  mem.delete(id);
  mem.set(id, buf);
  if (mem.size > MEM_MAX) mem.delete(mem.keys().next().value!);
}

/** Commons refuses a thumbnail wider than the original: fall back to the original file. */
function originalOf(thumb: string): string | null {
  const m = thumb.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/thumb\/(.+)\/[^/]+$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

let pausedUntil = 0;
async function fetchCommons(url: string): Promise<Buffer | null> {
  if (Date.now() < pausedUntil) return null;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.status === 429) {
    pausedUntil = Date.now() + 60_000; // Commons asks us to slow down
    return null;
  }
  if (!r.ok) {
    const orig = r.status >= 400 && r.status < 500 ? originalOf(url) : null;
    if (!orig) return null;
    const o = await fetch(orig, { headers: { 'User-Agent': UA } });
    return o.ok ? Buffer.from(await o.arrayBuffer()) : null;
  }
  return Buffer.from(await r.arrayBuffer());
}

const fileOf = (id: string) => path.join(CACHE_DIR, `${id}.img`);
const onDisk = (id: string) => fs.promises.access(fileOf(id)).then(() => true, () => false);

async function load(id: string, url: string): Promise<Buffer | null> {
  const hot = mem.get(id);
  if (hot) return hot;
  try {
    const buf = await fs.promises.readFile(fileOf(id));
    remember(id, buf);
    return buf;
  } catch {
    /* not cached yet */
  }
  const buf = await fetchCommons(url);
  if (!buf) return null;
  remember(id, buf);
  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
  await fs.promises.writeFile(fileOf(id), buf).catch(() => {});
  return buf;
}

function get(id: string, url = urls.get(id)): Promise<Buffer | null> {
  if (!url) return Promise.resolve(null);
  let p = inflight.get(id);
  if (!p) {
    p = load(id, url).catch(() => null).finally(() => inflight.delete(id));
    inflight.set(id, p);
  }
  return p;
}

/** Start fetching these pictures now (a round was just created), without waiting. */
export function prefetchImages(images: readonly string[]) {
  if (process.env.VITEST) return; // no network in tests
  for (const u of images) void get((u.startsWith('/api/photo/') ? u : imagePath(u)).slice('/api/photo/'.length));
}

/** After start-up: fill the disk cache with every picture, one at a time and slowly. */
export function warmImageCache({ delayMs = 1_500, startAfterMs = 20_000 } = {}) {
  const timer = setTimeout(async () => {
    for (const l of loaders) l();
    for (const id of [...urls.keys()]) {
      if (await onDisk(id)) continue;
      while (Date.now() < pausedUntil) await new Promise((r) => setTimeout(r, 5_000));
      await get(id);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }, startAfterMs);
  timer.unref?.();
}

/** GET /api/photo/:id */
export async function serveImage(req: Request, res: Response) {
  if (!urls.size) for (const l of loaders) l();
  const base = String(req.params.id);
  const small = urls.get(base);
  if (!small) return res.status(404).end();
  // ?size=large: the 960 px version, for the full-screen view.
  const large = req.query.size === 'large';
  const url = large ? small.replace(/\/(lossy-page1-)?500px-/, '/$1960px-') : small;
  const id = large ? `${base}-l` : base;
  const buf = await get(id, url);
  // Commons unreachable or throttling us: let the browser load it from Commons directly.
  if (!buf) return res.redirect(302, url);
  res.setHeader('Content-Type', buf[0] === 0x89 ? 'image/png' : 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(buf);
}
