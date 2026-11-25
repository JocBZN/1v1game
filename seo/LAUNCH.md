# Texte de lansare: gata de postat (de tine)

Reguli:
- **Postează abia după fix-ul pentru `/api/guest` (P1).** Altfel o parte din vizitatori văd „Can’t reach the server”.
- Fii sincer că azi se joacă contra unui bot. Pe Reddit, un dezvoltator care scrie „am făcut asta, vreau feedback” primește upvote-uri. „The best trivia game ever” ia ban.
- Citește regulile fiecărui subreddit înainte să postezi. Unele cer flair „Self-promotion” sau o anumită zi.
- O postare pe săptămână e suficient, nu tot în aceeași zi. Răspunde la toate comentariile în prima oră.

---

## Reddit

### r/WebGames
**Title:** I made a free 1v1 brain-game duel in the browser – trivia, flags, chess puzzles, mental math and a real 3D Rubik’s Cube

**Body:**
> Hi! I’ve been building **1v1game.net** – you press Play and get a best-of-three duel: three rounds on random topics (trivia with 1,200+ questions, guess-the-flag, mate-in-1/2 chess puzzles, speed arithmetic, or a real 3D Rubik’s Cube).
>
> Right now you play against a bot (instant, no sign-up). Friend challenges via link and ranked online matches are next.
>
> I’d love feedback on: which mode is the most fun, and whether the bot feels too easy/hard. https://1v1game.net

### r/trivia (feedback-ul e acceptat, promovarea directă nu)
**Title:** Built a free trivia duel game with 1,200+ questions – looking for feedback on question quality
> I’m a solo dev. Each duel is 3 rounds, best of three, across 12 categories (geography, history, science, movies, sports…). If you spot a wrong or ambiguous question, tell me and I’ll fix it. Free, no sign-up: https://1v1game.net/quiz

### r/Cubers
**Title:** I put a real 3D Rubik’s Cube in a browser 1v1 game – curious what cubers think of the controls
> Drag to turn faces, timer included. It’s one of the rounds in a duel game I’m building. Feedback on the controls/notation very welcome: https://1v1game.net/rubiks-cube

### r/chess (doar dacă regulile permit; de obicei e permis în thread-ul săptămânal)
> Mate-in-1 / mate-in-2 puzzle races, 60 seconds, as many as you can: https://1v1game.net/chess-puzzles – feedback on puzzle difficulty welcome.

### r/SideProject, r/IndieDev
**Title:** 1v1game – a browser duel game mixing trivia, flags, chess puzzles, mental math and a 3D Rubik’s Cube
> Stack: a Vite single-page app hosted on Railway (verifică și completează). SEO-wise I prerender the quiz pages (1,200+ Q&A) and just added 8 languages. Happy to share what worked. Next up: friend challenge links and ranked matchmaking with bot fallback.

### r/Romania / r/programare (în română)
**Titlu:** Am făcut un joc 1 la 1 de cultură generală în browser – feedback?
> Salut! Am construit **1v1game.net**: un duel de 3 runde pe teme la întâmplare (cultură generală, steaguri, probleme de șah, calcul mental, cub Rubik 3D). Momentan joci contra unui bot, fără cont. Urmează provocări cu prietenii prin link și meciuri online pentru rank. Are și o versiune în română: https://1v1game.net/ro/ – orice feedback e binevenit!

---

## Product Hunt
- **Name:** 1v1game
- **Tagline (≤60):** Best-of-three brain duels: trivia, flags, chess & more
- **Description (≤260):** Press Play and get a 1v1 duel: three rounds on random topics – 1,200+ trivia questions, a flag quiz, chess puzzles, mental math and a real 3D Rubik’s Cube. Free, in your browser, no sign-up. Friend challenges and ranked online matches are coming next.
- **Topics:** Games, Education, Web App
- **Primul comentariu (maker):**
> Hey PH 👋 I built 1v1game because most quiz sites are solo and most multiplayer quiz apps need a download. Here every duel is 3 short rounds of different brain games, so it stays fresh. Today you play vs a bot; next I’m shipping **challenge-a-friend links** and **ranked** with leagues. What mode should I add next?

Lansează marți–joi la 00:01 PT. Anunță-ți prietenii dinainte, dar nu le cere upvote-uri explicit: PH penalizează asta.

