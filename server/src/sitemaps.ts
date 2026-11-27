/**
 * Extra sitemaps on top of sitemap.xml (English game pages) and sitemap-i18n.xml (generated pack):
 * - sitemap-images.xml: every flag image on the flag quiz pages, in all languages (Google Images
 *   is a big source of "flag of …" searches);
 * - sitemap_index.xml: one entry point listing all of them.
 */
import fs from 'node:fs';
import path from 'node:path';
import type express from 'express';
import { PACK_PUBLIC, hasPack } from './seo-pack';

export const SITEMAPS = ['sitemap.xml', 'sitemap-i18n.xml', 'sitemap-images.xml'] as const;

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const htmlUnesc = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export interface PageImages {
  path: string;
  images: { src: string; title: string }[];
}

/** Flag images (with their alt text) used on one page, once each. */
export function flagImagesIn(html: string): { src: string; title: string }[] {
  const out = new Map<string, string>();
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    const src = tag.match(/\bsrc="(\/flags\/[a-z-]+\.svg)"/)?.[1];
    if (!src || out.has(src)) continue;
    out.set(src, htmlUnesc(tag.match(/\balt="([^"]*)"/)?.[1] ?? ''));
  }
  return [...out].map(([src, title]) => ({ src, title }));
}

/** Pages of the generated pack (every index.html under seo/public) that show flags. */
function packPages(): PageImages[] {
  if (!hasPack()) return [];
  const out: PageImages[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'embed' && e.name !== 'flags') walk(full);
      } else if (e.name === 'index.html') {
        const images = flagImagesIn(fs.readFileSync(full, 'utf8'));
        const rel = path.relative(PACK_PUBLIC, dir).split(path.sep).join('/');
        if (images.length) out.push({ path: rel ? `/${rel}/` : '/', images });
      }
    }
  };
  walk(PACK_PUBLIC);
  return out;
}

/**
 * Every page with flag images. `serverPages` renders the server's own pages (e.g. /flag-quiz/europe)
 * so the sitemap always matches what is served.
 */
export function imagePages(serverPages: () => { path: string; html: string | null }[]): PageImages[] {
  const own = serverPages()
    .filter((p): p is { path: string; html: string } => !!p.html)
    .map((p) => ({ path: p.path, images: flagImagesIn(p.html) }))
    .filter((p) => p.images.length);
  const seen = new Set(own.map((p) => p.path));
  return [...own, ...packPages().filter((p) => !seen.has(p.path))].sort((a, b) => a.path.localeCompare(b.path));
}

export function imageSitemapXml(base: string, pages: PageImages[]): string {
  const urls = pages.map((p) =>
    `  <url>\n    <loc>${xmlEsc(base + p.path)}</loc>\n${p.images
      .map((i) => `    <image:image><image:loc>${xmlEsc(base + i.src)}</image:loc>${i.title ? `<image:title>${xmlEsc(i.title)}</image:title>` : ''}</image:image>`)
      .join('\n')}\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
}

export function sitemapIndexXml(base: string, lastmod: string): string {
  const names = SITEMAPS.filter((n) => n !== 'sitemap-i18n.xml' || hasPack());
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${names
    .map((n) => `  <sitemap><loc>${base}/${n}</loc><lastmod>${lastmod}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>\n`;
}

export function mountSitemaps(
  app: express.Express,
  opts: { base: () => string; lastmod: string; serverPages: () => { path: string; html: string | null }[] },
) {
  let images: PageImages[] | null = null; // content only changes with a deploy
  app.get('/sitemap-images.xml', (_req, res) => {
    images ??= imagePages(opts.serverPages);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('application/xml').send(imageSitemapXml(opts.base(), images));
  });
  app.get('/sitemap_index.xml', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('application/xml').send(sitemapIndexXml(opts.base(), opts.lastmod));
  });
}
