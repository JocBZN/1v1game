/**
 * Picture proxy for games that show Wikimedia Commons photos (photo year, vehicles).
 * The browser only ever sees /api/photo/<opaque id>, never the Commons file name, which often
 * contains the answer (a year, a car model). Each picture is fetched once and kept in a disk cache.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Request, Response } from 'express';

const urls = new Map<string, string>();
/** Lazy loaders of the games' data, so a cold server can still resolve ids. */
const loaders: (() => void)[] = [];

export function onImageLookup(load: () => void) {
  loaders.push(load);
}

/** Registers a Commons thumbnail and returns the public path to it. */
export function imagePath(url: string): string {
  const id = crypto.createHash('sha256').update(url).digest('base64url').slice(0, 16);
  urls.set(id, url);
  return `/api/photo/${id}`;
}

const CACHE_DIR = path.join(os.tmpdir(), 'duel-photos');
const inflight = new Map<string, Promise<Buffer | null>>();

async function load(id: string, url: string): Promise<Buffer | null> {
  const file = path.join(CACHE_DIR, `${id}.img`);
  try {
    return await fs.promises.readFile(file);
  } catch {
    /* not cached yet */
  }
  const r = await fetch(url, { headers: { 'User-Agent': '1v1game.net image cache/1.0 (https://1v1game.net; fetches each picture once, then serves it from disk)' } });
  if (!r.ok) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
  await fs.promises.writeFile(file, buf).catch(() => {});
  return buf;
}

/** GET /api/photo/:id */
export async function serveImage(req: Request, res: Response) {
  if (!urls.size) for (const l of loaders) l();
  const id = String(req.params.id);
  const url = urls.get(id);
  if (!url) return res.status(404).end();
  let p = inflight.get(id);
  if (!p) {
    p = load(id, url).catch(() => null).finally(() => inflight.delete(id));
    inflight.set(id, p);
  }
  const buf = await p;
  // Commons unreachable or throttling us: let the browser load it from Commons directly.
  if (!buf) return res.redirect(302, url);
  res.setHeader('Content-Type', url.endsWith('.png') ? 'image/png' : 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(buf);
}
