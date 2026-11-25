# Patch-uri de aplicat când ai codul (în ordinea priorității)

Audit Search Console din 25 nov 2026: 13 pagini verificate, toate indexate. Paginile de quiz, `/flag-quiz`, `/chess-puzzles`, `/mental-math`, `/rubiks-cube`, `/trivia`, `/how-to-play` și `/quiz` se randează corect. **Singura pagină stricată e homepage-ul `/`.**

---

## P1. Homepage-ul nu mai trebuie să se golească dacă `/api/guest` eșuează

**Ce se întâmplă:** robots.txt are `Disallow: /api/`. Googlebot nu poate apela `/api/guest`, aplicația React afișează „Can’t reach the server · Try again”, iar ecranul ăsta **înlocuiește** blocul SEO static din `<div id="root">` (H1, text, 14 linkuri). Google vede pagina principală goală. Același lucru îl vede și un utilizator real dacă API-ul pică o secundă.

### P1a. robots.txt (2 minute)
```
User-agent: *
Allow: /api/guest
Disallow: /api/

Sitemap: https://1v1game.net/sitemap.xml
Sitemap: https://1v1game.net/sitemap-i18n.xml
```
`Allow` mai specific câștigă în fața `Disallow` (regulă Google și Bing). Verifică însă că un guest creat de un bot nu umple baza de date: TTL scurt, sau guest fără scriere în DB până la primul meci.

### P1b. Aplicația (fix-ul corect)
Caută în cod unde se cheamă `/api/guest` la pornire și unde se afișează „Can’t reach the server”. Pattern-ul de urmat:

```jsx
// ÎNAINTE (probabil): eroarea înlocuiește tot
function App() {
  const { guest, error } = useGuestOnMount();          // fetch('/api/guest') în useEffect
  if (error) return <ServerError />;                   // ← șterge landing-ul pentru Google
  if (!guest) return <Spinner />;                      // ← la fel
  return <Home guest={guest} />;
}

// DUPĂ: landing-ul se randează mereu, sesiunea se cere abia la Play
function App() {
  const [guest, setGuest] = useState(null);
  const [error, setError] = useState(null);

  async function ensureGuest() {
    if (guest) return guest;
    try {
      const r = await fetch('/api/guest', { method: 'POST', credentials: 'include' });
      if (!r.ok) throw new Error(String(r.status));
      const g = await r.json(); setGuest(g); return g;
    } catch (e) { setError(e); return null; }
  }

  return (
    <>
      <Home onPlay={async () => { const g = await ensureGuest(); if (g) startMatch(g); }} />
      {error && <Toast>Can’t reach the server. <button onClick={ensureGuest}>Try again</button></Toast>}
    </>
  );
}
```

Regula de bază: **H1-ul, textul și linkurile homepage-ului nu depind niciodată de un request.** Dacă blocul SEO static e în `#root`, React îl înlocuiește la mount. Fie îl randezi și din React, cu același text, fie îl muți în afara lui `#root`, sub joc.

**Verificare:** Search Console → URL Inspection `https://1v1game.net/` → Test live URL → View tested page → HTML. Trebuie să apară H1-ul, nu „Can’t reach the server”. Apoi **Request indexing**.

---

## P2. Copy onest (azi se joacă doar contra unui bot)

| Pagina | Acum | Înlocuiește cu |
|---|---|---|
| `/` title | Online Quiz Game 1v1 – Trivia Battles vs Real People \| 1v1game | **1v1 Trivia Quiz Online – General Knowledge Quiz Duels \| 1v1game** |
| `/` description | …against real people: live 1v1 trivia battles… | **Free 1v1 trivia quiz in your browser: general knowledge duels with 1,200+ questions, plus a flag quiz, chess puzzles and mental math. No download, no sign-up.** |
| `/` og:title | Online quiz game 1v1 – trivia battles against real people | **1v1 trivia quiz – general knowledge duels in your browser** |
| `/` H1 | Online quiz game: 1v1 trivia battles against real people | **Online quiz game: 1v1 trivia duels** |
| `/` text | Press Play and get a real opponent in seconds. | **Press Play and your duel starts instantly.** |
| `/trivia` title | 1v1 Trivia Quiz Online – Live Trivia Duels | **1v1 Trivia Quiz Online – Instant Trivia Duels** |
| `/trivia` H1 | 1v1 trivia duels, live | **1v1 trivia duels** |
| `/chess-puzzles` title | Chess Puzzles Duel Online – Mate in 1, Mate in 2 vs Real Players | **Chess Puzzles Duel Online – Mate in 1, Mate in 2 Races** |
| `/chess-puzzles` H1 | Chess puzzle races against real players | **Chess puzzle races, 1v1** |
| `/rubiks-cube` title | Rubik’s Cube Online – Solve a 3D Cube vs a Real Player | **Rubik’s Cube Online – Solve a Real 3D Cube, 1v1** |
| `/how-to-play` text | Press Play and you are matched with someone of a similar rating… | **Press Play and your duel starts instantly against a bot. Friend duels and ranked online matches are coming soon.** |

