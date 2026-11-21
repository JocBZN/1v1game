# ⚔️ Duel

A 1v1 web game: hit **PLAY**, get a random opponent, and play 3 rounds on topics picked by the
server (Trivia, Chess puzzles, Mental math, Flags, Rubik's Cube). Glicko-2 ratings overall and per
topic, leagues and a leaderboard. If nobody is online, within 5 seconds you play a **ghost** (a replay
of a real player) or a bot.

## Getting started

Requires **Node.js 22+** (tested on Node 26) and npm.

```powershell
npm install
npm run dev
```

- client: http://localhost:5173 (also reachable from your phone on the same Wi-Fi: `http://<pc-ip>:5173`)
- server: http://localhost:3001 (API + Socket.io; the client reaches it through Vite's proxy)

The SQLite database is created automatically at `server/db/duel.sqlite`. To reset it, stop the server
and delete the file.

> **npm 11 and install scripts.** npm 11 blocks unapproved install scripts. `package.json` already
> approves `better-sqlite3` (downloads its prebuilt binary) and `esbuild`. If `npm install` reports
> blocked scripts, run `npm install-scripts ls`, approve those two, then `npm rebuild better-sqlite3 esbuild`.
> `better-sqlite3` is pinned to 12.11.1, which ships a prebuilt binary for Node 26 on Windows, so no
> Python or Visual Studio is needed.

### Two tabs, two players

The token lives in `localStorage`, so tabs of the same browser share a player by default. For the
two-tab test, press **"Switch player"** (top of Home) in the second tab and pick another nickname; that
identity stays in that tab only (`sessionStorage`). Several tabs of one account can be open; only the
tab that presses PLAY takes over. An incognito window works too.

The first-visit intro animation can be replayed with `?intro` (or `?intro=hold` to keep it on screen).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | starts the server (tsx watch) and the client (Vite) |
| `npm test` | unit tests (Vitest): per-topic scoring, Glicko-2, best-of-3 logic, puzzle validation, cube model |
| `npm run typecheck` | TypeScript for both packages |
| `npm run build` | production build of the client |
| `npm run validate:puzzles` | checks every chess puzzle with chess.js and **removes** failing ones (`--dry` only reports) |
| `npm run generate:puzzles -w server` | regenerates `chess_puzzles.json` (deterministic), then run the validation |

## Topics

- **Trivia**: 5 questions from 5 different random categories, 10 s each. Correct = 500 + up to 500 speed bonus (decreasing linearly). 1,266 questions in 12 categories (90–125 each): History, Geography, Science, Sport, Film & Music, Football, Medicine, Math, Technology, Beauty & Cosmetics, TV & Shows, Famous People.
- **Flags**: 8 flags, 6 s each, same scoring. 194 countries; at most 3 lesser-known flags per round. Wrong options come from the same region.
- **Mental math**: 60 s of integer-result problems of increasing difficulty. 100/150/200/250 points per tier, −50 for a miss (round score never below 0).
- **Chess puzzles**: 90 s. 1000 points per solved puzzle + up to 100 speed bonus (tie-breaker only). One wrong move loses the puzzle. Any mating move is accepted.
- **Rubik's Cube**: a real, server-scrambled 3×3 cube, 5 minutes. Drag a row/column on the cube to turn that layer; drag outside the cube to spin it. While unsolved you score 20 points per sticker that matches its face's centre (max 960); solving it scores 3000 + up to 2000 time bonus.

## Rules

- **Duel**: 3 different topics. Win 2 rounds to win the duel (it stops at 2–0). If round wins are level, total points decide; otherwise it's a draw. Forfeiting or being disconnected for more than 15 s is a loss.
- **Server-authoritative**: the client only ever gets the current item without its answer; timers run on the server and late answers don't score. Every chess move and every cube turn is validated on the server (the cube's scramble is never sent — only its sticker state).
- **Ghosts** only replay rounds recorded with the current `CONTENT_VERSION` (`server/src/constants.ts`). Bump it when questions, flags, puzzles or texts change so old rounds are never replayed.
- **Rating**: Glicko-2 (τ = 0.5), starting at 1500 / RD 350. Each duel is one rating period: overall = the duel result; per topic = the result of each round in that topic. Against a ghost/bot only the real player changes; a ghost keeps the rating it had when its rounds were recorded.
- **Leagues**: Bronze < 1300 ≤ Silver < 1500 ≤ Gold < 1700 ≤ Platinum < 1900 ≤ Diamond < 2100 ≤ Legend.

## Project layout

```
server/
  data/questions.json        1,266 questions (12 categories, difficulty 1–3)
  data/chess_puzzles.json    70 puzzles (FEN + UCI solution including the opponent's replies)
  data/flags.json            194 countries (ISO code → flag emoji; `rare` marks lesser-known ones)
  src/modes/                 one GameMode per topic + registry (index.ts)
  src/cube/model.ts          pure 3×3 cube model (also imported by the client)
  src/duel/Duel.ts           duel engine: rounds, timers, live score, reconnects
  src/duel/logic.ts          pure rules: round/duel winner (best of 3)
  src/duel/results.ts        Glicko-2 updates after a duel
  src/ghost.ts               round recordings, ghosts, bots
  src/matchmaking.ts         in-memory queue with a widening rating window
  scripts/                   generate-puzzles.ts, validate-puzzles.ts
  test/                      Vitest tests
client/
  src/modes/                 one React component per topic + registry.tsx (CubeRound uses three.js)
  src/state/duel.tsx         duel state (a reducer fed by server events)
  src/screens/               Nickname, Home, Searching, Intro (roulette), Round, Result, Leaderboard, Profile
  src/components/IntroSplash.tsx  first-visit animation
```

## Adding a new topic

1. **Server**: implement `GameMode` from `server/src/modes/types.ts`:
   - `generateRound(rng)` — the round content including answers, JSON-serialisable (it's stored for ghosts);
   - `publicItem(content, i)` — what the client sees (no answer); optionally `publicItemState` for reconnects;
   - `validateAnswer(content, i, answer, ctx)` — the server's verdict + points;
   - `scoreRound(results)`, `timeLimit`, optional `itemTimeLimit`, `feedbackDelay`;
   - `simulateBot(content, rating, rng)` — how a bot plays.

   Then add it to `REGISTERED` in `server/src/modes/index.ts` and its id to `server/src/domains.ts`.
2. **Client**: a component taking `ModeProps` (`item`, `feedback`, `onAnswer`, `waiting`), registered in
   `client/src/modes/registry.tsx`, plus its metadata in `client/src/lib/domains.ts`.

Per-topic rating, leaderboard, ghosts and bots then work automatically.

## Environment variables (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | 3001 | server port |
| `DB_PATH` | `server/db/duel.sqlite` | SQLite file |
| `GHOST_AFTER_MS` | 5000 | wait before a ghost/bot is assigned |
| `DUEL_SERVER` | `http://localhost:3001` | Vite proxy target |
| `ROUND_TIME_SCALE` | 1 | **tests only**: scales round durations |
| `FORCE_DOMAINS` | — | **tests only**: e.g. `cube,chess,math` fixes the topics |
