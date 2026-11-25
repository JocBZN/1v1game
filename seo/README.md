# Pachet SEO pentru 1v1game.net

Pachetul adaugă un strat multilingv peste ce are deja site-ul. Paginile englezești existente (`/`, `/quiz`, `/quiz/geography`, `/flag-quiz` etc.) rămân neatinse. Nu suprascrie `robots.txt`, `sitemap.xml`, manifestul, iconițele sau `og.png`.

```
seo-pack/
  PATCHES.md             ce schimbi în cod, în ordinea priorității (P1 = homepage-ul gol)
  FEATURE-SPEC.md        specificație vs Bot / vs Friend / Ranked, cu SEO inclus
  LAUNCH.md              texte gata de postat: Reddit, Product Hunt, HN, AlternativeTo, TikTok
  data/i18n.mjs          copy + cuvinte-cheie pe limbă (EN, ES, PT, FR, DE, IT, RO, PL, TR) + comutatoarele FEATURES
  data/questions*.mjs    506 întrebări × 9 limbi (9 categorii × 55–57); lotul 3 în data/qx-*.mjs
  scripts/check-questions.mjs  verifică banca: toate limbile, fără duplicate
  scripts/build.mjs      generează public/ și snippets/
  scripts/check.mjs      validare: linkuri rupte, title/description, JSON-LD, hreflang
  scripts/indexnow.mjs   trimite URL-urile la Bing/Yandex după deploy
  scripts/preview.mjs    preview local: http://localhost:4173/ro/
  server/seo.cjs         middleware Express opțional (redirect www → apex, 404 reale)
  snippets/lang-links.html   linkuri spre limbi, de pus în footer-ul paginilor englezești
  public/                ce se publică: 181 de pagini noi (inclusiv întrebări și răspunsuri, quiz-ul zilei,
                         steaguri pe continente, widget), /embed/, /flags/, sitemap-i18n.xml (189 URL-uri),
                         llms.txt, cheia IndexNow
  studio/                Shorts studio (shorts.html + captions-<lang>.txt), nu se publică; vezi LAUNCH.md
  HANDOFF.md             contextul pentru Claude-ul de acasă
```

Ce se generează:
- `/es/ /pt/ /fr/ /de/ /it/ /ro/ /pl/ /tr/`: pagini de prezentare localizate;
- `/<limbă>/quiz/`: hub de categorii;
- `/<limbă>/quiz/<categorie>/`: 9 quiz-uri × 15 întrebări cu răspunsuri, pe fiecare limbă;
- `/quiz/world-capitals/`, `/quiz/space/`, `/quiz/music/`, `/quiz/art-literature/`: categorii englezești noi, pe care site-ul nu le are încă;
- `sitemap-i18n.xml`: include și URL-urile englezești existente, cu hreflang spre traduceri. Așa nu trebuie modificat `<head>`-ul paginilor englezești.

Comenzi: `node scripts/build.mjs`, apoi `node scripts/check.mjs` (trebuie să afișeze „No problems found”).

---

## 0. Ce am verificat live (Search Console, 25 nov 2026)

| Verificare | Rezultat |
|---|---|
| Proprietate de tip Domain | ✅ `sc-domain:1v1game.net` există, verificată prin TXT |
| `https://1v1game.net/` | ✅ indexată, status 200, canonical `https://1v1game.net/`, acceptat de Google |
| `/quiz/geography` | ✅ indexată: 22 de întrebări, H1, 31 de linkuri, breadcrumbs + „Practice problems” valide |
| sitemap.xml | ✅ citit cu succes pe 24 nov, 27 de pagini |
| Rich results | ✅ 14 breadcrumbs valide, 7 „Practice problems” valide |
| **Home după randare** | ❌ **Google vede doar „Can’t reach the server · Try again”**: fără H1, fără text, 0 linkuri |
| `www.1v1game.net` | ⚠️ răspunde 200 (cu canonical spre apex) în loc de 301, și randarea arată tot „Can’t reach the server” |
| DNS apex | ✅ `@` e CNAME aplatizat → `z3mfxgkl.up.railway.app` (de aici IP-ul `153.52.255.113`). `www` e CNAME corect. Ambele TXT Railway există |