Fă același lucru și în JSON-LD-ul `WebSite` / `VideoGame` (câmpul `description`). Când lansezi online-ul, poți reveni la „real players”: atunci va fi adevărat.

---

## P3. Paginile în 8 limbi + sitemap-ul cu hreflang

1. Copiază `seo-pack/` în repo ca `seo/`.
2. Build: `node seo/scripts/build.mjs`. Generează `seo/public/`: 181 de pagini, plus `/embed/` și `/flags/`.
3. Servește `seo/public/` la rădăcina site-ului:
   - **Vite:** copiază conținutul în `public/` înainte de `vite build`, de exemplu cu `"prebuild": "node seo/scripts/build.mjs && cp -r seo/public/* public/"`;
   - **Express:** `app.use(express.static(path.join(__dirname, 'seo/public')))` **înainte** de fallback-ul SPA.
4. Fallback-ul SPA (`*` → index.html) nu trebuie să prindă `/es/`, `/ro/`, `/quiz/space/` etc. Static-ul pus înainte rezolvă asta.
5. Pune `seo/snippets/lang-links.html` în footer-ul paginilor englezești.
6. Adaugă `/quiz/world-capitals/`, `/quiz/space/`, `/quiz/music/` și `/quiz/art-literature/` în grila de pe `/quiz` (sunt categorii englezești noi).

### P3b. Paginile de creștere (adăugate pe 25 nov 2026, incluse în cele 181 de pagini)
| Ce | Engleză | Celelalte 8 limbi |
|---|---|---|
| Întrebări și răspunsuri (180: câte 20 din fiecare categorie) | `/general-knowledge-questions/` | de ex. `/es/preguntas-de-cultura-general/`, `/ro/intrebari-cultura-generala/` |
| Quiz-ul zilei (10 întrebări/zi, scor + share cu 🟩🟥) | `/quiz-of-the-day/` | `/es/quiz-del-dia/`, `/ro/quiz-ul-zilei/`… |
| Steaguri pe continente (6 × 9 limbi) | `/flag-quiz/europe/` etc. | `/es/quiz-banderas/` (+ hub), `/ro/quiz-steaguri/europa/`… |
| Widget de quiz pentru alte site-uri | `/quiz-widget/` | `/es/widget-de-quiz/`, `/ro/widget-quiz/`… |
| Pagina din iframe (noindex) | `/embed/en.html` | `/embed/<lang>.html` |
| Steaguri SVG proprii (flag-icons, MIT) | `/flags/<cod>.svg` | |

De făcut în cod:
1. **Fallback-ul SPA nu trebuie să prindă `/flag-quiz/<continent>/`**: static-ul servit înainte rezolvă asta, exact ca la P3.
2. **`/embed/*` trebuie să poată fi pus în iframe pe alte site-uri.** Dacă serverul trimite `X-Frame-Options: DENY/SAMEORIGIN` sau CSP cu `frame-ancestors`, fă o excepție doar pentru `/embed/`:
   ```js
   app.use('/embed', (req, res, next) => { res.removeHeader('X-Frame-Options'); res.setHeader('Content-Security-Policy', "frame-ancestors *"); next(); });
   ```
   Restul site-ului păstrează protecția anti-iframe.
3. **Link-uri interne de pe paginile englezești existente:**
   - `snippets/flag-continents.html` pe `/flag-quiz`;
   - `snippets/home-links.html` pe `/` și pe `/quiz`.
4. **Quiz-ul zilei se schimbă singur în browser**, fără cron. Un rebuild săptămânal (`node seo/scripts/build.mjs` la deploy) ține și HTML-ul static proaspăt pentru Google.
5. Licența flag-icons e în `data/flags/LICENSE-flag-icons.txt`. Păstreaz-o în repo.

## P4. www → 301 și DNS apex

- Express: `app.use(require('./seo/server/seo.cjs').seoBefore())` ca prim middleware. Redirecționează `www` și `*.up.railway.app` spre `https://1v1game.net`.
- DNS: e deja corect (CNAME aplatizat pe root, verificat în Spaceship pe 25 nov 2026). Nu e nimic de schimbat.

## P5. După deploy
```powershell
node seo/scripts/indexnow.mjs
```
Apoi trimite în Search Console `https://1v1game.net/sitemap-i18n.xml` și cere „Request indexing” pentru `/`, `/es/`, `/pt/`, `/fr/`, `/de/` și `/ro/`. În Bing, site-ul și `sitemap.xml` sunt deja adăugate (25 nov 2026); adaugă acolo și `sitemap-i18n.xml`.
