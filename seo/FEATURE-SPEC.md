# Specificație: vs Bot · vs Friend · Online pentru rank

Ținta: 3 moduri de joc, cu SEO și creștere gândite de la început. Specificația pornește de la structura actuală a jocului: 3 runde pe teme la întâmplare, câștigi 2 din 3, iar modurile sunt trivia, steaguri, șah, calcul mental și Rubik.

```
             ┌────────────── Play ──────────────┐
             │                                  │
      [vs Bot]            [vs Friend]           [Ranked online]
   instant, fără cont    link /c/<cod>       coadă de matchmaking
   (există azi)          noindex + OG        fallback bot după 10s
                         share nativ         rating + ligi
                                             /leaderboard indexabil
```

---

## 1. vs Bot (există): mici ajustări

- Ecranul de start să spună clar „vs Bot”. Onestitatea scade bounce-ul și protejează reputația.
- Dificultate: Easy / Normal / Hard. Botul răspunde corect cu probabilitatea p (0.5 / 0.7 / 0.85), cu un timp de răspuns aleator în intervalul [1.5 s, 6 s].
- La final de meci: **„Provoacă un prieten pe aceeași temă”**. E principala poartă spre modul vs Friend.

## 2. vs Friend: motorul de creștere (de făcut primul)

### Flux
1. Jucătorul A apasă „Challenge a friend”. Serverul creează o cameră și răspunde cu `{ code: "K7QX2", url: "https://1v1game.net/c/K7QX2" }`.
2. A trimite linkul. Pe mobil: `navigator.share({ title, text, url })`. Pe desktop: butoane WhatsApp, Messenger, Telegram, Discord și „copy link”.
3. B deschide linkul și vede „**Andrei te provoacă la un duel 1v1: Geografie · 3 runde**”, cu butonul „Accept”. Fără cont, ca guest.
4. Ambii sunt în cameră, începe numărătoarea, apoi meciul (aceleași 3 runde).
5. Ecranul de final are butoanele „Revanșă” (aceeași cameră) și „Provoacă pe altcineva”.

### Variante
- **Live:** ambii joacă în același timp, prin socket. Cel mai distractiv, dar cere ca amândoi să fie online.
- **Asincron (recomandat ca prim pas):** A joacă acum, B joacă oricând în următoarele 48 h aceleași întrebări, apoi se compară scorurile. Merge mereu, chiar și cu trafic mic, și e același model ca la QuizDuel.

### Date (exemplu)
```
challenges(id, code UNIQUE, creator_id, mode, topic, seed, status[open|playing|done|expired],
           created_at, expires_at)        -- seed => aceleași întrebări pentru ambii
challenge_results(challenge_id, player_id, score, time_ms, finished_at)
```

### SEO și share (contează enorm)
- `/c/<cod>` este **`noindex`**: `<meta name="robots" content="noindex">` plus header-ul `X-Robots-Tag: noindex`. Linkurile de provocare nu trebuie să apară în Google.
- **Imagine OG dinamică** per provocare, de exemplu `/og/c/K7QX2.png` (1200×630): „Andrei te provoacă · Geografie · Poți să-l bați?”. Pe Node se face cu `satori` + `@resvg/resvg-js`, cu cache 24 h. Previzualizarea din WhatsApp e cea care decide dacă linkul e deschis.
- `og:title`, `og:description` și `og:image` se randează **pe server** pentru `/c/:code`. Crawlerele WhatsApp și Facebook nu rulează JavaScript.
- Linkurile expirate redirecționează 302 spre `/?from=expired-challenge`. Nu servi 404 utilizatorilor.

### Metrici
`challenge_created`, `challenge_shared(channel)`, `challenge_opened`, `challenge_accepted`, `challenge_finished`, `rematch`.
**K-factor** = provocări trimise per jucător × rata de acceptare. Peste 0.3–0.5, creșterea se vede fără reclame.

## 3. Online pentru rank: retenția

### Matchmaking
- Coadă pe mod de joc. Fereastra de rating pornește la ±100 și se lărgește cu 50 la fiecare 3 secunde.
- **Fallback după 10 s:** „Nu am găsit pe nimeni, joci contra unui bot?” cu butoanele [Da] și [Mai aștept]. Botul e afișat **clar** ca bot. Meciurile cu boți nu dau puncte de rank, sau dau doar 25%. Altfel rank-ul nu mai înseamnă nimic.
- Server autoritar: întrebările, cronometrul și validarea răspunsurilor sunt pe server. Clientul nu primește răspunsul corect înainte să răspundă.

### Rating și ligi
- **Glicko-2**, sau Elo cu K=32 pentru primele 20 de meciuri și K=16 după.
- Ligi (pe pagina how-to-play apar deja): Bronze < 1000 ≤ Silver < 1200 ≤ Gold < 1400 ≤ Platinum < 1600 ≤ Diamond < 1800 ≤ Legend.
- Sezoane de 4 săptămâni, cu soft reset (rating = 0.75 × rating + 0.25 × 1200). Așa ai un motiv să revii lunar și un subiect de postare pe social media la fiecare sezon.

### Pagini publice (SEO)
- **`/leaderboard`**: indexabil, randat pe server sau regenerat static o dată pe zi. Top 100 pe sezon și pe mod. Title: *„Trivia Leaderboard – Top 1v1 Quiz Players This Season | 1v1game”*. Conținutul se schimbă zilnic, iar Google preferă paginile proaspete.
- `/leaderboard/<mod>` (trivia, flags, chess, math, cube): câte o pagină pe intenție de căutare („flag quiz leaderboard”, „chess puzzle rating”).
- `/u/<nume>` (profil): **`noindex`** la început, ca să nu ai mii de pagini subțiri. Indexabil doar peste 50 de meciuri.

### Ce faci în pachetul SEO când lansezi
În `seo/data/i18n.mjs`:
```js
export const FEATURES = { friend: true, ranked: true };   // pe măsură ce le lansezi
```
Apoi `node seo/scripts/build.mjs` și `node seo/scripts/indexnow.mjs`. Toate textele, FAQ-ul și schema se actualizează în 9 limbi.

## Ordinea recomandată
1. Fix-ul pentru `/api/guest` și copy-ul onest (PATCHES.md, P1–P2): o zi.
2. vs Friend în varianta asincronă, cu OG dinamic: cel mai mare impact pe useri.
3. Ranked cu fallback pe bot și `/leaderboard`.
4. vs Friend live, peste cel asincron.
