/**
 * Private stats dashboard at /admin (HTTP Basic auth, any username, password = ADMIN_TOKEN).
 * Disabled (404) when ADMIN_TOKEN is not set. JSON version at /admin/stats.json.
 */
import crypto from 'node:crypto';
import type express from 'express';
import { db } from './db';
import { onlineCount } from './socket';

const DAY = 86_400_000;
const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

function q<T>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}
function one<T>(sql: string, ...params: unknown[]): T {
  return db.prepare(sql).get(...params) as T;
}

export function computeStats(now = Date.now()) {
  const since30 = now - 30 * DAY;

  const totals = one<{ users: number; registered: number; guests: number; duels: number; rounds: number }>(`
    SELECT (SELECT COUNT(*) FROM users) AS users,
           (SELECT COUNT(*) FROM users WHERE is_guest = 0) AS registered,
           (SELECT COUNT(*) FROM users WHERE is_guest = 1) AS guests,
           (SELECT COUNT(*) FROM duels) AS duels,
           (SELECT COUNT(*) FROM round_recordings) AS rounds`);

  // Opponent mix: what each human played against.
  const mix = q<{ kind: string; n: number }>(`
    SELECT o.kind AS kind, COUNT(*) AS n
    FROM duel_players me JOIN duel_players o ON o.duel_id = me.duel_id AND o.slot <> me.slot
    WHERE me.kind = 'human'
    GROUP BY o.kind`);

  const forfeits = one<{ n: number }>('SELECT COUNT(*) AS n FROM duels WHERE forfeit = 1').n;

  const activeSince = (ts: number) =>
    one<{ n: number }>(
      `SELECT COUNT(DISTINCT p.user_id) AS n FROM duel_players p JOIN duels d ON d.id = p.duel_id
       WHERE p.kind = 'human' AND d.created_at >= ?`,
      ts,
    ).n;

  // Per day, last 30 days.
  const days: Record<string, { signups: number; duels: number; active: number }> = {};
  for (let t = now - 29 * DAY; t <= now; t += DAY) days[dayKey(t)] = { signups: 0, duels: 0, active: 0 };
  for (const r of q<{ created_at: number }>('SELECT created_at FROM users WHERE created_at >= ?', since30)) {
    const k = dayKey(r.created_at);
    if (days[k]) days[k].signups++;
  }
  for (const r of q<{ created_at: number }>('SELECT created_at FROM duels WHERE created_at >= ?', since30)) {
    const k = dayKey(r.created_at);
    if (days[k]) days[k].duels++;
  }
  const activePairs = q<{ user_id: number; created_at: number }>(
    `SELECT p.user_id, d.created_at FROM duel_players p JOIN duels d ON d.id = p.duel_id
     WHERE p.kind = 'human' AND d.created_at >= ?`,
    since30,
  );
  const activeByDay = new Map<string, Set<number>>();
  for (const r of activePairs) {
    const k = dayKey(r.created_at);
    if (!activeByDay.has(k)) activeByDay.set(k, new Set());
    activeByDay.get(k)!.add(r.user_id);
  }
  for (const [k, s] of activeByDay) if (days[k]) days[k].active = s.size;

  // Topic popularity (rounds actually played).
  const topics = q<{ domain: string; n: number }>(
    `SELECT value AS domain, COUNT(*) AS n FROM duels, json_each(duels.domains) GROUP BY value ORDER BY n DESC`,
  );

  // Retention: of players who signed up at least N days ago, how many played again N+ days after signing up.
  const retention = (n: number) => {
    const r = one<{ cohort: number; back: number }>(
      `SELECT COUNT(*) AS cohort,
              SUM(EXISTS (SELECT 1 FROM duel_players p JOIN duels d ON d.id = p.duel_id
                          WHERE p.user_id = u.id AND d.created_at >= u.created_at + ?)) AS back
       FROM users u WHERE u.created_at <= ?`,
      n * DAY,
      now - n * DAY,
    );
    return { cohort: r.cohort, returned: r.back ?? 0, pct: r.cohort ? Math.round((100 * (r.back ?? 0)) / r.cohort) : null };
  };

  // Signed up but never finished a duel (onboarding drop-off).
  const neverPlayed = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM users u WHERE NOT EXISTS (SELECT 1 FROM duel_players p WHERE p.user_id = u.id)`,
  ).n;

  const avgDuels = one<{ v: number | null }>(
    `SELECT AVG(c) AS v FROM (SELECT COUNT(*) AS c FROM duel_players WHERE kind = 'human' GROUP BY user_id)`,
  ).v;

  return {
    generatedAt: new Date(now).toISOString(),
    online: onlineCount(),
    totals: { ...totals, forfeits, neverPlayed, avgDuelsPerPlayer: avgDuels ? Math.round(avgDuels * 10) / 10 : 0 },
    active: { dau: activeSince(now - DAY), wau: activeSince(now - 7 * DAY), mau: activeSince(now - 30 * DAY) },
    retention: { d1: retention(1), d7: retention(7), d30: retention(30) },
    opponents: Object.fromEntries(mix.map((m) => [m.kind, m.n])),
    topics: Object.fromEntries(topics.map((t) => [t.domain, t.n])),
    days: Object.entries(days).map(([day, v]) => ({ day, ...v })),
  };
}

function authorized(req: express.Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const h = req.headers.authorization ?? '';
  if (!h.startsWith('Basic ')) return false;
  const pass = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':').slice(1).join(':');
  const a = crypto.createHash('sha256').update(pass).digest();
  const b = crypto.createHash('sha256').update(token).digest();
  return crypto.timingSafeEqual(a, b);
}

function guard(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!process.env.ADMIN_TOKEN) return res.status(404).send('Not found');
  if (!authorized(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Duel admin", charset="UTF-8"');
    return res.status(401).send('Authentication required');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  next();
}

function bars(rows: { day: string; v: number }[], color: string): string {
  const max = Math.max(1, ...rows.map((r) => r.v));
  const w = 600;
  const h = 120;
  const bw = w / rows.length;
  return `<svg viewBox="0 0 ${w} ${h + 18}" width="100%" role="img">${rows
    .map((r, i) => {
      const bh = Math.round((r.v / max) * h);
      return `<rect x="${i * bw + 2}" y="${h - bh}" width="${bw - 4}" height="${bh}" rx="3" fill="${color}"><title>${r.day}: ${r.v}</title></rect>`;
    })
    .join('')}<text x="0" y="${h + 14}" font-size="11" fill="#8a6e52">${rows[0]?.day ?? ''}</text><text x="${w}" y="${h + 14}" font-size="11" fill="#8a6e52" text-anchor="end">${rows.at(-1)?.day ?? ''}</text></svg>`;
}

function page(s: ReturnType<typeof computeStats>): string {
  const tile = (label: string, value: string | number, sub = '') =>
    `<div class="t"><div class="l">${label}</div><div class="v">${value}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
  const pct = (r: { pct: number | null; returned: number; cohort: number }) => (r.pct === null ? '—' : `${r.pct}%`);
  const opp = s.opponents as Record<string, number>;
  const oppTotal = Object.values(opp).reduce((a, b) => a + b, 0) || 1;
  const topicMax = Math.max(1, ...Object.values(s.topics as Record<string, number>));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Duel · stats</title>
<style>body{margin:0;background:#fff1d1;color:#2b1b12;font:15px/1.5 Inter,system-ui,sans-serif}main{max-width:900px;margin:0 auto;padding:24px 20px 48px}
h1{font-size:24px;letter-spacing:-.02em;margin:0}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#8a6e52;margin:28px 0 10px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.t,.c{background:#fff8e8;border:1px solid #ecd6a8;border-radius:16px;padding:14px}
.l{font-size:12px;color:#8a6e52}.v{font-size:28px;font-weight:700;letter-spacing:-.02em}.s{font-size:12px;color:#8a6e52}
.row{display:flex;align-items:center;gap:10px;margin:6px 0}.row span:first-child{width:110px}.bar{height:8px;border-radius:4px;background:#00b7cd}
.muted{color:#8a6e52;font-size:13px}</style></head><body><main>
<h1>Duel · stats</h1><div class="muted">Generated ${s.generatedAt} · refresh the page to update</div>
<h2>Right now</h2><div class="g">${tile('Online players', s.online)}${tile('Active today', s.active.dau)}${tile('Active 7 days', s.active.wau)}${tile('Active 30 days', s.active.mau)}</div>
<h2>Totals</h2><div class="g">${tile('Players', s.totals.users)}${tile('Accounts', s.totals.registered, `${s.totals.users ? Math.round((100 * s.totals.registered) / s.totals.users) : 0}% of players signed up`)}${tile('Guests', s.totals.guests)}${tile('Duels', s.totals.duels)}${tile('Rounds recorded', s.totals.rounds)}${tile('Duels per player', s.totals.avgDuelsPerPlayer)}${tile('Never played', s.totals.neverPlayed, 'signed up, no duel')}${tile('Forfeits', s.totals.forfeits)}</div>
<h2>Retention</h2><div class="g">${tile('Day 1', pct(s.retention.d1), `${s.retention.d1.returned} of ${s.retention.d1.cohort}`)}${tile('Day 7', pct(s.retention.d7), `${s.retention.d7.returned} of ${s.retention.d7.cohort}`)}${tile('Day 30', pct(s.retention.d30), `${s.retention.d30.returned} of ${s.retention.d30.cohort}`)}</div>
<h2>New players per day</h2><div class="c">${bars(s.days.map((d) => ({ day: d.day, v: d.signups })), '#df301c')}</div>
<h2>Active players per day</h2><div class="c">${bars(s.days.map((d) => ({ day: d.day, v: d.active })), '#00b7cd')}</div>
<h2>Duels per day</h2><div class="c">${bars(s.days.map((d) => ({ day: d.day, v: d.duels })), '#ff9100')}</div>
<h2>Opponents</h2><div class="c">${['human', 'ghost', 'bot']
    .map((k) => `<div class="row"><span>${k}</span><div class="bar" style="width:${Math.round(((opp[k] ?? 0) / oppTotal) * 60)}%"></div><span class="muted">${opp[k] ?? 0}</span></div>`)
    .join('')}</div>
<h2>Topics played</h2><div class="c">${Object.entries(s.topics as Record<string, number>)
    .map(([k, n]) => `<div class="row"><span>${k}</span><div class="bar" style="width:${Math.round((n / topicMax) * 60)}%;background:#ff9100"></div><span class="muted">${n}</span></div>`)
    .join('')}</div>
<p class="muted">Raw data: <a href="/admin/stats.json">/admin/stats.json</a></p>
</main></body></html>`;
}

export function mountAdmin(app: express.Express) {
  app.get('/admin', guard, (_req, res) => res.type('html').send(page(computeStats())));
  app.get('/admin/stats.json', guard, (_req, res) => res.json(computeStats()));
}
