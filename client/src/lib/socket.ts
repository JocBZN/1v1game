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
  // WebSocket first; fall back to HTTP long-polling on networks that block WebSockets.
  socket = io({ auth: { token }, transports: ['websocket', 'polling'], tryAllTransports: true, reconnectionDelay: 300, reconnectionDelayMax: 1500, timeout: 8000 });
  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = null;
  socketToken = null;
}
