import crypto from 'node:crypto';
import { DOMAIN_IDS, type DomainId } from './domains';

/** Unambiguous characters only (no 0/O, 1/I/L), so a code read out loud or typed on a phone works. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;
/** A member who has no open tab for this long leaves the room. */
export const ROOM_LEAVE_AFTER_MS = 90_000;
/** A room nobody joined is closed after this long. */
export const ROOM_IDLE_MS = 30 * 60_000;

export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== CODE_LENGTH) return null;
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return null;
  return code;
}

export interface Member {
  userId: number;
  name: string;
  /** Wants a rematch after the last duel. */
  ready: boolean;
  /** Set while the member has no open tab. */
  offlineSince: number | null;
}

export interface Room {
  code: string;
  host: Member;
  guest: Member | null;
  inDuel: boolean;
  duels: number;
  /** Duels won by host / guest in this room. */
  score: [number, number];
  /** Games the host allows in this room (at least one). */
  allowed: DomainId[];
  touchedAt: number;
}

export type RoomError = 'not_found' | 'full' | 'busy';

export interface RoomHooks {
  emit(userId: number, event: string, data?: unknown): void;
  /** Start a friendly duel; `onEnd` gets the winner (0 = host, 1 = guest, null = draw). */
  startDuel(hostId: number, guestId: number, onEnd: (winner: 0 | 1 | null) => void, allowed: readonly DomainId[]): void;
  nameOf(userId: number): string;
  now?: () => number;
}

/** Private rooms: one host, one guest, joined with a 5-character code or a /c/<code> link. */
export class Rooms {
  private rooms = new Map<string, Room>();
  private byUser = new Map<number, string>();
  private now: () => number;

  constructor(private hooks: RoomHooks) {
    this.now = hooks.now ?? Date.now;
  }

  get size() {
    return this.rooms.size;
  }

  roomOf(userId: number): Room | undefined {
    const code = this.byUser.get(userId);
    return code ? this.rooms.get(code) : undefined;
  }

  private newCode(): string {
    for (;;) {
      let code = '';
      const bytes = crypto.randomBytes(CODE_LENGTH);
      for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
      if (!this.rooms.has(code)) return code;
    }
  }

  private member(userId: number): Member {
    return { userId, name: this.hooks.nameOf(userId), ready: false, offlineSince: null };
  }

  private publicState(room: Room, forUser: number) {
    const you = room.host.userId === forUser ? 'host' : 'guest';
    const pub = (m: Member | null) => (m ? { name: m.name, ready: m.ready, online: m.offlineSince === null } : null);
    return {
      code: room.code,
      you,
      host: pub(room.host),
      guest: pub(room.guest),
      inDuel: room.inDuel,
      duels: room.duels,
      // Always "your wins, their wins".
      score: you === 'host' ? room.score : [room.score[1], room.score[0]],
      allowed: room.allowed,
    };
  }

  private broadcast(room: Room) {
    for (const m of [room.host, room.guest]) if (m) this.hooks.emit(m.userId, 'room:state', this.publicState(room, m.userId));
  }

  /** Re-send the room to a user (e.g. a tab that just connected). */
  sync(userId: number) {
    const room = this.roomOf(userId);
    if (room) this.hooks.emit(userId, 'room:state', this.publicState(room, userId));
  }

  create(userId: number): Room {
    this.leave(userId);
    const room: Room = {
      code: this.newCode(),
      host: this.member(userId),
      guest: null,
      inDuel: false,
      duels: 0,
      score: [0, 0],
      allowed: [...DOMAIN_IDS],
      touchedAt: this.now(),
    };
    this.rooms.set(room.code, room);
    this.byUser.set(userId, room.code);
    this.broadcast(room);
    return room;
  }

