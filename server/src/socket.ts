import type http from 'node:http';
import { Server } from 'socket.io';
import { authenticate } from './auth';

export function attachSockets(server: http.Server) {
  const io = new Server(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const user = authenticate(socket.handshake.auth?.token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    socket.emit('hello', { nickname: socket.data.user.nickname });
  });

  return io;
}
