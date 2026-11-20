import { io, type Socket } from 'socket.io-client';
import { getToken } from './api';

let socket: Socket | null = null;
let socketToken: string | null = null;

/** One socket per tab, authenticated with the tab's token. */
export function getSocket(): Socket {
  const token = getToken();
  if (socket && socketToken === token) return socket;
  socket?.close();
  socketToken = token;
  socket = io({ auth: { token }, transports: ['websocket'], reconnectionDelay: 500, reconnectionDelayMax: 2000 });
  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = null;
  socketToken = null;
}
