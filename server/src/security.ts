/**
 * HTTP hardening for production:
 *  - one canonical host (e.g. www.1v1game.net and the *.up.railway.app address → https://1v1game.net)
 *  - HTTPS only (redirect + HSTS)
 *  - security headers, including a Content-Security-Policy that allows exactly what the app loads
 */
import crypto from 'node:crypto';
import type express from 'express';
import { clientConfig, publicUrl } from './seo';

const isProd = () => process.env.NODE_ENV === 'production';

function canonical(): URL | null {
  try {
    const u = new URL(publicUrl());
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? null : u;
  } catch {
    return null;
  }
}

/** sha256 CSP source for an inline script body. */
export const scriptHash = (body: string) => `'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`;

/** Origins of the analytics tools that are configured (only those get allowed). */
function analyticsOrigins() {
  const cfg = clientConfig();
  const script: string[] = [];
  const connect: string[] = [];
  const img: string[] = [];
  if (cfg.ga4) {
    script.push('https://www.googletagmanager.com');
    connect.push('https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com');
    img.push('https://*.google-analytics.com', 'https://www.googletagmanager.com');
  }
  if (cfg.clarity) {
    script.push('https://www.clarity.ms', 'https://*.clarity.ms');
    connect.push('https://*.clarity.ms', 'https://c.bing.com');
    img.push('https://*.clarity.ms', 'https://c.bing.com');
  }
  if (cfg.umami) {
    try {
      const o = new URL(cfg.umami.src).origin;
      script.push(o);
      connect.push(o, 'https://api-gateway.umami.dev');
    } catch {
      /* ignore bad UMAMI_SRC */
    }
  }
  return { script, connect, img };
}

export function contentSecurityPolicy(inlineScriptHashes: string[] = []): string {
  const a = analyticsOrigins();
  const self = "'self'";
  return [
    `default-src ${self}`,
    `script-src ${[self, ...inlineScriptHashes, ...a.script].join(' ')}`,
    // Inline styles are used by React (style={…}) and the static pages.
    `style-src ${self} 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src ${self} https://fonts.gstatic.com data:`,
    `img-src ${[self, 'data:', 'blob:', ...a.img].join(' ')}`,
    `connect-src ${[self, 'wss:', ...a.connect].join(' ')}`,
    `worker-src ${self}`,
    `manifest-src ${self}`,
    "object-src 'none'",
    `base-uri ${self}`,
    `form-action ${self}`,
    "frame-ancestors 'none'",
    ...(canonical()?.protocol === 'https:' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function mountSecurity(app: express.Express) {
  app.use((req, res, next) => {
    // Railway's health check and the WebSocket upgrade path must never be redirected.
    if (req.path === '/health') return next();
    const target = canonical();
    if (isProd() && target) {
      const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? '';
      const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
      const wrongHost = host.split(':')[0].toLowerCase() !== target.hostname;
      const insecure = proto.split(',')[0].trim() !== 'https';
      if ((wrongHost || insecure) && !req.path.startsWith('/socket.io')) {
        return res.redirect(308, `${target.origin}${req.originalUrl}`);
      }
    }
    if (isProd()) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    // Default CSP for everything; the app page replaces it with one that also allows its inline config script.
    res.setHeader('Content-Security-Policy', contentSecurityPolicy());
    next();
  });
}
