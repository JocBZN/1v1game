# Duel — single container: Express + Socket.io server that also hosts the built React client.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    DB_PATH=/data/duel.sqlite
COPY --from=build /app /app
EXPOSE 8080
# One process (no npm wrapper) so SIGTERM from the host reaches the server and SQLite closes cleanly.
CMD ["node", "--import", "tsx", "server/src/index.ts"]