### ❌ Problema #1: robots.txt blochează API-ul de care are nevoie pagina principală

În testul live, „Resursele paginii” arată: **Googlebot blocat de robots.txt pentru `https://1v1game.net/api/guest` (XHR)**. Aplicația React nu primește sesiunea de guest și afișează ecranul de eroare „Can’t reach the server”. Ecranul acesta **înlocuiește** blocul SEO static din `#root` (H1, text, linkurile spre `/quiz/...`). Rezultatul: Google indexează pagina principală aproape goală.

Fix (în codul jocului, ambele recomandate):
1. **Aplicația nu trebuie să șteargă conținutul dacă `/api/guest` eșuează.** Păstrează landing-ul (H1, descrierea, linkurile, butonul Play) și arată eroarea doar când utilizatorul apasă Play. Sau cere guest-ul abia la Play, nu la încărcarea paginii.
2. În `robots.txt`, permite endpoint-ul strict necesar randării:
   ```
   User-agent: *
   Allow: /api/guest
   Disallow: /api/
   ```
   (Google aplică regula cea mai specifică, deci `Allow: /api/guest` câștigă.) Dacă alegi asta, asigură-te că un guest creat de Googlebot nu umple baza de date: TTL scurt sau fără scriere în DB.

După deploy: URL Inspection → `https://1v1game.net/` → „Test live URL” → „View tested page” → HTML. Trebuie să apară H1-ul „Online quiz game: 1v1 trivia battles…”, nu „Can’t reach the server”. Apoi „Request indexing”.

### ❌ Problema #2: site-ul live promite „real people”, dar azi se joacă doar contra unui bot

Titlul, descrierea și OG-ul homepage-ului spun *„Trivia Battles vs Real People”*, *„against real people”*, *„get a real opponent in seconds”*. Cine vine din Google și descoperă că joacă contra unui bot pleacă repede, și asta se vede în ranking. Până lansezi online-ul, înlocuiește în `index.html`:

```html
<title>1v1 Trivia Quiz Online – General Knowledge Quiz Duels | 1v1game</title>
<meta name="description" content="Free 1v1 trivia quiz in your browser: general knowledge duels with 1,200+ questions, plus a flag quiz, chess puzzles and mental math. No download, no sign-up.">
<meta property="og:title" content="1v1 trivia quiz – general knowledge duels in your browser">
```

În textul static (H1): *„Online quiz game: 1v1 trivia duels”*. În loc de „get a real opponent in seconds”: *„Press Play and your duel starts instantly”*. Același lucru în JSON-LD-ul `WebSite`/`VideoGame`.

Toate paginile din pachet sunt scrise deja așa. Prietenii și rank-ul online stau pe două comutatoare în `data/i18n.mjs`:

```js
export const FEATURES = { friend: false, ranked: false };
```

Cât sunt `false`, textele spun „în curând” / „coming soon” / „próximamente”…. Când lansezi o funcție, pui `true` și rulezi `node scripts/build.mjs`: textele, FAQ-ul, schema și `llms.txt` se schimbă singure în toate cele 9 limbi.

### ⚠️ www → 301
`www.1v1game.net` servește pagina cu 200. Canonical-ul limitează paguba, dar un 301 spre `https://1v1game.net` e mai curat: consolidează linkurile și nu se mai randează de două ori. Ai două variante:
- în server: `seoBefore()` din `server/seo.cjs`;
- fără cod: o „URL redirect” `www` → `https://1v1game.net` în Spaceship. Atenție: în cazul ăsta `www` nu mai poate fi CNAME spre Railway.

### ✅ DNS apex (verificat în Spaceship pe 25 nov 2026)
Root-ul `@` e deja **CNAME → `z3mfxgkl.up.railway.app`**, iar Spaceship îl aplatizează (CNAME flattening). De aici vine IP-ul `153.52.255.113` pe care îl vedeau interogările DNS: e rezultatul aplatizării, nu un record A fix. Exact asta recomandă Railway, deci **nu e nimic de schimbat**.

