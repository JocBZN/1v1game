import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, ROOM_IDLE_MS, ROOM_LEAVE_AFTER_MS, Rooms, normalizeCode } from '../src/rooms';

function setup() {
  let t = 1_000;
  const events: { userId: number; event: string; data: any }[] = [];
  const duels: { hostId: number; guestId: number; end: (w: 0 | 1 | null) => void }[] = [];
  const rooms = new Rooms({
    emit: (userId, event, data) => events.push({ userId, event, data }),
    nameOf: (id) => `P${id}`,
    startDuel: (hostId, guestId, end) => duels.push({ hostId, guestId, end }),
    now: () => t,
  });
  const last = (userId: number, event: string) => [...events].reverse().find((e) => e.userId === userId && e.event === event)?.data;
  return { rooms, events, duels, last, advance: (ms: number) => (t += ms) };
}

describe('room codes', () => {
  it('normalizes typed codes and rejects bad ones', () => {
    expect(normalizeCode('k7qx2')).toBe('K7QX2');
    expect(normalizeCode(' k7-qx2 ')).toBe('K7QX2');
    expect(normalizeCode('K7QX')).toBeNull();
    expect(normalizeCode('K7QX0')).toBeNull(); // 0 is not in the alphabet
    expect(normalizeCode(42)).toBeNull();
  });

  it('creates 5-character codes from the unambiguous alphabet', () => {
    const { rooms } = setup();
    for (let i = 0; i < 50; i++) {
      const { code } = rooms.create(i + 1);
      expect(code).toHaveLength(5);
      for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
    }
    expect(rooms.size).toBe(50);
  });
});

describe('Rooms', () => {
  it('starts a duel when the friend joins and tracks the room score', () => {
    const { rooms, duels, last } = setup();
    const { code } = rooms.create(1);
    expect(last(1, 'room:state')).toMatchObject({ code, you: 'host', guest: null });

    expect(rooms.join(2, code.toLowerCase())).toMatchObject({ ok: true });
    expect(duels).toHaveLength(1);
    expect(duels[0]).toMatchObject({ hostId: 1, guestId: 2 });
    expect(last(2, 'room:state')).toMatchObject({ you: 'guest', inDuel: true, host: { name: 'P1' } });

    duels[0].end(1); // guest wins
    expect(last(1, 'room:state')).toMatchObject({ inDuel: false, duels: 1, score: [0, 1] });
    expect(last(2, 'room:state')).toMatchObject({ score: [1, 0] });
  });

  it('rematch starts only when both are ready', () => {
    const { rooms, duels, last } = setup();
    const { code } = rooms.create(1);
    rooms.join(2, code);
    duels[0].end(0);
    rooms.rematch(1);
    expect(duels).toHaveLength(1);
    expect(last(2, 'room:state').host.ready).toBe(true);
    rooms.rematch(2);
    expect(duels).toHaveLength(2);
  });

  it('rejects unknown and full rooms', () => {
    const { rooms } = setup();
    expect(rooms.join(2, 'ZZZZZ')).toEqual({ ok: false, error: 'not_found' });
    const { code } = rooms.create(1);
    rooms.join(2, code);
    expect(rooms.join(3, code)).toEqual({ ok: false, error: 'full' });
    // Opening your own link again is fine.
    expect(rooms.join(1, code)).toMatchObject({ ok: true });
  });

  it('when someone leaves, the other stays as host with the same code', () => {
    const { rooms, duels, last } = setup();
    const { code } = rooms.create(1);
    rooms.join(2, code);
    duels[0].end(null);
    rooms.leave(1);
    expect(last(1, 'room:closed')).toBeTruthy();
    expect(last(2, 'room:state')).toMatchObject({ code, you: 'host', guest: null });
    rooms.join(3, code);
    expect(duels).toHaveLength(2);
    rooms.leave(2);
    rooms.leave(3);
    expect(rooms.size).toBe(0);
  });

  it('creating or joining another room leaves the previous one', () => {
    const { rooms } = setup();
    const a = rooms.create(1);
    const b = rooms.create(2);
    rooms.join(1, b.code);
    expect(rooms.roomOf(1)?.code).toBe(b.code);
    expect(rooms.join(3, a.code)).toEqual({ ok: false, error: 'not_found' });
  });

  it('sweeps players who went offline and rooms nobody joined', () => {
    const { rooms, advance, last } = setup();
    const { code } = rooms.create(1);
    rooms.join(2, code);
    rooms.roomOf(1)!.inDuel = false;
    rooms.offline(2);
    advance(ROOM_LEAVE_AFTER_MS - 1);
    rooms.sweep();
    expect(rooms.roomOf(2)).toBeDefined();
    advance(1);
    rooms.sweep();
    expect(rooms.roomOf(2)).toBeUndefined();
    expect(last(1, 'room:state').guest).toBeNull();

    advance(ROOM_IDLE_MS);
    rooms.sweep();
    expect(rooms.size).toBe(0);
  });

  it('coming back online in time keeps the seat', () => {
    const { rooms, advance } = setup();
    const { code } = rooms.create(1);
    rooms.join(2, code);
    rooms.roomOf(1)!.inDuel = false;
    rooms.offline(2);
    advance(ROOM_LEAVE_AFTER_MS / 2);
    rooms.online(2);
    advance(ROOM_LEAVE_AFTER_MS);
    rooms.sweep();
    expect(rooms.roomOf(2)?.code).toBe(code);
  });
});
