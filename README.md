# ⚔️ Duel

Aplicație web 1v1: apeși **JOACĂ**, primești un adversar random și jucați 3 runde pe domenii alese
de server (Cultură generală, Puzzle șah, Calcul mental, Steaguri). Rating Glicko-2 general + pe
domeniu, ligi și clasament. Dacă nu e nimeni online, în 5 secunde joci contra unui **ghost**
(replay-ul unui jucător real) sau al unui bot.

## Pornire

Cerințe: **Node.js 22+** (testat pe Node 26) și npm.

```powershell
npm install
npm run dev
```

- client: http://localhost:5173 (și din rețeaua locală, ca să testezi pe telefon: `http://<ip-pc>:5173`)
- server: http://localhost:3001 (API + Socket.io; clientul îl accesează prin proxy-ul Vite)

Baza de date SQLite se creează automat în `server/db/duel.sqlite`. Ca s-o resetezi, oprește serverul
și șterge fișierul.

> **npm 11 și scripturile de instalare.** npm 11 blochează scripturile de instalare care nu sunt
> aprobate. `package.json` are deja aprobate `better-sqlite3` (descarcă binarul precompilat) și
> `esbuild`. Dacă `npm install` raportează scripturi blocate, rulează `npm install-scripts ls`,
> aprobă-le pe acestea două și apoi `npm rebuild better-sqlite3 esbuild`.
> `better-sqlite3` e fixat la 12.11.1: are binar precompilat pentru Node 26 pe Windows, deci nu
> e nevoie de Python sau Visual Studio.

### Două taburi, doi jucători

Tokenul stă în `localStorage`, deci taburile aceluiași browser au implicit același jucător.
Pentru testul cu 2 taburi: în al doilea tab apasă **„Alt jucător”** (sus, pe Home) și alege alt
nickname. Identitatea nouă rămâne doar în acel tab (`sessionStorage`). Alternativ, folosește o
fereastră incognito.

## Scripturi

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | pornește serverul (tsx watch) și clientul (Vite) |
| `npm test` | testele unitare (Vitest): scorare pe domenii, Glicko-2, logica 2 din 3, validarea puzzle-urilor |
| `npm run typecheck` | TypeScript pe ambele pachete |
| `npm run build` | build de producție pentru client |
| `npm run validate:puzzles` | verifică fiecare puzzle cu chess.js și **elimină** ce pică (`--dry` doar raportează) |
| `npm run generate:puzzles -w server` | regenerează `chess_puzzles.json` (determinist), apoi rulează validarea |

## Structură

```
server/
  data/questions.json        228 de întrebări (5 subcategorii, dificultate 1–3)
  data/chess_puzzles.json    70 de puzzle-uri (FEN + soluție UCI cu răspunsurile adversarului)
  data/flags.json            99 de țări (cod ISO → emoji de steag)
  src/modes/                 câte un GameMode per domeniu + registry (index.ts)
  src/duel/Duel.ts           motorul de duel: runde, timere, scor live, reconectare
  src/duel/logic.ts          reguli pure: câștigătorul rundei/duelului (2 din 3)
  src/duel/results.ts        actualizări Glicko-2 după duel
  src/ghost.ts               înregistrarea rundelor, ghost, bot
  src/matchmaking.ts         coadă în memorie cu fereastră de rating care se lărgește
  scripts/                   generate-puzzles.ts, validate-puzzles.ts
  test/                      teste Vitest
client/
  src/modes/                 o componentă React per domeniu + registry.tsx
  src/state/duel.tsx         starea duelului (reducer alimentat de evenimentele serverului)
  src/screens/               Nickname, Home, Căutare, Intro (ruletă), Rundă, Rezultat, Clasament, Profil
```

## Cum adaugi un domeniu nou (ex. cub Rubik)

1. **Server**: implementează `GameMode` din `server/src/modes/types.ts`:
   - `generateRound(rng)`: conținutul rundei, cu răspunsuri, JSON-serializabil (e salvat pentru ghost);
   - `publicItem(content, i)`: ce vede clientul (fără răspuns);
   - `validateAnswer(content, i, answer, ctx)`: verdictul serverului + puncte;
   - `scoreRound(results)`, `timeLimit`, opțional `itemTimeLimit`, `feedbackDelay`;
   - `simulateBot(content, rating, rng)`: jocul botului.

   Apoi adaugă modul în `REGISTERED` din `server/src/modes/index.ts` și id-ul în `server/src/domains.ts`.
2. **Client**: o componentă care primește `ModeProps` (`item`, `feedback`, `onAnswer`, `waiting`),
   înregistrată în `client/src/modes/registry.tsx`, plus metadatele din `client/src/lib/domains.ts`.

Ratingul pe domeniu, clasamentul, ghost-ul și botul funcționează automat pentru domeniul nou.

## Reguli de joc implementate

- **Cultură generală**: 5 întrebări (câte una din fiecare subcategorie), 10 s fiecare. Corect = 500 + bonus de viteză de până la 500 (scade liniar).
- **Steaguri**: 8 steaguri, 6 s fiecare, aceeași formulă. Variantele greșite sunt din aceeași regiune.
- **Calcul mental**: 60 s, exerciții cu rezultat întreg, dificultate crescătoare. 100/150/200/250 puncte pe nivel, −50 la greșit (scorul rundei nu scade sub 0).
- **Puzzle șah**: 90 s. 1000 de puncte per puzzle rezolvat + până la 100 bonus de viteză (doar pentru departajare). O mutare greșită pierde puzzle-ul. Orice mutare care dă mat e acceptată.
- **Duel**: 3 domenii diferite. Câștigă duelul cine ia 2 runde (la 2–0 duelul se oprește). La egalitate de runde decid punctele totale, apoi e remiză. Abandon sau deconectare > 15 s = înfrângere.
- **Server-authoritative**: clientul primește doar itemul curent, fără răspuns. Timerele sunt pe server, iar răspunsurile întârziate nu se punctează. Fiecare mutare de șah e validată pe server, care trimite apoi răspunsul forțat al adversarului.
- **Rating**: Glicko-2 (τ = 0,5), start 1500 / RD 350. Fiecare duel e o perioadă de rating. General = rezultatul duelului; pe domeniu = rezultatul fiecărei runde jucate. Contra ghost/bot se actualizează doar jucătorul real, iar ghost-ul are ratingul de la momentul înregistrării.
- **Ligi**: Bronz < 1300 ≤ Argint < 1500 ≤ Aur < 1700 ≤ Platină < 1900 ≤ Diamant < 2100 ≤ Legendă.

## Variabile de mediu (opționale)

| Variabilă | Implicit | Rol |
| --- | --- | --- |
| `PORT` | 3001 | portul serverului |
| `DB_PATH` | `server/db/duel.sqlite` | fișierul SQLite |
| `GHOST_AFTER_MS` | 5000 | după cât timp primești ghost/bot |
| `DUEL_SERVER` | `http://localhost:3001` | ținta proxy-ului Vite |
| `ROUND_TIME_SCALE` | 1 | **doar pentru teste**: scalează duratele rundelor |
| `FORCE_DOMAINS` | — | **doar pentru teste**: ex. `chess,math,trivia` fixează domeniile |
