import type { Server } from 'socket.io';
import { getRating, getUserById, type User } from './db';
import { leagueFor } from './leagues';
import { Matchmaker, type QueueEntry } from './matchmaking';

/** Orchestrates queue → duel. */
export class GameServer {
  private mm: Matchmaker;

  constructor(private io: Server) {
    this.mm = new Matchmaker(
      (a, b) => this.startHumanDuel(a, b),
      (a) => this.startGhostDuel(a),
    );
    this.mm.start();
  }

  private emit(userId: number, event: string, data?: unknown) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  onConnect(_user: User) {}

  onDisconnect(user: User) {
    this.mm.leave(user.id);
  }

  joinQueue(user: User) {
    const rating = getRating(user.id, 'general').rating;
    const entry = this.mm.join(user.id, rating);
    if (this.mm.has(user.id)) this.emit(user.id, 'queue:joined', { since: entry.joinedAt });
  }

  leaveQueue(user: User) {
    if (this.mm.leave(user.id)) this.emit(user.id, 'queue:left');
  }

  answer(_user: User, _payload: unknown) {}

  forfeit(_user: User) {}

  private playerInfo(userId: number) {
    const u = getUserById(userId)!;
    const r = getRating(userId, 'general').rating;
    return { name: u.nickname, rating: Math.round(r), league: leagueFor(r).id, async: false };
  }

  private startHumanDuel(a: QueueEntry, b: QueueEntry) {
    const ia = this.playerInfo(a.userId);
    const ib = this.playerInfo(b.userId);
    this.emit(a.userId, 'duel:found', { you: ia, opponent: ib });
    this.emit(b.userId, 'duel:found', { you: ib, opponent: ia });
  }

  private startGhostDuel(a: QueueEntry) {
    this.emit(a.userId, 'duel:found', {
      you: this.playerInfo(a.userId),
      opponent: { name: 'Ghost', rating: 1500, league: 'gold', async: true },
    });
  }
}
