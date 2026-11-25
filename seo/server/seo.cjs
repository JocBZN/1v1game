// SEO middleware for an Express server (Node). Works from CommonJS (require) and ESM (import).
//
//   const { seoBefore, seoStatic, seoNotFound } = require('./seo/seo.cjs');
//   app.set('trust proxy', true);          // Railway sits behind a proxy
//   app.use(seoBefore());                  // 1. canonical host + https redirects   (FIRST middleware)
//   app.use(seoStatic(path.join(__dirname, 'seo/public')));   // 2. quiz pages, sitemap, robots...
//   ...your existing static/build + API + socket.io setup...
//   app.get('*', seoNotFound({ indexHtml: path.join(__dirname, 'dist/index.html'), spaRoutes: ['/', '/play', '/room/*'] }));  // LAST
//
'use strict';
const path = require('path');
const fs = require('fs');

const CANONICAL_HOST = process.env.CANONICAL_HOST || '1v1game.net';

// 301: http -> https, www / *.up.railway.app -> 1v1game.net. One hop, path + query preserved.
function seoBefore({ host = CANONICAL_HOST } = {}) {
  return function (req, res, next) {
    const reqHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0].toLowerCase();
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
    // never redirect local dev, Railway health checks/internal traffic, or websocket/socket.io traffic
    if (!reqHost || reqHost === 'localhost' || reqHost === '127.0.0.1' || reqHost.endsWith('.railway.internal') ||
        reqHost === 'healthcheck.railway.app' || req.path.startsWith('/socket.io') || req.headers.upgrade) return next();
    if (reqHost !== host || proto !== 'https') {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    // Security/SEO-friendly headers
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  };
}

// Serves the generated folder. Directories redirect to the trailing-slash URL (matches canonicals).
function seoStatic(dir) {
  const express = require('express');
  return express.static(dir, {
    index: 'index.html',
    redirect: true,
    setHeaders(res, file) {
      if (file.endsWith('.html')) res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
      else if (/\.(png|jpg|webp|svg|ico)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=604800');
      else if (/\.(xml|txt|webmanifest)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=3600');
    },
  });
}

// Replaces the classic `app.get('*', send index.html)` that answers 200 for EVERY url (= "soft 404"
// in Search Console). Known SPA routes get the app; anything else gets the app with a real 404 status
// + noindex, so Google drops junk URLs but users still see the game.
function seoNotFound({ indexHtml, spaRoutes = ['/'] }) {
  const patterns = spaRoutes.map((r) => new RegExp('^' + r.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '/?$'));
  let html = null;
  return function (req, res) {
    if (html === null) html = fs.readFileSync(indexHtml, 'utf8');
    const known = patterns.some((p) => p.test(req.path));
    if (known) return res.status(200).type('html').send(html);
    res.status(404).set('X-Robots-Tag', 'noindex').type('html').send(html);
  };
}

module.exports = { seoBefore, seoStatic, seoNotFound };
