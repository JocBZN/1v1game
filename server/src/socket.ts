import type http from 'node:http';
import { Server, type Socket } from 'socket.io';
import { authenticate } from './auth';
import type { User } from './db';
import { GameServer } from './game';

let online = () => 0;
/** Players with at least one open tab right now. */
export const onlineCount = () => online();

export function attachSockets(server: http.Server) {
  const io = new Server(server, { cors: { origin: '*' }, // Phones on mobile data lag now and then: don't drop them after 5 s of silence.
    pingInterval: 10_000, pingTimeout: 20_000, perMessageDeflate: false });
  const game = new GameServer(io);

  /**
   * All open sockets per user. Several tabs of the same account may be connected (e.g. a tab that is
   * about to switch to another nickname); only the tab that presses "Play" keeps playing — the
   * others are told the account is in use elsewhere and disconnected.
   */
  const sockets = new Map<number, Set<Socket>>();
  online = () => sockets.size;

  io.use((socket, next) => {
    const user = authenticate(socket.handshake.auth?.token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user: User = socket.data.user;
    let set = sockets.get(user.id);
    if (!set) sockets.set(user.id, (set = new Set()));
    set.add(socket);
    socket.join(`user:${user.id}`);

    // No duel on the server → tell this tab, so it drops any stale duel screen (e.g. after a restart).
    if (!game.onConnect(user)) socket.emit('duel:none');

    /** Only the tab that starts something keeps playing; the account's other tabs are closed. */
    const takeOver = () => {
      for (const other of sockets.get(user.id) ?? []) {
        if (other.id === socket.id) continue;
        other.emit('session:replaced');
        other.disconnect(true);
      }
    };
    socket.on('queue:join', () => {
      takeOver();
      game.joinQueue(user);
    });
    socket.on('room:create', () => {
      takeOver();
      game.createRoom(user);
    });
    socket.on('room:join', (payload) => {
      takeOver();
      game.joinRoom(user, payload?.code);
    });
    socket.on('room:rematch', () => game.rematch(user));
    socket.on('room:leave', () => game.leaveRoom(user));
    socket.on('queue:leave', () => game.leaveQueue(user));
    socket.on('round:answer', (payload) => game.answer(user, payload));
    socket.on('duel:forfeit', () => game.forfeit(user));

    socket.on('disconnect', () => {
      const s = sockets.get(user.id);
      s?.delete(socket);
      if (s && s.size > 0) return; // another tab of this user is still here
      sockets.delete(user.id);
      game.onDisconnect(user);
    });
  });

  return io;
}
