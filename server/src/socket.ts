import type http from 'node:http';
import { Server, type Socket } from 'socket.io';
import { authenticate } from './auth';
import type { User } from './db';
import { GameServer } from './game';

export function attachSockets(server: http.Server) {
  const io = new Server(server, { cors: { origin: '*' }, pingInterval: 5000, pingTimeout: 5000 });
  const game = new GameServer(io);

  /** Latest socket per user: a new tab/connection for the same user replaces the old one. */
  const current = new Map<number, Socket>();

  io.use((socket, next) => {
    const user = authenticate(socket.handshake.auth?.token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user: User = socket.data.user;
    const prev = current.get(user.id);
    if (prev && prev.id !== socket.id) {
      prev.emit('session:replaced');
      prev.disconnect(true);
    }
    current.set(user.id, socket);
    socket.join(`user:${user.id}`);

    game.onConnect(user);

    socket.on('queue:join', () => game.joinQueue(user));
    socket.on('queue:leave', () => game.leaveQueue(user));
    socket.on('round:answer', (payload) => game.answer(user, payload));
    socket.on('duel:forfeit', () => game.forfeit(user));

    socket.on('disconnect', () => {
      if (current.get(user.id)?.id !== socket.id) return; // replaced by a newer socket
      current.delete(user.id);
      game.onDisconnect(user);
    });
  });

  return io;
}
