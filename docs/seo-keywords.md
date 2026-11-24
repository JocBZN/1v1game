# SEO keyword map — 1v1game.net

One page per search intent. Never target the same head term with two pages (cannibalisation); link
supporting pages up to their hub. Search volumes are not measured here: priorities come from intent and
how commercial/competitive each query family usually is. Validate with Search Console data after ~4 weeks
(Performance → Queries) and move winning queries into titles/H1s.

| Page | Primary keyword | Secondary / long tail | Intent |
| --- | --- | --- | --- |
| `/` | online quiz game | 1v1 quiz, quiz battle, trivia game online, multiplayer quiz, quiz against real people, brain games online | play now |
| `/quiz` | free online quizzes | trivia questions and answers, quiz games, online trivia, quiz with answers | browse |
| `/quiz/general-knowledge` | general knowledge quiz | general knowledge questions and answers, pub quiz questions, trivia quiz free | practise |
| `/quiz/history` | history quiz | history trivia questions, world history quiz, ancient history quiz, ww2 quiz | practise |
| `/quiz/geography` | geography quiz | capital cities quiz, world capitals quiz, rivers quiz, countries quiz | practise |
| `/quiz/science` | science quiz | science trivia questions, chemistry quiz, physics quiz, space quiz | practise |
| `/quiz/sports` | sports quiz | sports trivia questions, olympics quiz, tennis quiz, f1 quiz, nba quiz | practise |
| `/quiz/football` | football quiz | soccer trivia, champions league quiz, world cup quiz, premier league quiz | practise |
| `/quiz/movies-music` | movie quiz | music quiz, film trivia, oscars quiz, guess the band | practise |
| `/quiz/tv-shows` | tv show quiz | friends quiz, game of thrones quiz, netflix quiz, sitcom trivia | practise |
| `/quiz/medical` | medical quiz | human body quiz, anatomy quiz, health trivia, nursing quiz | practise |
| `/quiz/math` | math quiz | maths trivia, mental math quiz, roman numerals quiz | practise |
| `/quiz/technology` | technology quiz | tech quiz, computer quiz, programming quiz, video game trivia | practise |
| `/quiz/beauty` | beauty quiz | makeup quiz, skincare quiz, perfume quiz | practise |
| `/quiz/celebrities` | celebrity quiz | famous people quiz, who am I quiz, pop culture quiz | practise |
| `/flag-quiz` | flag quiz | guess the flag, flags of the world quiz, country flags game | play |
| `/flag-quiz/{europe,asia,africa,americas,oceania}` | flags of europe (etc.) | european flags with names, all flags of africa | learn |
| `/trivia` | trivia game online | 1v1 trivia, live trivia, trivia battle | play |
| `/chess-puzzles` | chess puzzles online | mate in 1, mate in 2 puzzles, chess tactics game | play |
| `/mental-math` | mental math game | speed math, arithmetic game, math battle | play |
| `/rubiks-cube` | rubik's cube online | rubik's cube simulator, 3d rubik's cube game, solve rubik's cube online | play |
| `/how-to-play` | how to play duel | quiz leagues, glicko rating | support |

Every individual practice question (e.g. "Who painted Guernica?") is also a long-tail query; 343 of them
are published with answers. They are excluded from ranked play (`isPracticeQuestion`), so publishing them
doesn't help anyone cheat.

## Technical checklist (done)

- Server-rendered HTML for all content pages (no JS needed to read them); app shell has crawlable text too.
- Unique `<title>` (≤ 70 chars) and description (≤ 165) per page, one `<h1>`, canonical, hreflang, OG/Twitter cards.
- Structured data: `Quiz` (questions + accepted/suggested answers), `FAQPage`, `BreadcrumbList`, `ItemList`
  (flags), `CollectionPage`, `WebSite`, `Organization`, `VideoGame`.
- `sitemap.xml` (every page, lastmod = deploy date), `robots.txt`, IndexNow key + `npm run indexnow -w server`.
- HTTPS only, one canonical host, fast static pages, installable PWA.
- Tests in `server/test/seo.test.ts` enforce titles, descriptions, canonicals, sitemap coverage and the
  practice/ranked split.

## Next (off-site, compounding)

1. Search Console: watch Coverage and Queries weekly; request indexing for new pages.
2. Backlinks: list the game on Product Hunt, itch.io (web game), Reddit r/trivia / r/quiz (as a real post),
   quiz and puzzle directories, Wikipedia-style "list of online trivia games" pages, school/teacher resources.
3. More content clusters with real search demand: "capital cities quiz" (from geography questions),
   "true or false quiz", "kids quiz", "Christmas quiz" (seasonal), Romanian pages ("quiz cultură generală").
4. Grow the practice set as the question bank grows; refresh titles with the counts.
