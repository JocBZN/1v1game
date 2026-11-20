import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER = process.env.DUEL_SERVER ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // reachable from a phone on the same Wi-Fi
    proxy: {
      '/api': SERVER,
      '/socket.io': { target: SERVER, ws: true },
    },
  },
});
