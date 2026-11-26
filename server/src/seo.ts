/**
 * SEO for a single-page game: crawlable landing pages per topic, robots.txt, sitemap.xml, structured data
 * and the runtime values injected into the client's index.html (public URL, analytics IDs).
 */
import fs from 'node:fs';
import path from 'node:path';
import type express from 'express';
import { scriptHash } from './security';
import { FLAG_REGIONS } from './seo-quiz-content';
import { hasPack, hreflangTags } from './seo-pack';

export const SITE = {
  name: 'Duel',
  title: '1v1game – Free 1v1 Quiz Game Online: Trivia, Flags, Chess & More',
  description:
    '1v1game is a free 1v1 quiz game in your browser: trivia duels, a flag quiz, chess puzzles, a 3D cube, mini golf, timeline and color games. No sign-up.',
  themeColor: '#fff1d1',
};

const DEPLOYED_AT = new Date().toISOString().slice(0, 10);

/** Public base URL, without trailing slash. */
export function publicUrl(): string {
  const explicit = process.env.PUBLIC_URL?.replace(/\/+$/, '');
  if (explicit) return explicit;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

/** Analytics/config values the client reads at runtime (no rebuild needed to change them). */
export function clientConfig() {
  return {
    publicUrl: publicUrl(),
    ga4: process.env.GA4_ID || null, // e.g. G-XXXXXXX
    clarity: process.env.CLARITY_ID || null, // Microsoft Clarity project id
    umami: process.env.UMAMI_WEBSITE_ID
      ? { src: process.env.UMAMI_SRC || 'https://cloud.umami.is/script.js', websiteId: process.env.UMAMI_WEBSITE_ID }
      : null,
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface TopicPage {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  how: string[];
  faq: [string, string][];
}

export const TOPIC_PAGES: TopicPage[] = [
  {
    slug: 'trivia',
    name: 'Trivia',
    title: 'Trivia Quiz Online – 1v1 General Knowledge Trivia Duels',
    description:
      'Play a 1v1 trivia quiz online with an instant opponent. 1,200+ questions on history, football, science, movies, TV, medicine, tech and more. Fast answers score more.',
    h1: '1v1 trivia duels',
    intro:
      'Answer five questions from five different categories before your opponent does. Duel has over 1,200 hand-checked questions on history, geography, science, sport, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.',
    how: [
      '5 questions per round, 10 seconds each, from 5 different categories.',
      'A correct answer is worth 500 points plus up to 500 for speed.',
      'You see your opponent’s score live while you play.',
      'Win 2 of the 3 rounds of a duel to win it and climb the leagues.',
    ],
    faq: [
      ['Is the trivia quiz free?', 'Yes. Duel is free and runs in your browser, on phone or desktop. Pick a nickname and play — no email, no password.'],
      ['Do I play against real people?', 'Whenever someone is online, yes: Play matches you with a real player of similar rating. If nobody is free within 5 seconds you play a “ghost” (a replay of a real player’s round with their original timing) or a computer opponent.'],
      ['How many questions are there?', 'More than 1,200 questions in 12 categories, with at least 90 per category.'],
    ],
  },
  {
    slug: 'chess-puzzles',
    name: 'Chess puzzles',
    title: 'Chess Puzzles Duel Online – Mate in 1, Mate in 2 Races',
    description:
      'Race an opponent on chess puzzles: mate in 1, mate in 2 and winning material. 90 seconds, one wrong move loses the puzzle. Free, in the browser.',
    h1: 'Chess puzzle races, 1v1',
    intro:
      'Solve as many chess puzzles as you can in 90 seconds while your opponent does the same. Every move is checked on the server, so the board is always fair.',
    how: [
      'Mate in 1, mate in 2 and win-material tactics.',
      '1,000 points per solved puzzle plus a small speed bonus.',
      'One wrong move and the puzzle is lost — the board shows you the right move.',
      'Drag or tap pieces; works great on a phone.',
    ],
    faq: [
      ['Is any checkmate accepted?', 'Yes. If you find a different move that also mates, it counts.'],
      ['Do I need an account?', 'No. Choose a nickname and start playing.'],
    ],
  },
  {
    slug: 'split-the-shape',
    name: 'Split the shape',
    title: 'Split the Shape – Cut It 50/50, 1v1 Online Game',
    description:
      'One straight cut, two halves: split pixel aliens, rockets, hearts and more as close to 50/50 as you can. A free 1v1 precision game in your browser.',
    h1: 'Split the shape, 50/50',
    intro: 'A shape appears. Drag one straight line across it. The closer the two parts are to 50% each, the more points you get. Five shapes, ten seconds each.',
    how: ['50/50 = 1000 points, 45/55 = 750, 40/60 = 500.', 'Shapes are rotated and mirrored every time.', 'Works with a finger or a mouse.'],
    faq: [['What shapes are there?', 'Pixel aliens, an arcade ghost, rockets, crowns, hearts, falling blocks, a game controller and more.']],
  },
  {
    slug: 'color-game',
    name: 'Guess the color',
    title: 'Guess the Color – RGB Color Matching Game, 1v1',
    description:
      'See a color, rebuild it with red, green and blue sliders in 15 seconds. Scored on how close you get. Free 1v1 color guessing game online.',
    h1: 'Guess the color, against an opponent',
    intro: 'A color sample appears. Mix it yourself with three sliders (red, green, blue) before the 15 seconds run out. Four colors per round.',
    how: ['Scored by perceptual distance, so close shades still earn points.', 'Your color is locked in automatically when time runs out.', 'The hex code is revealed after each color.'],
    faq: [['Is it good practice for designers?', 'Yes. It trains your eye for hue, saturation and lightness, the same skill used when matching colors by hand.']],
  },
  {
    slug: 'mini-golf',
    name: 'One-shot golf',
    title: 'Mini Golf Online – 1v1 One-Shot Golf in Your Browser',
    description:
      'Pull back, aim and shoot like in pool. Three holes, one or two walls each, up to three shots. Fewer shots or closer to the hole wins. Free 1v1 mini golf.',
    h1: 'One-shot mini golf, 1v1',
    intro: 'A hole with one or two walls in the way. Pull back from the ball to set direction and power, then let go. Walls bounce the ball.',
    how: ['In with the first shot: 1000 points; second: 650; third: 400.', 'Not in after three shots: points for being close.', 'Same physics for both players.'],
    faq: [['Can I bank shots off the walls?', 'Yes. Walls and the edges of the course bounce the ball.']],
  },
  {
    slug: 'timeline-game',
    name: 'Timeline',
    title: 'Timeline Game – Put History, Games and Movies in Order',
    description:
      'Four events, one order: drag historical events, video game and movie releases from oldest to newest. Free 1v1 timeline quiz in your browser.',
    h1: 'Timeline: what came first?',
    intro: 'Four events appear: moments from history, video game releases, films and tech launches. Drag them into order, oldest at the top.',
    how: ['Scored on how many pairs are in the right order.', 'The years are revealed after each set.', 'Events are always at least 3 years apart.'],
    faq: [['What kind of events are included?', 'History from the fall of Rome to the euro, video games from Pong to Elden Ring, classic and modern films, and tech launches.']],
  },
  {
    slug: 'estimation-game',
    name: 'Opinion',
    title: 'Estimation Game – Wild Guessing Questions, 1v1 Online',
    description:
      'How many tennis balls fit in a room? How many ants live on Earth? Guess, and the closest answer wins. 380+ estimation questions, free 1v1 in your browser.',
    h1: 'Opinion: the wild estimation game',
    intro: 'Questions nobody knows the answer to, but everyone has an opinion about. Type or slide your guess: the closer you get, the more points you score.',
    how: ['Scored by how many times off you are, so the right order of magnitude still pays.', 'The answer and the assumption behind it are shown after each question.', 'Type numbers like 2.5m, 40k or 3 billion.'],
    faq: [['How are the answers decided?', 'Packing questions are worked out from real sizes with realistic packing; the rest are published estimates and facts.']],
  },
  {
    slug: 'guess-the-year',
    name: 'Release year',
    title: 'Guess the Year – Movies, Games and Songs Release Year Quiz',
    description:
      'What year did it come out? Guess the release year of films, video games, hit songs and viral moments from 1980 to today. Free 1v1 year guessing game.',
    h1: 'Guess the release year',
    intro: 'A film, a game, a song or a viral moment appears. Slide to the year you think it came out: the exact year scores the most.',
    how: ['Exact year: 1000 points, 3 years off: 750, 12 or more off: 0.', 'From 1980 to today.', 'Five titles per round.'],
    faq: [['What is included?', 'Classic and recent films, video games from Pac-Man to Baldur’s Gate 3, hit songs and internet moments.']],
  },
  {
    slug: 'price-guessing-game',
    name: 'The right price',
    title: 'Price Guessing Game – Guess the Price, 1v1 Online',
    description:
      'From a Big Mac to a Bugatti: guess the price of everyday things, gadgets and luxury items. The closest guess wins. Free 1v1 price guessing game.',
    h1: 'The right price, 1v1',
    intro: 'An item appears, from a banana to a jumbo jet. Guess its typical price in US dollars. The closer you are, the more points you get.',
    how: ['Scored by how close you are, not by going over.', 'Typical US prices, launch prices for gadgets.', 'Five items per round.'],
    faq: [['Which prices are used?', 'Typical US retail or list prices; for consoles and phones, the launch price.']],
  },
  {
    slug: 'followers-game',
    name: 'Followers',
    title: 'Followers Game – Guess Subscribers, Views and Players',
    description:
      'How many subscribers does MrBeast have? How many views does Despacito have? Guess followers, views and Steam player peaks. Free 1v1 guessing game.',
    h1: 'Guess the followers',
    intro: 'A famous channel, account, video or game appears. Guess the number of subscribers, followers, views or players. Close guesses score big.',
    how: ['A log-scale slider covers everything from thousands to billions.', 'Numbers are approximate and refreshed over time.', 'Five questions per round.'],
    faq: [['Are the numbers exact?', 'They are rounded, approximate figures (2025), since follower counts change every day.']],
  },
  {
    slug: 'flag-quiz',
    name: 'Flags',
    title: 'Flag Quiz Online – Guess the Country, 1v1',
    description:
      'Guess the flags of 194 countries in a 1v1 duel. 8 flags, 6 seconds each, wrong answers from the same region. Free flag quiz game in your browser.',
    h1: 'Flag quiz duels',
    intro:
      'Eight flags, six seconds each. The wrong options always come from the same region, so you really need to know your flags — from Europe to Oceania.',
    how: ['194 countries from every continent.', 'At most 3 lesser-known flags per round.', 'Speed bonus for fast answers.'],
    faq: [['Which countries are included?', 'Every country in Europe, Asia, Africa, the Americas and Oceania, 194 in total.']],
  },
  {
    slug: 'rubiks-cube',
    name: 'Rubik’s Cube',
    title: 'Rubik’s Cube Online – Solve a Real 3D Cube, 1v1',
    description:
      'Solve a real 3D Rubik’s Cube online against an opponent. Make one full face or a cross of a given color in 3 minutes. Drag a row to turn it.',
    h1: 'A real Rubik’s Cube, online, 1v1',
    intro:
      'A genuine 3×3 cube rendered in 3D. Drag a row or column with your finger or mouse to turn it, and drag outside the cube to look around. Both players get the same scramble and three minutes to build one full face or a cross of a given color.',
    how: [
      '20 points for every sticker that matches its face while you work.',
      'Solving it scores 3,000 plus up to 2,000 for speed.',
      'Every turn is checked on the server — no shortcuts.',
    ],
    faq: [['Do I need to know how to solve it?', 'No. Partial progress scores points, so beginners can still win a round.']],
  },
];

const HOW_TO_PLAY: TopicPage = {
  slug: 'how-to-play',
  name: 'How to play',
  title: 'How to Play Duel – Rules, Leagues and Ratings',
  description:
    'Duel rules: 3 rounds on random topics, best of 3 wins. Glicko-2 ratings per topic, leagues from Bronze to Legend, ghosts when nobody is online.',
  h1: 'How Duel works',
  intro:
    'Press Play and you are matched with a real player of similar rating. If nobody is online within a few seconds, you play a ghost (a recorded duel of a real player) or a computer opponent, so you never wait. The server picks three different topics; win two rounds to win the duel. Your overall rating and your rating in each topic change after every duel.',
  how: [
    'Games: trivia, flags, chess puzzles, a 3D Rubik’s Cube, split the shape, guess the color, mini golf and timeline.',
    'Leagues: Bronze, Silver (1300), Gold (1500), Platinum (1700), Diamond (1900), Legend (2100).',
    'Ratings use the Glicko-2 system, like many chess sites.',
    'Leaving or being disconnected for more than 15 seconds counts as a loss.',
  ],
  faq: [
    ['Is Duel free?', 'Yes, completely free. It runs in the browser and can be installed on your phone’s home screen.'],
    ['What is a ghost?', 'When nobody is online, you play a replay of a real player’s round, with their real timing and score. If there is no recording for a topic yet, a computer opponent plays it.'],
  ],
};

/**
 * Pages for broad searches ("1v1 games", "2 player games", "quiz games"…). Each one answers its own
 * intent with specific content and links into the game and the quizzes, rather than repeating the homepage.
 */
export const KEYWORD_PAGES: TopicPage[] = [
  {
    slug: '1v1-games',
    name: '1v1 games',
    title: '1v1 Games Online – Free Brain Game Duels, No Download',
    description:
      'Free 1v1 games in your browser: trivia, flags, chess puzzles, Rubik’s Cube, mini golf, timeline and more. Three rounds, best of three.',
    h1: '1v1 games online: five brain games, one opponent',
    intro:
      'Duel is a 1v1 game where every match mixes three different brain games. You don’t pick the game: the server draws three topics at random, so you need to be good at trivia, flags, chess, maths and the Rubik’s Cube to win consistently. It runs in any browser, on phone or PC, and a match takes about five minutes.',
    how: [
      'Press Play: you are matched with a live player of similar rating, or a recorded duel of a real player (or a computer opponent) if nobody is online within a few seconds.',
      'Three rounds on three different topics: trivia, flags, chess puzzles, a 3D Rubik’s Cube, split the shape, guess the color, mini golf and timeline.',
      'Win two rounds to win the duel. Every duel changes your Glicko-2 rating, overall and per topic.',
      'Climb the leagues from Bronze to Legend and appear on the leaderboard once you create a free account.',
    ],
    faq: [
      ['Is this the shooter game 1v1.LOL?', 'No. Duel (1v1game.net) is a 1v1 brain game: knowledge, logic and speed instead of building and shooting. It is free and runs in the browser.'],
      ['Do I need to download anything?', 'No. Open 1v1game.net and press Play. You can install it on your phone’s home screen like an app if you want.'],
      ['Which 1v1 games are included?', 'A trivia quiz with 1,200+ questions, a flag quiz with 194 countries, chess puzzles (mate in 1 and 2), a real 3D Rubik’s Cube, split the shape, guess the color, mini golf and a timeline game.'],
    ],
  },
  {
    slug: '2-player-games',
    name: '2 player games',
    title: '2 Player Games Online – Free Quiz, Chess & Math Duels',
    description:
      'Free 2 player games online: trivia, flags, chess, Rubik’s Cube, mini golf, timeline and more. Play in the browser on phone or PC.',
    h1: '2 player games online, in your browser',
    intro:
      'Every match on Duel is a two-player game: you and one opponent, the same questions or puzzles at the same moment, and you see their score move while you play. It is built for short sessions — one duel takes about five minutes — and works the same on a phone, a tablet or a laptop.',
    how: [
      'Both players get exactly the same content in each round, so the faster and more accurate player wins.',
      'Scores update live on both screens during the round.',
      'Rounds are short: 10 seconds per trivia question, 6 seconds per flag, 60–90 seconds for maths and chess.',
      'If nobody else is online, you play a recorded duel of a real player, so you never wait.',
    ],
    faq: [
      ['Can I play with a friend?', 'Private friend invites are coming soon. Today, Play matches you with another player automatically.'],
      ['Is it free?', 'Yes. Duel is free, with no download and no sign-up needed to start.'],
    ],
  },
  {
    slug: 'quiz-games',
    name: 'Quiz games',
    title: 'Quiz Games Online – Free Multiplayer Quiz, 1v1',
    description:
      'Free online quiz games: 1v1 trivia duels with 1,200+ questions in 12 categories, a flag quiz and free practice quizzes with answers. No sign-up.',
    h1: 'Quiz games online: play the quiz against someone',
    intro:
      'Most online quizzes are solo: you answer, you get a score, you leave. On Duel the quiz is a match — an opponent answers the same questions at the same time, and speed matters as much as knowledge. Warm up on the free quizzes with answers, then put it to the test in a 1v1.',
    how: [
      'Trivia rounds: 5 questions from 5 different categories, 10 seconds each.',
      'A correct answer scores 500 points plus up to 500 for speed.',
      'Flag quiz rounds: 8 flags, 6 seconds each, with wrong answers from the same region.',
      'Free practice quizzes with answers on history, geography, science, sports, football, films, TV and more.',
    ],
    faq: [
      ['What kind of quiz questions are there?', 'General knowledge in 12 categories: history, geography, science, sport, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.'],
      ['Are the practice questions the same as in the game?', 'No. The questions published on the practice pages are never used in ranked rounds, so reading them doesn’t give anyone an unfair edge.'],
    ],
  },
  {
    slug: 'trivia-games',
    name: 'Trivia games',
    title: 'Trivia Games Online – Free Trivia with 1,200+ Questions',
    description:
      'Play free trivia games online: 1,200+ hand-checked questions in 12 categories, 1v1 trivia duels and trivia questions with answers. Works on phone and PC.',
    h1: 'Trivia games online, free and fast',
    intro:
      'Duel’s trivia is built for quick, fair games: every question is checked by hand, each round mixes five categories so nobody can rely on one specialty, and fast correct answers score more. Play a 1v1 trivia duel, or browse the trivia questions and answers by topic.',
    how: [
      '1,200+ questions, at least 90 per category, with easy, medium and hard questions.',
      'Each trivia round takes about a minute: 5 questions, 10 seconds each.',
      'Trivia is one of five round types, so a duel can also include flags, chess, maths or the Rubik’s Cube.',
      'A daily quiz of the day with 10 new questions to keep your streak going.',
    ],
    faq: [
      ['Is there a daily trivia quiz?', 'Yes: the quiz of the day has 10 new general knowledge questions every day, with a score you can share.'],
      ['Which trivia categories are there?', 'History, geography, science, sports, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.'],
    ],
  },
  {
    slug: 'brain-games',
    name: 'Brain games',
    title: 'Brain Games Online – Free Brain Training Duels for Adults',
    description:
      'Free brain games for adults: general knowledge, flags, chess puzzles, mental arithmetic and a 3D Rubik’s Cube, played as short 1v1 duels in the browser.',
    h1: 'Brain games online, played against an opponent',
    intro:
      'Brain training works better when there is something at stake. Duel turns eight brain games — knowledge, visual recognition, logic, spatial reasoning, precision and timing — into short duels against an opponent, with a rating that shows whether you are actually improving.',
    how: [
      'Knowledge: trivia questions from 12 categories.',
      'Visual memory: recognise the flags of 194 countries.',
      'Logic: chess puzzles, mate in 1 and mate in 2.',
      'Precision: split a shape 50/50 with one cut, or match a color by eye.',
      'Chronology: put four events in order on a timeline.',
      'Spatial reasoning: a real 3D Rubik’s Cube you turn with your finger or mouse.',
    ],
    faq: [
      ['Is it suitable for adults and teenagers?', 'Yes. The questions are general-audience and the difficulty adapts through matchmaking: you mostly play people of a similar rating.'],
      ['How long does a game take?', 'About five minutes for a full duel of three rounds.'],
    ],
  },
  {
    slug: 'geography-games',
    name: 'Geography games',
    title: 'Geography Games Online – Flag & Capital Quiz Duels',
    description:
      'Free geography games: guess the flags of 194 countries, world capitals and geography trivia in 1v1 duels, plus flag lists by continent to learn from.',
    h1: 'Geography games: flags, capitals and countries',
    intro:
      'Geography on Duel comes in two forms: the flag quiz, where you recognise 194 country flags against the clock, and geography trivia — capitals, rivers, mountains, deserts and borders. Learn with the flag lists by continent and the capitals quiz, then test yourself in a duel.',
    how: [
      'Flag rounds: 8 flags, 6 seconds each; the wrong options come from the same region.',
      'Geography trivia: capitals, rivers, mountains, oceans and record holders.',
      'Study pages: all flags of Europe, Asia, Africa, the Americas and Oceania, with names.',
      'A world capitals quiz with answers to practise before you play.',
    ],
    faq: [
      ['How many countries are in the flag quiz?', 'All 194: the 193 UN member states plus Vatican City, grouped by continent.'],
      ['Can I learn the flags first?', 'Yes. The flag pages list every flag of each continent with the country name.'],
    ],
  },
];

const ALL_PAGES = [...TOPIC_PAGES, HOW_TO_PLAY, ...KEYWORD_PAGES];

const PAGE_CSS = `
*{box-sizing:border-box}body{margin:0;background:#fff1d1;color:#2b1b12;font:16px/1.6 Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:#007f8f}main,header,footer{max-width:720px;margin:0 auto;padding:0 20px}
header{display:flex;align-items:center;justify-content:space-between;padding-top:20px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.03em;color:#2b1b12;text-decoration:none}
.dots{display:inline-flex;gap:5px;margin-right:8px;vertical-align:middle}.dots i{width:9px;height:9px;border-radius:50%;display:block}
h1{font-size:clamp(32px,7vw,48px);line-height:1.1;letter-spacing:-.03em;margin:40px 0 16px}
h2{font-size:20px;margin:36px 0 8px;letter-spacing:-.01em}.lead{font-size:18px;color:#5c4734}
.cta{display:inline-block;background:#df301c;color:#fff1d1;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:16px;margin:24px 0}
.cta:hover{background:#b8240f}ul{padding-left:20px}li{margin:6px 0}
.card{background:#fff8e8;border:1px solid #ecd6a8;border-radius:20px;padding:4px 20px;margin-top:12px}
.topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}
.topics a{background:#fff8e8;border:1px solid #ecd6a8;border-radius:16px;padding:14px;text-decoration:none;color:#2b1b12;font-weight:600}
.topics a:hover{border-color:#d8bb83}footer{color:#8a6e52;font-size:14px;padding:48px 20px 32px}
details{border-top:1px solid #ecd6a8;padding:12px 0}details:first-child{border-top:0}summary{font-weight:600;cursor:pointer}
header{flex-wrap:wrap;gap:8px}nav.top{display:flex;gap:16px;align-items:center;font-size:14px;font-weight:600}nav.top a{color:#5c4734;text-decoration:none}nav.top a.play{color:#df301c}
footer nav.foot{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:10px}footer nav.foot a{color:#8a6e52}footer nav.foot strong{color:#5c4734;margin-right:4px}
.crumbs{font-size:13px;color:#8a6e52;margin-top:28px}.crumbs a{color:#8a6e52}
ol.qs{padding-left:0;list-style:none;counter-reset:q}ol.qs>li{counter-increment:q;background:#fff8e8;border:1px solid #ecd6a8;border-radius:16px;padding:14px 16px;margin:10px 0}
ol.qs>li h3{font-size:16px;margin:0 0 8px;line-height:1.4}ol.qs>li h3::before{content:counter(q) ". ";color:#8a6e52}
ol.opts{list-style:upper-alpha;margin:0 0 6px;padding-left:22px;color:#5c4734}ol.opts li{margin:2px 0}
.diff{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#b56500;margin-left:6px}
ol.qs details{border:0;padding:4px 0 0}ol.qs summary{color:#007f8f;font-size:14px}.ans{font-weight:700;color:#007f8f}
.flags{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px}
.flags div{background:#fff8e8;border:1px solid #ecd6a8;border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px}
img.flag{width:44px;height:33px;border-radius:5px;object-fit:cover;box-shadow:0 0 0 1px rgb(0 0 0 / .1)}`;

function pageHtml(p: TopicPage): string {
  const base = publicUrl();
  const url = `${base}/${p.slug}`;
  const others = ALL_PAGES.filter((o) => o.slug !== p.slug);
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '1v1game', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: p.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  const quizHub =
    !['flag-quiz', 'geography-games', 'chess-puzzles', 'mental-math', 'rubiks-cube', 'how-to-play'].includes(p.slug)
      ? `<h2>Practice quizzes with answers</h2><p>Warm up with free quizzes by topic: <a href="/quiz">all quizzes</a>, <a href="/quiz/general-knowledge">general knowledge</a>, <a href="/quiz/history">history</a>, <a href="/quiz/geography">geography</a>, <a href="/quiz/science">science</a>, <a href="/quiz/football">football</a>, <a href="/quiz/world-capitals/">world capitals</a>, <a href="/quiz/space/">space</a> and more, or the <a href="/quiz-of-the-day/">quiz of the day</a>.</p>`
      : ['flag-quiz', 'geography-games'].includes(p.slug)
        ? `<h2>Flags by continent</h2><nav class="topics">${FLAG_REGIONS.map((r) => `<a href="/flag-quiz/${r.id}">Flags of ${esc(r.name)}</a>`).join('')}${hasPack() ? '<a href="/flag-quiz/north-america/">Flags of North America</a><a href="/flag-quiz/south-america/">Flags of South America</a>' : ''}</nav>`
        : '';
  const body = `<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.intro)}</p>
<a class="cta" href="/">Play now — it’s free</a>
<h2>How it works</h2>
<ul>${p.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
${quizHub}
<h2>Questions</h2>
<div class="card">${p.faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
<h2>More ways to duel</h2>
<nav class="topics">${others.map((o) => `<a href="/${o.slug}">${esc(o.name)}</a>`).join('')}</nav>`;
  return shell({ path: `/${p.slug}`, title: p.title, description: p.description, bodyHtml: body, jsonLd: ld });
}

/** Shared HTML template for all crawlable pages: meta, social cards, nav, footer with internal links. */
export function shell(o: {
  path: string;
  title: string;
  description: string;
  bodyHtml: string;
  jsonLd?: object[];
  extraCss?: string;
  brand?: boolean;
}): string {
  const base = publicUrl();
  const url = `${base}${o.path}`;
  const title = o.brand === false || o.title.length > 58 ? o.title : `${o.title} | 1v1game`;
  const ld = o.jsonLd?.length ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${url}">
${hreflangTags(o.path)}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="${SITE.themeColor}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="1v1game">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${base}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${base}/og.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>${PAGE_CSS}${o.extraCss ?? ''}</style>
${ld}
</head>
<body>
<header><a class="logo" href="/"><span class="dots"><i style="background:#00b7cd"></i><i style="background:#ff9100"></i><i style="background:#df301c"></i></span>Duel</a>
<nav class="top"><a href="/quiz">Quizzes</a><a href="/flag-quiz">Flags</a><a href="/how-to-play">How to play</a><a href="/" class="play">Play free →</a></nav></header>
<main>
${o.bodyHtml}
</main>
<footer>
${hasPack() ? FOOTER_LANG_LINKS : ''}
<nav class="foot"><strong>Games</strong> <a href="/trivia">Trivia duel</a> <a href="/chess-puzzles">Chess puzzles</a> <a href="/flag-quiz">Flag quiz</a> <a href="/rubiks-cube">Rubik’s Cube</a> <a href="/split-the-shape">Split the shape</a> <a href="/color-game">Guess the color</a> <a href="/mini-golf">Mini golf</a> <a href="/timeline-game">Timeline</a> <a href="/estimation-game">Estimation game</a> <a href="/guess-the-year">Guess the year</a> <a href="/price-guessing-game">Price game</a> <a href="/followers-game">Followers game</a></nav><p>© ${new Date().getFullYear()} Duel on 1v1game.net · 1v1 brain games in your browser · <a href="/privacy">Privacy</a></p>
</footer>
</body>
</html>`;
}

const FOOTER_LANG_LINKS = `<nav class="foot" aria-label="Languages"><strong>Languages</strong> <a href="/" hreflang="en" lang="en">English</a> <a href="/es/" hreflang="es" lang="es">Español</a> <a href="/pt/" hreflang="pt" lang="pt">Português</a> <a href="/fr/" hreflang="fr" lang="fr">Français</a> <a href="/de/" hreflang="de" lang="de">Deutsch</a> <a href="/it/" hreflang="it" lang="it">Italiano</a> <a href="/ro/" hreflang="ro" lang="ro">Română</a> <a href="/pl/" hreflang="pl" lang="pl">Polski</a> <a href="/tr/" hreflang="tr" lang="tr">Türkçe</a></nav>`;

export function homeJsonLd(): string {
  const base = publicUrl();
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: '1v1game', alternateName: ['1v1 game', '1v1game.net', 'Duel'], url: `${base}/`, description: SITE.description },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '1v1game',
      url: `${base}/`,
      logo: `${base}/icon-512.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: '1v1game',
      alternateName: SITE.name,
      url: `${base}/`,
      description: SITE.description,
      image: `${base}/og.png`,
      genre: ['Trivia', 'Puzzle', 'Educational'],
      gamePlatform: ['Web browser', 'Android', 'iOS'],
      playMode: 'MultiPlayer',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    },
  ];
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}

/**
 * client/dist/index.html with the public URL, structured data and runtime config filled in, plus the
 * sha256 of the inline config script so the Content-Security-Policy can allow exactly that script.
 */
export function makeIndexRenderer(distDir: string): () => { html: string; inlineScriptHash: string } {
  let cached: { html: string; inlineScriptHash: string } | null = null;
  return () => {
    if (cached) return cached;
    const tpl = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    const configScript = `window.__DUEL__=${JSON.stringify(clientConfig()).replace(/</g, '\\u003c')}`;
    const html = tpl
      .replaceAll('__PUBLIC_URL__', publicUrl())
      .replace('<!--HOME_JSONLD-->', `${hreflangTags('/')}\n<script type="application/ld+json">${homeJsonLd()}</script>`)
      .replace('<!--DUEL_CONFIG-->', `<script>${configScript}</script>`);
    cached = { html, inlineScriptHash: scriptHash(configScript) };
    return cached;
  };
}

function privacyHtml(): string {
  const base = publicUrl();
  const contact = process.env.CONTACT_EMAIL;
  const section = (h: string, body: string) => `<h2>${h}</h2><p>${body}</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy | Duel</title><meta name="description" content="How Duel handles your data: nickname, game results and optional analytics.">
<link rel="canonical" href="${base}/privacy"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>${PAGE_CSS}</style></head><body>
<header><a class="logo" href="/"><span class="dots"><i style="background:#00b7cd"></i><i style="background:#ff9100"></i><i style="background:#df301c"></i></span>Duel</a></header>
<main><h1>Privacy Policy</h1><p class="lead">Short version: we store what the game needs, nothing more, and we never sell data.</p>
${section('What we store', 'Your nickname, a hashed password if you create an account (never the password itself), your ratings, and the results and moves of the duels you play. Rounds you play may be replayed to other players as a “ghost” opponent, shown with your nickname.')}
${section('Guests', 'Guests get a random nickname and a token saved in their browser. Guest data stays on our server until it is cleaned up; guests never appear on the leaderboard.')}
${section('Analytics', 'We count page views and game events (for example “duel finished”) to improve the game. Cookie-based analytics (Google Analytics, Microsoft Clarity) only run if you accept them in the banner. You can change your mind by clearing this site’s data in your browser.')}
${section('Your rights', `You can ask us to delete your account and all its data${contact ? ` by writing to <a href="mailto:${esc(contact)}">${esc(contact)}</a>` : ''}. We answer within 30 days.`)}
${section('Children', 'Duel is a general-audience game and does not knowingly collect personal data from children beyond a nickname.')}
<p class="lead" style="font-size:14px">Last updated: ${new Date().toISOString().slice(0, 10)}</p>
</main><footer>© ${new Date().getFullYear()} Duel</footer></body></html>`;
}

/**
 * IndexNow key (public by design: search engines fetch /<key>.txt to confirm we own the site).
 * Lets us notify Bing, Yandex, Seznam, Naver… the moment pages change (see server/scripts/indexnow.ts).
 */
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '7c1e9f4a2b6d48e0a3f5c8d1e2b7a940';

/** Every crawlable page, for the sitemap and IndexNow. */
export function sitePaths(extra: string[] = []): { path: string; priority: string; changefreq: string }[] {
  return [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/quiz', priority: '0.9', changefreq: 'weekly' },
    ...extra.filter((p) => p !== '/quiz').map((p) => ({ path: p, priority: p.startsWith('/quiz/') ? '0.8' : '0.7', changefreq: 'weekly' })),
    ...ALL_PAGES.map((p) => ({ path: `/${p.slug}`, priority: '0.8', changefreq: 'monthly' })),
    { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  ];
}

export function mountSeo(app: express.Express, extraPaths: () => string[] = () => []) {
  app.get('/privacy', (_req, res) => res.type('html').send(privacyHtml()));
  app.get(`/${INDEXNOW_KEY}.txt`, (_req, res) => res.type('text/plain').send(INDEXNOW_KEY));

  // Digital Asset Links: lets the Google Play (TWA) version open full screen without a URL bar.
  // Set TWA_PACKAGE (e.g. app.duel.twa) and TWA_SHA256 (signing key fingerprint, comma-separated) on Railway.
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    const pkg = process.env.TWA_PACKAGE;
    const fps = (process.env.TWA_SHA256 ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    res.json(
      pkg && fps.length
        ? [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fps } }]
        : [],
    );
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nAllow: /api/guest\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${publicUrl()}/sitemap.xml\n${hasPack() ? `Sitemap: ${publicUrl()}/sitemap-i18n.xml\n` : ''}`);
  });

  app.get('/sitemap.xml', (_req, res) => {
    const base = publicUrl();
    // lastmod = when this version was deployed (content only changes with a deploy).
    const urls = sitePaths(extraPaths());
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${base}${u.path}</loc><lastmod>${DEPLOYED_AT}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
        .join('\n')}\n</urlset>\n`,
    );
  });

  for (const p of ALL_PAGES) {
    app.get(`/${p.slug}`, (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.type('html').send(pageHtml(p));
    });
  }
}