## Show HN
- **Title:** Show HN: 1v1game – best-of-three browser duels (trivia, chess puzzles, 3D Rubik’s Cube)
- **Text:**
> I built a small browser game where each match is three rounds of different "brain" mini-games: trivia (1,200+ questions), flags, mate-in-N chess puzzles, speed arithmetic and a 3D Rubik’s Cube. You currently play against a bot; friend links and ranked matchmaking are next. Tech: a Vite single-page app on Railway; quiz pages are prerendered for SEO and now exist in 9 languages. Feedback on the gameplay loop (and on how to do fair matchmaking with low traffic) is very welcome.

## AlternativeTo
- Adaugi „1v1game” ca alternativă la: **Sporcle, Kahoot!, Trivia Crack, QuizUp, Lichess Puzzle Storm, Chess.com Puzzle Rush**.
- Platform: Web. License: Free. Tags: trivia, quiz, multiplayer, brain-games, chess-puzzles, rubiks-cube.
- **Descriere:** Free browser game of best-of-three duels: trivia (1,200+ questions), flag quiz, chess puzzles, mental math and a real 3D Rubik’s Cube. No download, no sign-up.

## Portaluri de jocuri
- **itch.io:** pagină de tip „HTML5 / external link” cu 3–5 screenshot-uri și un GIF scurt. Tag-uri: trivia, quiz, multiplayer, puzzle, chess, browser. Un link de pe itch.io e și un backlink bun.
- **CrazyGames / Poki:** ambele au formular pentru dezvoltatori și cer integrarea SDK-ului lor (reclame și progres). Merită după ce ai vs Friend: acolo ai acces la milioane de jucători, dar jocul trebuie să meargă și în iframe.
- **Newgrounds, Kongregate, Armor Games:** opționale; câștigul principal e un backlink cu nișă relevantă.

## Widgetul de quiz → backlinkuri (după deploy)
Cine pune widgetul pe site îți dă un link vizibil, cu ancoră relevantă, de exemplu „Geography Quiz”. Cui să-i scrii:
- **profesori și bloguri educaționale:** caută „geography resources for teachers”, „trivia for classroom”, „quiz săptămânal blog”;
- **bloguri de călătorii:** widgetul cu „World Capitals”;
- **bloguri de sport și filme:** categoriile Sports, Movies și Music;
- **site-uri de știri locale și școli din România:** pagina `/ro/widget-quiz/`.

Mesaj scurt (EN):
> Hi! I run 1v1game.net, a free trivia game. I made a free quiz widget (one line of code, no ads, 9 languages) that fits your [geography/travel/…] posts – here's a preview: https://1v1game.net/quiz-widget/ . Happy to make a custom category for your readers if useful.

Trimite 10 mesaje pe săptămână, personalizate. Nu trimite mass-mail.

## Clipuri scurte: Shorts studio (gata făcut)
Sunt 100 de clipuri pe limbă, deci material pentru 3 luni la un clip pe zi. Deschide `studio/shorts.html` în Chrome sau Edge, alege limba și clipul, apoi apasă **Exportă**. Fișierul MP4 se descarcă automat. Descrierea și hashtag-urile pentru fiecare clip sunt în `studio/captions-<lang>.txt`.
- Pune peste clip un sunet popular, direct din TikTok, Reels sau Shorts.
- Postează 1–2 clipuri pe zi, la aceeași oră. Începe cu engleza și româna.
- Fixează (pin) un comentariu cu „Play free: 1v1game.net”.

## Clipuri scurte (TikTok / Reels / Shorts), 3 scenarii
1. **„Poți răspunde în 5 secunde?”** Ecran split cu întrebarea, cronometru de 5 secunde, apoi răspunsul. 5 întrebări pe clip, cu text la final: „Joacă 1v1 → link în bio”. Se poate face pe fiecare limbă.
2. **„Am bătut botul în 30 de secunde la cubul Rubik”**: înregistrare de ecran accelerată, cu muzică trending.
3. **„Mat în 1: găsești mutarea?”**: poziția 3 secunde, apoi soluția. Merge foarte bine pe comunitățile de șah.

Postează de 3–4 ori pe săptămână. Clipurile cu întrebări se pot genera din `seo/data/questions.mjs`, în toate cele 9 limbi.
