# HANDOFF: unde am rămas (26 nov 2026)

> **Pentru Claude pe celălalt PC:** citește întâi fișierul ăsta, apoi `README.md` și `seo/PATCHES.md`. Utilizatorul vorbește română.
> **Reguli de lucru cu utilizatorul:** întreabă înainte de fiecare `git push` (dacă nu ți-a cerut explicit push), verifică mereu output-ul push-ului, fără bucle lungi de așteptare, fără emoji în UI.

## Proiectul pe scurt
- **1v1game.net** („Duel”): duel 1v1 în browser, 3 runde pe jocuri alese la întâmplare din **12**: trivia, steaguri, șah, cub Rubik, Split the shape, Guess the color, One-shot golf, Timeline, Opinion, Release year, The right price, Followers. Câștigi 2 din 3.

## Ce s-a făcut pe 25–26 nov (totul e live, commit `1d44196` + cel de după)
1. **Redesign minimalist:** paleta „curiosities” (`#46425e` slate, `#15788c` teal, `#00b9be` cyan, `#ffeecc` cream, `#ffb0a3` peach, `#ff6973` coral), butoane și carduri plate, fără emoji nicăieri (iconițe lucide, steaguri SVG). Play e un buton lat teal, rating-ul e o linie simplă.
2. **Calcul mental scos de tot.** `/mental-math` face 301 spre `/1v1-games`. Textele SEO (toate cele 9 limbi) nu-l mai menționează.
3. **Cubul:** 3 minute, scopul e **o față întreagă sau o cruce** de o culoare dată (`server/src/cube/model.ts` → `goalProgress`). Când ții apăsat pe cub, rândul prins se luminează și se rotește odată cu degetul; dacă dai drumul sub o treime de rotire, revine.
4. **Jocuri noi:**
   - `split` (forme pop-culture, o tăietură cât mai aproape de 50/50; `modes/shapes.ts`);
   - `color` (RGB, 15 s, ΔE perceptual);
   - `golf` (fizică deterministă pe server în `server/src/golf/physics.ts`, clientul doar animă traseul);
   - `timeline` (4 evenimente, drag-and-drop cu `Reorder` din motion);
   - **estimare** (`modes/estimate.ts` + `modes/estimate-data.ts`, ecran comun `client/src/modes/EstimateRound.tsx`): `opinion` (388 de întrebări: 76 de fapte + 312 „câte încap”, calculate din dimensiuni reale), `year` (118 titluri, 1980–2023), `price` (48 de obiecte, USD), `followers` (27; cifrele sunt aproximative pentru 2025 și trebuie actualizate din când în când).
5. **Stele de dificultate 1–5** pe fiecare întrebare (`stars` în `server/data/questions.json`; steagurile 1/3/5). Punctele cresc cu stelele (★ 350–525 … ★★★★★ 950–1425). Stelele se recalibrează singure din rata reală de răspunsuri corecte (tabelul `question_stats`, după 15 răspunsuri, reîmprospătat la 10 min).
6. **Rating:** Glicko-2, apoi trei multiplicatori (`server/src/duel/results.ts` → `ratingFactors`): streak +10%/rezultat la rând (max +50%), marja de scor ×0.8…×1.4, istoricul (win rate) ×0.85…×1.15. Ecranul de rezultat arată motivele ca etichete.
7. **Pagini SEO noi:** `/split-the-shape`, `/color-game`, `/mini-golf`, `/timeline-game`, `/estimation-game`, `/guess-the-year`, `/price-guessing-game`, `/followers-game`. IndexNow trimis pe 26 nov (213 URL-uri).
8. **Atenție la build:** `seo/scripts/check.mjs` pică dacă o descriere depășește limita (ex. RO 172 de caractere). Dacă build-ul pică, Railway nu face deploy și site-ul rămâne pe versiunea veche. Rulează `npm run build` înainte de push.
9. Teste: 110/110 (`npm test`).

