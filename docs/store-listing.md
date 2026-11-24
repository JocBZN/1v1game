# Duel — store listing (ASO)

Ready-to-paste texts for Google Play and the App Store, plus the assets that exist in the repo.
Character limits are noted; every text below fits them.

## Keyword strategy

Players search for the *activity*, not the brand. Each field leads with high-intent terms:

| Priority | Keywords |
| --- | --- |
| Primary | trivia, quiz, 1v1, multiplayer, brain games |
| Secondary | chess puzzles, mental math, flag quiz, rubik's cube, general knowledge |
| Long tail | trivia duel, quiz battle, play with friends online, guess the flag, math game |

Avoid competitor names (store policy) and repeating a word across title + keywords on iOS (wasted space).

---

## Google Play

**App name** (30): `Duel: Trivia & Brain Games 1v1`

**Short description** (80):
`Live 1v1 quiz battles: trivia, chess puzzles, math, flags & a real Rubik’s Cube`

**Full description** (4000):

```
Challenge a real opponent in seconds. Duel throws three random topics at you — win two rounds and the duel is yours.

⚔️ 1V1, LIVE
Press Play and get matched with someone at your level. See their score move in real time while you play. Nobody online? You face a “ghost”: a real player’s recorded round, with their real timing.

🧠 TRIVIA QUIZ — 1,200+ QUESTIONS
History, geography, science, football, sport, movies & music, TV shows, medicine, maths, technology, beauty and famous people. Answer fast for bonus points.

♞ CHESS PUZZLES
Mate in 1, mate in 2 and winning tactics. 90 seconds, one wrong move and the puzzle is gone.

🧮 MENTAL MATH
Sixty seconds of speed arithmetic that gets harder as you go.

🚩 FLAG QUIZ
194 countries. Wrong answers come from the same region, so you really need to know them.

🧊 A REAL RUBIK’S CUBE
A true 3D 3×3 cube. Drag a row to turn it, drag outside to spin it. Five minutes to solve — every bit of progress scores.

🏆 RANKED LEAGUES
Bronze → Silver → Gold → Platinum → Diamond → Legend. Fair Glicko-2 ratings, overall and per topic, and a global leaderboard.

✅ Free • no ads • play as a guest, sign up in seconds to save your progress
✅ Light on data and battery, works on any phone

Think you’re smarter than anyone? Prove it. Duel.
```

**Category:** Games → Trivia  **Tags:** Trivia, Quiz, Puzzle, Brain games, Multiplayer
**Content rating:** Everyone (no violence, no user chat, no purchases)
**Privacy policy URL:** `https://<your-domain>/privacy`

## App Store (iOS)

**Name** (30): `Duel: 1v1 Trivia & Brain Games`
**Subtitle** (30): `Quiz battles vs real people`
**Keywords** (100, no spaces after commas):
`quiz,trivia,brain,chess,puzzle,math,flags,rubik,cube,multiplayer,battle,knowledge,friends,iq,game`
**Promotional text** (170):
`New: 1,200+ trivia questions and 194 flags. Challenge a real opponent in seconds — win two of three rounds to take the duel.`
**Description:** same as Google Play.
**Category:** Games → Trivia (secondary: Games → Puzzle)

---

## Assets

| Asset | File | Status |
| --- | --- | --- |
| App icon 512×512 | `client/public/icon-512.png` | ✅ |
| Adaptive / maskable icon | `client/public/icon-maskable-512.png` | ✅ |
| Feature graphic 1024×500 (Play) | `client/public/feature-graphic.png` | ✅ |
| Social preview 1200×630 | `client/public/og.png` | ✅ |
| Phone screenshots (min. 2, best 6–8) | — | take from the live app: Home, Trivia, Chess, Cube, Result, Leaderboard |

Screenshot captions (short, benefit first): “Beat a real opponent”, “1,200+ trivia questions”, “Chess puzzle races”, “Solve a real Rubik’s Cube”, “Climb to Legend”.

## Getting into the stores

The web app is an installable PWA, so no separate native code is needed:

1. **Google Play** (one-time $25 developer account): open https://www.pwabuilder.com, enter the live URL, generate the Android package (Trusted Web Activity). Put the package name and the signing key’s SHA-256 fingerprint in Railway as `TWA_PACKAGE` and `TWA_SHA256` — the server then publishes `/.well-known/assetlinks.json`, which removes the browser bar. Upload the `.aab` in Play Console with the texts above.
2. **App Store** ($99/year, needs a Mac with Xcode): PWABuilder also generates an iOS project; build and submit it from Xcode.

## After launch (what moves the ranking)

- Ratings and reviews: ask after a won duel, never after a loss.
- Update the promotional text and screenshots when new questions or topics ship.
- Watch store search terms in Play Console → Acquisition, and move the best ones into the short description/keywords.
