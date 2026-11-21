import { beforeAll, describe, expect, it } from 'vitest';

// In-memory database: must be set before db.ts is imported.
process.env.DB_PATH = ':memory:';
let dbm: typeof import('../src/db');

const rec = (userId: number, key: string) => ({
  user_id: userId,
  domain: 'flags' as const,
  content_key: key,
  content: '{"items":[]}',
  events: '[]',
  score: 1000,
  duration_ms: 50_000,
  rating: 1500,
  rd: 200,
  general_rating: 1500,
  general_rd: 200,
  created_at: Date.now(),
});

describe('ghost recordings and content versions', () => {
  let a: number;
  let b: number;
  beforeAll(async () => {
    dbm = await import('../src/db');
    a = dbm.createUser('ghostA', 'tok-a').id;
    b = dbm.createUser('viewerB', 'tok-b').id;
  });

  it('ignores rounds recorded with an older content version (e.g. the Romanian-era data)', () => {
    dbm.db
      .prepare(
        `INSERT INTO round_recordings (user_id, domain, content_key, content, events, score, duration_ms, rating, rd, general_rating, general_rd, created_at, content_version)
         VALUES (@user_id, @domain, @content_key, @content, @events, @score, @duration_ms, @rating, @rd, @general_rating, @general_rd, @created_at, 1)`,
      )
      .run(rec(a, 'old'));
    expect(dbm.getGhostCandidates(b)).toHaveLength(0);
    expect(dbm.getGhostRecordings(a, 'flags', b)).toHaveLength(0);
  });

  it('replays rounds recorded with the current version', () => {
    dbm.saveRecording(rec(a, 'new'));
    expect(dbm.getGhostCandidates(b).map((c) => c.user_id)).toEqual([a]);
    expect(dbm.getGhostRecordings(a, 'flags', b).map((r) => r.content_key)).toEqual(['new']);
  });
});