Recordurile din Spaceship (5):
- `@` CNAME → `z3mfxgkl.up.railway.app`
- `www` CNAME → `aw766q7g.up.railway.app`
- TXT `_railway-verify` (pentru apex)
- TXT `_railway-verify.www`
- TXT `@` `google-site-verification` (verificarea Search Console)

Nu le șterge pe niciunul.

## 1. Integrare (când ai codul)

1. Copiază folderul în repo ca `seo/` și rulează `node seo/scripts/build.mjs`.
2. Servește `seo/public/` la rădăcina site-ului:
   - Vite: copiază conținutul în `public/` (sau setează build-ul să-l copieze);
   - Express: `app.use(express.static('seo/public'))` înainte de fallback-ul SPA.

   Fallback-ul SPA (`*` → index.html) nu trebuie să intercepteze `/es/`, `/ro/` etc.
3. Pune `snippets/lang-links.html` în footer-ul paginilor englezești existente (home, `/quiz`, quiz-uri), ca traducerile să fie descoperite și prin linkuri.
4. Adaugă `/quiz/space/`, `/quiz/music/` și `/quiz/art-literature/` în lista de categorii de pe `/quiz` (sunt categorii noi în engleză).
5. În `robots.txt` adaugă linia `Sitemap: https://1v1game.net/sitemap-i18n.xml` (pe lângă cel existent).
6. Opțional: `server/seo.cjs` (redirect www → apex, 404 reale în loc de soft-404).
7. Dacă jocul are deja propriul sistem care generează paginile `/quiz/...` (pare că da), cel mai curat e ca `data/i18n.mjs` și `data/questions.mjs` să fie folosite de acel sistem, în loc de un folder separat.

## 2. După deploy

1. GSC → Sitemaps → trimite `https://1v1game.net/sitemap-i18n.xml`.
2. URL Inspection → „Request indexing” pe `/`, `/es/`, `/pt/`, `/fr/`, `/de/`, `/ro/` (limita e de câteva pe zi).
3. **Bing Webmaster Tools** → „Import from Google Search Console” (un click). Bing alimentează ChatGPT Search și Copilot.
4. `node seo/scripts/indexnow.mjs`: trimite instant toate URL-urile la Bing, Yandex, Seznam și Naver.
5. Peste 2–4 săptămâni: GSC → Performance, filtrat după țară și query. Extinzi întâi paginile care prind impresii.

---

## 3. Cuvinte-cheie

**Date reale din Bing Webmaster Tools** (afișări în Bing, 25 aug – 22 nov 2026, global). Volumele din Google sunt de obicei de 5–10× mai mari:

| Cuvânt-cheie | Afișări | Notă |
|---|---|---|
| quiz | 360.5K | prea general, se câștigă prin pagini de categorie |
| quizzes | 192.7K | |
| trivia | 56.7K | |
| general knowledge quiz | 37K | pagina `/quiz/general-knowledge` (are deja 60 de întrebări) |
| trivia questions | 32.7K | |
| **world capitals quiz** | **29.9K** | → am adăugat categoria nouă **Capitals** în 9 limbi |
| quiz games | 21.9K | |
| quiz culture générale (FR) | 20.6K | → `/fr/` |
| trivia games / trivia quiz | 14.2K / 9.2K | concurenți în top 10: Britannica, FunTrivia, Sporcle, **TriviaDuel.com**, Quiz.com |
| music quiz | 7.5K | |
| preguntas de cultura general (ES) | 6.5K | → `/es/` |
| allgemeinwissen quiz (DE) | 6.1K | + „quiz allgemeinwissen” 1.3K, „quizfragen allgemeinwissen” 1K |
| quizy z wiedzy ogólnej (PL) | 1.6K | → am schimbat formularea pe `/pl/quiz/` (forma „quiz wiedzy ogólnej” are doar 217) |
| quiz cultura generale (IT) | 1.6K | |
| capitals quiz / capital cities quiz | 1.3K / 1.3K | |
| perguntas de conhecimentos gerais (PT) | 383 | Bing e mic în Brazilia; în Google volumul e mult mai mare |
| genel kültür soruları (TR) | 244 | la fel: Bing e marginal în Turcia |