  join(userId: number, rawCode: unknown): { ok: true; room: Room } | { ok: false; error: RoomError } {
    const code = normalizeCode(rawCode);
    const room = code ? this.rooms.get(code) : undefined;
    if (!room) return { ok: false, error: 'not_found' };
    // Already inside (second tab, reconnect, opening your own link): just resync.
    if (room.host.userId === userId || room.guest?.userId === userId) {
      this.sync(userId);
      return { ok: true, room };
    }
    if (room.guest) return { ok: false, error: 'full' };
    this.leave(userId);
    room.guest = this.member(userId);
    room.touchedAt = this.now();
    this.byUser.set(userId, room.code);
    this.broadcast(room);
    this.start(room);
    return { ok: true, room };
  }

  /** Host only, between duels: which games this room plays (at least one; unknown ids ignored). */
  setAllowed(userId: number, list: readonly DomainId[]) {
    const room = this.roomOf(userId);
    if (!room || room.host.userId !== userId || room.inDuel) return;
    const allowed = DOMAIN_IDS.filter((d) => list.includes(d));
    if (!allowed.length) return;
    room.allowed = allowed;
    room.touchedAt = this.now();
    this.broadcast(room);
  }

  /** After a duel both press Rematch; the next duel starts when both are ready. */
  rematch(userId: number) {
    const room = this.roomOf(userId);
    if (!room || room.inDuel || !room.guest) return;
    const m = room.host.userId === userId ? room.host : room.guest;
    m.ready = true;
    room.touchedAt = this.now();
    if (room.host.ready && room.guest.ready) this.start(room);
    else this.broadcast(room);
  }

  leave(userId: number) {
    const room = this.roomOf(userId);
    if (!room) return;
    this.byUser.delete(userId);
    this.hooks.emit(userId, 'room:closed', { reason: 'left' });
    const other = room.host.userId === userId ? room.guest : room.host;
    if (!other) {
      this.rooms.delete(room.code);
      return;
    }
    // The one who stays becomes the host and waits for someone new with the same code.
    room.host = { ...other, ready: false };
    room.guest = null;
    room.touchedAt = this.now();
    if (!room.inDuel) this.broadcast(room);
  }

  private start(room: Room) {
    if (room.inDuel || !room.guest) return;
    room.inDuel = true;
    room.host.ready = false;
    room.guest.ready = false;
    const hostId = room.host.userId;
    const guestId = room.guest.userId;
    this.broadcast(room);
    this.hooks.startDuel(hostId, guestId, (winner) => {
      room.inDuel = false;
      room.duels++;
      room.touchedAt = this.now();
      if (winner !== null) {
        // Seats may have changed during the duel (someone left): credit by user, not by seat.
        const winnerId = winner === 0 ? hostId : guestId;
        if (room.host.userId === winnerId) room.score[0]++;
        else if (room.guest?.userId === winnerId) room.score[1]++;
      }
      if (this.rooms.get(room.code) === room) this.broadcast(room);
    }, room.allowed);
  }

  online(userId: number) {
    const room = this.roomOf(userId);
    if (!room) return;
    const m = room.host.userId === userId ? room.host : room.guest;
    if (m && m.offlineSince !== null) {
      m.offlineSince = null;
      this.broadcast(room);
    } else this.sync(userId);
  }

  offline(userId: number) {
    const room = this.roomOf(userId);
    if (!room) return;
    const m = room.host.userId === userId ? room.host : room.guest;
    if (!m) return;
    m.offlineSince = this.now();
    this.broadcast(room);
  }

  /** Drop members who have been gone too long and rooms nobody used for a while. */
  sweep() {
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      if (room.inDuel) continue;
      for (const m of [room.guest, room.host]) {
        if (m && m.offlineSince !== null && now - m.offlineSince >= ROOM_LEAVE_AFTER_MS) this.leave(m.userId);
      }
      const live = this.rooms.get(room.code);
      if (live && !live.guest && now - live.touchedAt >= ROOM_IDLE_MS) this.leave(live.host.userId);
    }
  }
}