## Istoric: ce s-a făcut pe 25 nov (SEO)
- Cum funcționează potrivirea: Play caută un adversar live timp de 5 secunde. Dacă nu găsește, primești un **ghost** (reluarea unui meci al unui jucător real) sau un **bot**. Ratinguri Glicko-2, ligi Bronze → Legend, clasament doar pentru conturile înregistrate. Guest automat, cu buton de login/register.
- Monorepo: `server/` (Node, TypeScript, Express, Socket.io, better-sqlite3) și `client/` (React, Vite, Tailwind v4). `seo/` conține pachetul de pagini multilingve.
- **GitHub:** https://github.com/JocBZN/1v1game (privat), branch `main`.
- **Railway:** proiectul **duel**, serviciul **duel**, cu volum `/data` (baza de date SQLite) și domeniile 1v1game.net și www. **De azi, serviciul e conectat la repo:** fiecare push pe `main` face deploy automat. Build: `Dockerfile` (`npm run build`, care rulează și `build:seo`).

## Ce s-a făcut azi (totul e live și verificat)
1. **P1, homepage-ul gol pentru Google:**
   - Textul homepage-ului (H1, linkuri) e acum **în afara `#root`** în `client/index.html`, deci nu mai depinde de `/api/guest`. Se vede sub joc și e ascuns în timpul unui duel (clasa `body.in-duel`).
   - `robots.txt`: `Allow: /api/guest` înainte de `Disallow: /api/`, plus ambele sitemap-uri.
   - Guest-ii care n-au jucat niciodată se șterg automat după 48 h (`pruneIdleGuests` în `server/src/db.ts`, rulează la pornire și la fiecare 6 h).
2. **P2, texte oneste:** titluri, descrieri, H1-uri și JSON-LD descriu potrivirea reală (adversar live, apoi ghost sau calculator). Handoff-ul de la birou presupunea greșit că se joacă doar contra unui bot. În `seo/data/i18n.mjs`: `FEATURES = { friend: false, ranked: true }`.
3. **P3, pachetul SEO în `seo/`:**
   - 177 de pagini: `/es/ /pt/ /fr/ /de/ /it/ /ro/ /pl/ /tr/`, hub-uri, categorii, categorii englezești noi (`/quiz/world-capitals/ space/ music/ art-literature/`), `/quiz-of-the-day/`, `/general-knowledge-questions/`, steaguri pe continente, `/quiz-widget/`, `/embed/<lang>.html`, `/flags/*.svg`, `sitemap-i18n.xml` (189 URL-uri), `llms.txt`.
   - Se regenerează la fiecare build (`npm run build:seo` = build + check). `seo/public` e în `.gitignore`.
   - Servit de `server/src/seo-pack.ts`, înainte de rutele jocului: CSP cu hash pentru scripturile inline, iar `/embed/` e singura cale care poate fi pusă în iframe.
   - Paginile englezești existente au acum hreflang (citit din `sitemap-i18n.xml`). Footer-ul, hub-ul `/quiz`, `/trivia` și `/flag-quiz` au linkuri spre paginile noi.
   - Steagurile englezești pentru Europa, Asia, Africa și Oceania rămân la URL-urile vechi `/flag-quiz/<regiune>`. North America și South America sunt pagini noi.
4. **P4, www → apex:** exista deja în `server/src/security.ts` (redirect 308).
5. **Teste (atunci):** 93/93. Teste noi: `server/test/seo-pack.test.ts` și `server/test/guest-prune.test.ts`.
6. **Deploy:** commit `7be11ab`, deploy din GitHub reușit. Verificat live: toate paginile noi răspund 200, H1-ul e pe `/`, hreflang e prezent, robots e corect, embed-ul poate fi pus în iframe.
7. **IndexNow:** trimis pentru 204 URL-uri (`npm run indexnow -w server`). Scriptul citește acum ambele sitemap-uri.
8. Pe Railway, proiectul creat din greșeală la deploy („overflowing-magic”) a fost redenumit **1v1game**. **Trebuie șters** (vezi mai jos).
9. **Search Console (25 nov):**
   - `sitemap-i18n.xml` a fost trimis. Imediat după trimitere statusul era „Nu s-a putut prelua”; e normal, la fel a fost și primul sitemap, care a trecut apoi pe „Succes”.
   - Request indexing făcut pe 10 URL-uri: `/`, `/es/`, `/ro/`, `/pt/`, `/fr/`, `/de/`, `/it/`, `/quiz-of-the-day/`, `/general-knowledge-questions/`, `/quiz/world-capitals/`.
   - Homepage-ul era deja indexat. Paginile noi apăreau „Descoperită – nu este indexată” sau „Google nu cunoaște adresa”. E normal: indexarea ia de la câteva zile la 2–3 săptămâni pentru un domeniu nou.
