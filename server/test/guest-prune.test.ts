import { beforeAll, describe, expect, it } from 'vitest';

// In-memory database: must be set before db.ts is imported.
process.env.DB_PATH = ':memory:';
let dbm: typeof import('../src/db');
beforeAll(async () => {
  dbm = await import('../src/db');
});

describe('idle guest cleanup', () => {
  it('removes guests that never played, and nobody else', () => {
    const idle = dbm.createUser('Guest-90001', 'tok-idle', { guest: true });
    const member = dbm.createUser('member1', 'tok-member', { passHash: 'x' });
    // A cutoff before they were created keeps everyone…
    expect(dbm.pruneIdleGuests(Date.now() - 60_000)).toBe(0);
    // …a later cutoff removes only the idle guest (and its ratings, by cascade).
    expect(dbm.pruneIdleGuests(Date.now() + 1000)).toBe(1);
    expect(dbm.getUserById(idle.id)).toBeUndefined();
    expect(dbm.getUserById(member.id)).toBeTruthy();
  });
});
