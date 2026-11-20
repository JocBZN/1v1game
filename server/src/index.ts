import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { createApi } from './api';
import { attachSockets } from './socket';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', createApi());

const server = http.createServer(app);
attachSockets(server);

server.listen(PORT, () => {
  console.log(`[duel] server pe http://localhost:${PORT}`);
});