Pe „1v1 game” rezultatele sunt dominate de *1v1.LOL* (shooter). Folosește „1v1” ca modificator în nișa de quiz: „1v1 trivia”, „quiz duel”, „trivia battle”.

| Limbă | Cuvinte-cheie principale (în title, H1, intro) |
|---|---|
| EN | 1v1 trivia, online quiz game, trivia questions and answers, general knowledge quiz, quiz battle, trivia game vs bot / single player, space quiz, music quiz. După `friend`: play trivia with friends online. După `ranked`: ranked trivia, trivia leaderboard |
| ES | preguntas de cultura general, trivia online, juego de preguntas y respuestas, duelo 1 contra 1 |
| PT | perguntas de conhecimentos gerais, quiz online, jogo de perguntas e respostas, quiz 1x1 / X1 |
| FR | quiz culture générale, questions de culture générale, jeu de quiz en ligne, duel 1 contre 1 |
| DE | Allgemeinwissen Quiz, Quizfragen mit Antworten, Quiz online spielen, 1 gegen 1 |
| IT | quiz cultura generale, domande di cultura generale, gioco a quiz online, sfida 1 contro 1 |
| RO | test cultură generală, întrebări de cultură generală, joc de cultură generală, duel 1 la 1 |
| PL | quiz wiedzy ogólnej, pytania z wiedzy ogólnej, quiz online, pojedynek 1 na 1 |
| TR | genel kültür soruları, bilgi yarışması, genel kültür testi, 1’e 1 düello |

Mărcile înregistrate (QuizDuel, Preguntados, Kahoot, Trivia Crack) nu apar intenționat în copy.

## 4. Următorii pași cu cel mai mare impact

1. **Fix-ul `/api/guest`** (secțiunea 0): fără el, pagina principală e practic goală pentru Google.
2. **Copy onest pe homepage-ul live** (problema #2).
3. **Cele 3 moduri de joc.** Din punct de vedere SEO și de creștere, fiecare mod are rolul lui:
   - **vs Bot** (există): e „produsul” pe care îl găsește Google. Joc instant, fără așteptare, și explică de ce site-ul merge și cu puțini useri online.
   - **vs Friend** (de făcut): e **motorul de creștere**, pentru că fiecare meci aduce un user nou. Link de provocare `1v1game.net/c/<cod>`:
     - imagine OG personalizată („Andrei te provoacă la un duel de cultură generală”);
     - `noindex` pe acele pagini;
     - butoane de share pentru WhatsApp, Messenger și Discord.

     După lansare: `FEATURES.friend = true`.
   - **Online pentru rank** (de făcut): e **retenția**. Ai nevoie de matchmaking cu fallback pe bot după X secunde, ca nimeni să nu aștepte în gol când sunt puțini jucători online. Adaugă un `/leaderboard` public, indexabil, actualizat zilnic (conținut proaspăt pentru Google). După lansare: `FEATURES.ranked = true`.
4. **UI-ul jocului în limba vizitatorului** (citește `?lang=`). Altfel traficul din ES, PT, DE intră într-un joc în engleză.
5. **Mai multe pagini din cele 1.200 de întrebări**: *flags quiz* pe continente, *capitals quiz*, *Harry Potter quiz*, *hard trivia questions*, *trivia for kids*, *true or false questions*. Pe fiecare limbă.
6. **Daily Quiz `/daily/`** cu rezultat partajabil (grilă emoji, în stil Wordle).
7. **Card de rezultat partajabil** după meci, cu OG dinamic („Am câștigat 2–1 la Duel”), pe `noindex`.
6. **Distribuție:**
   - Reddit: r/WebGames, r/trivia, r/chess pentru puzzle-uri, r/Cubers pentru cubul 3D;
   - Product Hunt și „Show HN”;
   - AlternativeTo, CrazyGames și Poki (program pentru dezvoltatori), itch.io;
   - clipuri scurte pe TikTok/Shorts.

