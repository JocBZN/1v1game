# HANDOFF: context pentru Claude-ul de acasă

> **Pentru Claude:** citește întâi acest fișier, apoi `PATCHES.md`, `README.md` și `FEATURE-SPEC.md`. Utilizatorul vorbește română. Totul de mai jos a fost lucrat pe 25 nov 2026 într-o sesiune fără acces la cod. Acum ai codul, așa că aplică patch-urile.

## Proiectul
- **1v1game.net**: joc de dueluri 1v1 în browser („Duel”), best of three. Fiecare meci are 3 runde pe teme la întâmplare: trivia (1.200+ întrebări, 12 categorii), steaguri (194), probleme de șah, calcul mental, cub Rubik 3D.
- Stack observat din exterior: Vite SPA (`/assets/index-*.js`), hostat pe Railway. Are un bloc SEO static în `<div id="root">`. API-ul e la `/api/*`, de exemplu `/api/guest`.
- Obiectivul utilizatorului: SEO maxim și cât mai mulți useri. Engleza e limba principală, plus cât mai multe alte limbi.
- **Azi se joacă DOAR contra unui bot.** Nu există încă invitații pentru prieteni și nici online/rank. Pe viitor vrea trei moduri: **vs Bot, vs Friend, Ranked online** (vezi FEATURE-SPEC.md). Textele de pe site trebuie să fie oneste: fără „real players” sau „live” până când modurile astea chiar există.

## Ce e deja făcut (nu repeta)
- **Google Search Console:** proprietatea `sc-domain:1v1game.net` e verificată. `sitemap.xml` a fost citit pe 24 nov (27 de pagini). Paginile sănătoase sunt indexate. Rich results: 14 breadcrumbs, 7 practice problems.
- **Audit URL Inspection (13 pagini):** doar homepage-ul `/` e stricat. Googlebot vede „Can’t reach the server · Try again”, fără H1 și cu 0 linkuri. Cauza: `robots.txt` are `Disallow: /api/`, deci `/api/guest` e blocat, iar React înlocuiește landing-ul cu ecranul de eroare.
- **Bing Webmaster Tools:** site-ul a fost importat din GSC și `sitemap.xml` a fost trimis. Datele de cuvinte-cheie sunt în README.
- **DNS (Spaceship), verificat, e OK:** `@` CNAME aplatizat → `z3mfxgkl.up.railway.app`, `www` CNAME → `aw766q7g.up.railway.app`, plus două TXT `_railway-verify` și TXT `google-site-verification`. Nu e nimic de schimbat.
- **Pachetul SEO** (folderul ăsta): 92 de pagini statice de bază, plus paginile de creștere de mai jos. Sunt landing-uri, hub-uri și categorii în es/pt/fr/de/it/ro/pl/tr, plus categorii englezești noi (space, music, art-literature, world-capitals), `sitemap-i18n.xml` cu hreflang, `llms.txt` și cheia IndexNow. Fiecare categorie are 15 întrebări.
  - Textele depind de `FEATURES = { friend:false, ranked:false }` din `data/i18n.mjs`.
  - Build: `node scripts/build.mjs`. Validare: `node scripts/check.mjs` (ultimul rezultat: 0 probleme).
- **Pagini de creștere** (adăugate tot pe 25 nov, după prima arhivă): 181 de pagini în total.
  - întrebări și răspunsuri (180 de întrebări, câte 20 din fiecare categorie);
  - quiz-ul zilei, cu scor și share cu 🟩🟥;
  - steaguri pe 6 continente, cu SVG-uri proprii în `/flags/`;
  - widget de quiz pentru alte site-uri (`/quiz-widget/` + `/embed/<lang>.html`), care aduce backlinkuri;
  - toate în 9 limbi.

  Detalii în PATCHES.md, P3b: excepția pentru iframe pe `/embed/` și snippet-urile de link-uri interne.
- **Banca de întrebări a pachetului: 506**, adică 9 categorii × 55–57, toate în 9 limbi. Lotul nou e în `data/qx-*.mjs`, ca rânduri compacte `[en, es, pt, fr, de, it, ro, pl, tr, răspuns]`. Validare: `node scripts/check-questions.mjs`. Asta e banca paginilor SEO, nu cea a jocului (jocul are 1.200+ întrebări proprii, doar în engleză). Merită unificate: jocul ar putea folosi traducerile de aici.
- **Shorts studio:** `studio/shorts.html` (generat de `node scripts/shorts.mjs`). Are 100 de clipuri verticale × 9 limbi, exportate ca MP4 direct din browser, iar descrierile cu hashtag-uri sunt în `studio/captions-<lang>.txt`. Nu face parte din site.
- **Raportul săptămânal programat** rulează pe PC-ul de la birou, nu acasă.

## Ce ai de făcut acum, cu codul (ordinea din PATCHES.md)
1. **P1, homepage-ul:**
   - în `robots.txt`: `Allow: /api/guest` înainte de `Disallow: /api/`, plus ambele sitemap-uri;
   - în app: landing-ul (H1, text, linkuri) se randează mereu, iar `/api/guest` se cere abia la Play, cu eroarea afișată ca toast, nu pe tot ecranul.
2. **P2, copy onest** pe `/`, `/trivia`, `/chess-puzzles`, `/rubiks-cube`, `/how-to-play`: tabelul e în PATCHES.md. Corectează și în JSON-LD.
3. **P3, integrare:** copiază folderul ăsta în repo ca `seo/` și servește `seo/public/` la root înainte de fallback-ul SPA. Pune `snippets/lang-links.html` în footer-ul paginilor EN. Adaugă categoriile EN noi în grila de pe `/quiz`.
4. **P4, `www` → 301 spre apex:** dacă serverul e Express, folosește `server/seo.cjs` (`seoBefore()`).
5. **Testează local**, apoi lasă utilizatorul să facă deploy pe Railway (de obicei prin push).
6. **După deploy (P5):**
   - rulează `node seo/scripts/indexnow.mjs`;
   - în GSC: Test live URL pe `/` (trebuie să apară H1-ul), Request indexing pe `/` și pe `/es/ /pt/ /fr/ /de/ /ro/`, apoi trimite `sitemap-i18n.xml`;
   - în Bing: adaugă și `sitemap-i18n.xml`.
7. **Apoi features:** vs Friend asincron cu link `/c/<cod>` (noindex + OG dinamic), apoi Ranked cu fallback pe bot și `/leaderboard`. Când se lansează, pune `FEATURES` pe `true` și rebuild.

## Reguli
- Nu inventa claim-uri („real players”, „live”, „friend link”) până nu există în joc.
- `LAUNCH.md` conține postări pentru Reddit, PH, HN etc. Le postează utilizatorul, **după** fix-ul P1.