10. **Bing:** contul Microsoft nu e logat în Chrome, așa că `sitemap-i18n.xml` NU a fost adăugat manual. Bing a primit oricum toate cele 204 URL-uri prin IndexNow și găsește sitemap-ul în `robots.txt`.

## Ce mai e de făcut, în ordine
1. ~~Șterge proiectul Railway „1v1game”~~ **Făcut pe 26 nov** (`projectDelete: true`). Rămâne doar proiectul **duel**.
2. **Google Search Console, în fiecare zi câteva minute** (limita e de ~10 cereri pe zi; pe 26 nov dimineața cota era încă depășită, deci nimic nou cerut). Request indexing, în ordinea asta:
   - **întâi** paginile jocurilor noi: `/split-the-shape`, `/color-game`, `/mini-golf`, `/timeline-game`, `/estimation-game`, `/guess-the-year`, `/price-guessing-game`, `/followers-game`;
   - apoi paginile pentru căutări generale, adăugate pe 25 nov seara (commit `72723f5`, live, trimise deja prin IndexNow, 210 URL-uri): `/1v1-games`, `/quiz-games`, `/trivia-games`, `/brain-games`, `/2-player-games`, `/geography-games`;
   - `/pl/`, `/tr/`, `/quiz/space/`, `/quiz/music/`, `/quiz/art-literature/`, `/quiz-widget/`;
   - hub-urile pe limbi: `/es/quiz/`, `/ro/quiz/` etc.;
   - paginile cu steaguri: `/flag-quiz/north-america/`, `/es/quiz-banderas/` etc.;
   - categoriile pe limbi.

   Lista completă e în `https://1v1game.net/sitemap-i18n.xml`. Verifică în Sitemaps că `sitemap-i18n.xml` a trecut pe „Succes”. Urmărește raportul Indexare → Pagini: numărul de pagini indexate ar trebui să crească în 1–3 săptămâni.
3. **Bing Webmaster Tools:** loghează-te cu contul Microsoft și adaugă `https://1v1game.net/sitemap-i18n.xml` (`sitemap.xml` e deja trimis).
3b. **Ce mai aduce pagini indexate mai repede:** backlinkuri. Postările din `seo/LAUNCH.md`, listarea pe AlternativeTo, itch.io, CrazyGames/Poki și directoare de quiz-uri, plus widget-ul pus pe bloguri. Fără linkuri externe, Google indexează un domeniu nou încet.
4. **Peste 2–4 săptămâni:** GSC → Performance, filtrat după țară și query. Extinzi paginile care prind afișări.
5. **Features** (detalii în `seo/FEATURE-SPEC.md`):
   - **vs Friend asincron:** link `/c/<cod>`, `noindex`, imagine OG dinamică, share pe WhatsApp/Messenger/Discord. După lansare: `FEATURES.friend = true` în `seo/data/i18n.mjs`, apoi push (build-ul regenerează tot).
   - Opțional: botul să fie marcat clar ca bot în UI (acum are nume uman și doar eticheta „async”).
   - UI-ul jocului în limba vizitatorului (`?lang=`): paginile noi trimit deja `/?lang=es` etc.
6. **Promovare:** după ce Google reindexează homepage-ul, postările din `seo/LAUNCH.md` (Reddit, Product Hunt, HN, AlternativeTo). Le postează utilizatorul.
7. Opțional, din handoff-ul vechi:
   - Railway Variables: `ADMIN_TOKEN` (statistici la `/admin`), `GA4_ID`, `CLARITY_ID`, `CONTACT_EMAIL`;
   - Search Console: verifică că statusul `sitemap.xml` e „Succes”.

## Cum lucrezi pe alt PC
- `git clone https://github.com/JocBZN/1v1game.git`, apoi `npm ci`, apoi `npm run dev` (server pe 3001, client pe 5173).
- Build complet: `npm run build`. Teste: `npm test`.
- Deploy = `git push` pe `main` (Railway face deploy automat). După deploy, dacă s-au schimbat pagini: `npm run indexnow -w server`.
- Railway CLI: `npm i -g @railway/cli`, `railway login`, apoi `railway link` și alegi proiectul **duel**.
- Contul GitHub conectat la Railway are acces la repo (a fost acordat azi).
