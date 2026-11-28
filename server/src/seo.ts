/**
 * SEO for a single-page game: crawlable landing pages per topic, robots.txt, sitemap.xml, structured data
 * and the runtime values injected into the client's index.html (public URL, analytics IDs).
 */
import { APP, posthogUiHost } from './analytics';
import fs from 'node:fs';
import path from 'node:path';
import type express from 'express';
import { scriptHash } from './security';
import { FLAG_REGIONS } from './seo-quiz-content';
import { hasPack, hreflangTags } from './seo-pack';

export const SITE = {
  name: 'Duel',
  title: '1v1game – Free 1v1 Games Online: Trivia, Flags & Chess',
  description:
    '1v1game is a free 1v1 quiz game in your browser: trivia duels, a flag quiz, chess puzzles, a 3D cube, mini golf, timeline and color games. No sign-up.',
  themeColor: '#ffeecc',
};

export const DEPLOYED_AT = new Date().toISOString().slice(0, 10);

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
    // PostHog: the project key is public by design; the browser sends events to /ingest (our proxy).
    posthog: process.env.POSTHOG_KEY ? { key: process.env.POSTHOG_KEY, apiHost: '/ingest', uiHost: posthogUiHost(), app: APP } : null,
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
  /** Longer explanation of the game (a few paragraphs). */
  about?: string[];
  tips?: string[];
  faq: [string, string][];
}

/** The 15 games, in the order they are usually listed. Keep in sync with server/src/modes. */
const GAMES_SENTENCE =
  'trivia, flags, chess puzzles, a 3D Rubik’s Cube, split the shape, guess the color, mini golf, timeline, an estimation game, guess the year, guess the price, guess the followers, pin the country on a globe, date the photo and name the vehicle';

/** FAQ entries shared by every game page. */
const COMMON_FAQ: [string, string][] = [
  ['Is it free, and do I need an account?', 'It is completely free and runs in the browser on phone, tablet or PC. You get a guest nickname and can play immediately; create a free account (nickname and password, no email) to keep your rating and appear on the leaderboard.'],
  ['Who do I play against?', 'Play looks for a live player of similar rating. If nobody is free within about five seconds you play a ghost (a replay of a real player’s round with their original timing) or a computer opponent, so you never wait. To play someone you know, create a private room and send them the 5-character code or the link.'],
];

export const TOPIC_PAGES: TopicPage[] = [
  {
    slug: 'trivia',
    name: 'Trivia',
    title: 'Trivia Quiz Online – 1v1 General Knowledge Duels',
    description:
      'Play a 1v1 trivia quiz online: 1,200+ hand-checked questions in 12 categories, 10 seconds per question, harder questions worth more. Free, no download.',
    h1: '1v1 trivia duels',
    intro:
      'Five questions from five different categories, ten seconds each, against an opponent answering the same questions at the same time. Duel has more than 1,200 hand-checked general knowledge questions on history, geography, science, sport, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.',
    how: [
      '5 questions per round, each from a different category, 10 seconds each.',
      'Every question has a difficulty from 1 to 5 stars: a correct answer is worth 350 points for 1 star up to 950 for 5 stars.',
      'Answering fast adds up to 50 % on top, so a quick 5-star answer can score 1,425.',
      'You see your opponent’s score move while you play.',
      'A trivia round is one of three rounds in a duel: win 2 of 3 to win the duel.',
    ],
    about: [
      'Most online quizzes are solo: you answer, get a score and leave. Here the quiz is a race. Both players get exactly the same five questions in the same order, so the result depends only on what you know and how quickly you trust your answer.',
      'The star rating of each question is not a guess. It starts from a hand-set difficulty and is then recalculated from the real share of players who answer it correctly, so a question that turns out to be easier than expected loses stars and pays less.',
      'Categories are mixed on purpose. A round never has two questions from the same category, so a football expert still needs some science and history to win, and nobody can farm a single favourite topic.',
    ],
    tips: [
      'If you are sure, answer at once: speed is up to half of the score.',
      'If you are not sure, take a second to eliminate the two most unlikely options; a wrong answer scores 0 no matter how fast it was.',
      'Harder questions are worth almost three times as much as easy ones, so one good guess on a 5-star question can turn a round.',
      'Warm up with the free practice quizzes; their questions are never used in ranked rounds.',
    ],
    faq: [
      ['How many questions are there?', 'More than 1,200 questions in 12 categories, with at least 90 per category, and new ones are added regularly.'],
      ['Are the questions the same for both players?', 'Yes. Both players get the same questions in the same order with the same time limit.'],
      ['What happens if neither player answers?', 'An unanswered question scores 0 for that player. The round is decided by the total score of the five questions.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'chess-puzzles',
    name: 'Chess puzzles',
    title: 'Chess Puzzles Online – 1v1 Mate in 1 and 2 Races',
    description:
      'Race an opponent on chess puzzles: mate in 1, mate in 2 and winning material. Five puzzles in 30 seconds, one wrong move loses the puzzle. Free in your browser.',
    h1: 'Chess puzzle races, 1v1',
    intro:
      'Solve as many of the five chess puzzles as you can in 30 seconds while your opponent works through the same puzzles. Every move is checked on the server, so the board is always fair and nobody can use an engine in another tab to gain time.',
    how: [
      'Puzzles are mate in 1, mate in 2 and short tactics that win material.',
      'Each solved puzzle is worth 1,000 points plus a small speed bonus of up to 100.',
      'One wrong move and the puzzle is lost: the board shows the right move and the next puzzle starts.',
      'Both players get the same puzzles in the same order.',
      'Drag or tap the pieces; it works well on a phone.',
    ],
    about: [
      'Puzzle rush is the fastest way to train tactics: you see many positions in a short time and learn the patterns that keep coming back, like back-rank mates, forks and pins. Playing it against an opponent adds pressure, and pressure is when tactical mistakes happen in real games.',
      'Because a wrong move ends the puzzle, accuracy matters more than raw speed. Two careful solves beat three rushed attempts with one mistake, so the best players look for every check and capture before they move.',
      'Your chess rating on Duel is tracked separately from your overall rating, so you can see how your tactics improve over time.',
    ],
    tips: [
      'Always look at checks first, then captures, then threats.',
      'In mate in 2 puzzles the first move is often a quiet move or a sacrifice, not the obvious check.',
      'If the position looks equal, look for a piece that is attacked twice and defended once.',
    ],
    faq: [
      ['Is any checkmate accepted?', 'Yes. If you find a different move that also gives mate, it counts as solved.'],
      ['Where do the puzzles come from?', 'Every puzzle is checked move by move on the server, and each one has a single clear winning line, so there is no doubt about the answer.'],
      ['Do I need to know chess well?', 'Knowing how the pieces move is enough to start. The puzzles get easier to spot with practice.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'split-the-shape',
    name: 'Split the shape',
    title: 'Split the Shape – Cut It 50/50, 1v1 Online',
    description:
      'One cut, two halves: split pixel aliens, rockets, hearts and more as close to 50/50 as you can. Five shapes, 10 seconds each. Free 1v1 game.',
    h1: 'Split the shape, 50/50',
    intro:
      'A shape appears. Draw one cut across it with your finger or mouse, straight or curved. The closer the two parts are to 50 % each, the more points you get. Five shapes per round, ten seconds each, against an opponent cutting the same shapes.',
    how: [
      'A perfect 50/50 cut scores 1,000 points, 45/55 scores 750, 40/60 scores 500 and 30/70 or worse scores 0.',
      'Shapes are rotated and mirrored every time, so you cannot memorise a cut.',
      'Each shape has its own 10-second timer.',
      'Works with a finger or a mouse.',
    ],
    about: [
      'Splitting a shape exactly in half sounds easy until the shape is a pixel alien with antennae or a heart with a bite taken out. The game trains your sense of area: judging how much space irregular shapes really take, which is harder than it looks because the eye overrates long thin parts.',
      'The score is measured on the actual area of each part, down to the pixel, so the result is exact and both players are judged the same way.',
    ],
    tips: [
      'Cut through the widest part of the shape: small angle mistakes cost less there.',
      'A cut through the centre of mass gets close to 50/50 for most shapes; long arms and antennae pull that centre towards them.',
      'You do not have to cut horizontally or vertically. Diagonal cuts are often easier on asymmetrical shapes.',
    ],
    faq: [
      ['What shapes are there?', 'Pixel aliens, an arcade ghost, rockets, crowns, hearts, falling blocks, a game controller and more.'],
      ['Does the cut have to go through the whole shape?', 'No. Draw your cut with a finger or the mouse, straight or curved; if it stops early, the game extends it in the direction you were drawing and splits the shape along it.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'color-game',
    name: 'Guess the color',
    title: 'Guess the Color – RGB Color Matching Game, 1v1',
    description:
      'See a color, rebuild it with red, green and blue sliders in 15 seconds. Scored on how close you get. A free 1v1 color guessing game for your eyes.',
    h1: 'Guess the color, against an opponent',
    intro:
      'A color sample appears. Mix it yourself with three sliders (red, green, blue) before the 15 seconds run out. Four colors per round, and the closer your mix, the more points you score.',
    how: [
      'Scored by perceptual distance (ΔE), the way the human eye sees color, so close shades still earn points.',
      'Your color is locked in automatically when time runs out.',
      'The hex code of the target and of your guess is shown after each color.',
      'Four colors per round, the same for both players.',
    ],
    about: [
      'Colors on screens are made from red, green and blue light. Rebuilding a shade by hand teaches you how they mix: yellow is red plus green, a dusty pink needs all three channels high with red on top, and dark colors are all about keeping every channel low.',
      'Scoring with perceptual distance means the game judges you like an eye would: being slightly off in blue matters less than being off in green, because our eyes are less sensitive to blue.',
    ],
    tips: [
      'Get the lightness right first by moving all three sliders together, then adjust the hue.',
      'Greys and pastels have all three channels close to each other.',
      'If the color looks muddy, one channel is too high; if it looks too bright, lower the strongest one.',
    ],
    faq: [
      ['Is it good practice for designers?', 'Yes. It trains your eye for hue, saturation and lightness, the same skill used when matching colors by hand.'],
      ['Can I type a hex code?', 'No, only the sliders: the point is to train your eye, not to know the code.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'mini-golf',
    name: 'One-shot golf',
    title: 'Mini Golf Online – 1v1 One-Shot Golf in Your Browser',
    description:
      'Pull back, aim and shoot like in pool. Three holes, walls in the way, up to three shots each. Fewer shots or closer to the hole wins. Free 1v1 mini golf.',
    h1: 'One-shot mini golf, 1v1',
    intro:
      'A hole with one or two walls in the way. Pull back from the ball to set direction and power, then let go. Walls and edges bounce the ball. Three holes per round, up to three shots each.',
    how: [
      'In with the first shot: 1,000 points; second shot: 650; third shot: 400.',
      'Not in after three shots: up to 300 points for finishing close to the hole.',
      'Each hole has a 25-second timer.',
      'The physics run on the server, so both players get exactly the same bounces.',
    ],
    about: [
      'Every hole is a small geometry puzzle: the direct line is usually blocked, so you either go around the wall with the right power or bank the ball off it. A hole in one is worth more than twice a hole in three, so a planned bank shot pays off.',
      'Both players see the same course. Because the ball path is computed on the server with deterministic physics, the same shot always gives the same result, which makes the game fair and lets good players repeat what works.',
    ],
    tips: [
      'For a bank shot, aim at the point on the wall where the angle in equals the angle out, like in pool.',
      'Too much power is the most common mistake: the ball rolls over the hole if it is too fast.',
      'If the first shot is hard, play it safe to set up an easy second shot instead of forcing a hole in one.',
    ],
    faq: [
      ['Can I bank shots off the walls?', 'Yes. Walls and the edges of the course bounce the ball.'],
      ['Is it the same course for both players?', 'Yes, the same three holes in the same order.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'timeline-game',
    name: 'Timeline',
    title: 'Timeline Game – Put History, Games and Movies in Order',
    description:
      'Four events, one order: drag historical events, video game and movie releases from oldest to newest. Three sets per round. Free 1v1 timeline quiz.',
    h1: 'Timeline: what came first?',
    intro:
      'Four events appear: moments from history, video game releases, films and tech launches. Drag them into order, oldest at the top. Three sets per round, 25 seconds each.',
    how: [
      'Scored on how many pairs are in the right order: all six pairs right is 1,000 points.',
      'The years are revealed after each set.',
      'Events in a set are always at least 3 years apart.',
      'Both players get the same events.',
    ],
    about: [
      'Timeline games test something different from a normal quiz: you rarely need the exact year, only which of two things came first. That makes them fun even when you are unsure, because partial order still scores.',
      'Each set has four events and six possible pairs. Getting the first and last event right already secures part of the points, so start with what you are sure of and place the others around them.',
    ],
    tips: [
      'Anchor the set with the event you know best, then place the others before or after it.',
      'Technology and video games are easier to date by generation: think of which console or phone was around.',
      'If two events feel close, remember they are at least 3 years apart.',
    ],
    faq: [
      ['What kind of events are included?', 'History from the fall of Rome to the euro, video games from Pong to Elden Ring, classic and modern films, and tech launches.'],
      ['Do I need to know the exact years?', 'No, only the order. The years are shown afterwards so you learn them as you play.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'estimation-game',
    name: 'Opinion',
    title: 'Estimation Game – Wild Guessing Questions, 1v1',
    description:
      'How many tennis balls fit in a room? How many ants live on Earth? Guess, and the closest answer wins. 380+ estimation questions, free 1v1 online.',
    h1: 'Opinion: the wild estimation game',
    intro:
      'Questions nobody knows the answer to, but everyone has an opinion about. Type or slide your guess: the closer you get, the more points you score. Four questions per round, 20 seconds each.',
    how: [
      'Scored by how many times off you are, so the right order of magnitude still pays.',
      'The answer and the assumption behind it are shown after each question.',
      'Type numbers like 2.5m, 40k or 3 billion, or use the slider.',
      'More than 380 questions: facts and “how many fit in” puzzles worked out from real sizes.',
    ],
    about: [
      'These are Fermi questions, named after the physicist who liked to estimate things he could not look up. Nobody knows how many ping-pong balls fit in a bus, but you can get close by breaking it down: how big is a bus, how big is a ball, and how tightly do round things pack.',
      'Because the score is based on the ratio between your guess and the answer, being twice too high costs the same as being half too low. That rewards thinking in orders of magnitude rather than lucky exact numbers.',
    ],
    tips: [
      'Break the question into parts you can estimate, then multiply.',
      'Round things only fill about two thirds of a box when packed.',
      'When in doubt, the middle of the plausible range on a logarithmic scale is a safe guess.',
    ],
    faq: [
      ['How are the answers decided?', 'Packing questions are worked out from real sizes with realistic packing; the rest are published estimates and facts.'],
      ['Is there one exact answer?', 'Each question has a reference answer, and you score by how close you are to it, so nobody needs to be exact.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'guess-the-year',
    name: 'Release year',
    title: 'Guess the Year – Movie, Game and Song Year Quiz',
    description:
      'What year was it? Guess the year of films, video games, hit songs, inventions and history, from ancient Egypt to today. Free 1v1 year guessing game.',
    h1: 'Guess the release year',
    intro:
      'A film, a game, a song, an invention or a moment in history appears. Slide to the year (or type it, BC included): the exact year scores the most. Five questions per round, 15 seconds each.',
    how: [
      'Exact year: 1,000 points; 3 years off: 750; 12 or more years off: 0. For ancient history the margin grows, up to 60 years.',
      'Anything from the pyramids (about 2560 BC) to today; BC years are typed or picked with the BC button.',
      'Five titles per round, the same for both players.',
      'The real year is shown after each answer.',
    ],
    about: [
      'Guessing release years is a test of pop-culture memory: you probably remember where you were when a song was everywhere or which console you played a game on, and that is often enough to land within a year or two.',
      'Points drop gradually, so being close still pays. Over a round, a player who is always within two or three years beats one who nails one exact year and misses the rest badly.',
    ],
    tips: [
      'Link the title to something in your own life: your school year, your first phone, a console generation.',
      'Sequels and remakes are traps: check whether it is the original or a later version.',
      'If you have no idea, choose the middle of the decade the style belongs to.',
    ],
    faq: [
      ['What is included?', 'Films, TV series, video games from Pac-Man to Baldur’s Gate 3, hit songs and albums, inventions and launches, and history from antiquity to today.'],
      ['Which release date counts?', 'The first public release, for example the original theatrical release of a film or the first platform release of a game.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'price-guessing-game',
    name: 'The right price',
    title: 'Price Guessing Game – Guess the Price, 1v1 Online',
    description:
      'From a Big Mac to a Bugatti: guess the price of everyday things, gadgets and luxury items. The closest guess wins. A free 1v1 price guessing game online.',
    h1: 'The right price, 1v1',
    intro:
      'An item appears, from a banana to a jumbo jet. Guess its typical price in US dollars. The closer you are, the more points you get. Five items per round, 15 seconds each.',
    how: [
      'Scored by how close you are in ratio, not by going over: there is no penalty for guessing high.',
      'Typical US prices; for consoles and phones, the launch price.',
      'Five items per round, the same for both players.',
      'The real price is shown after each answer.',
    ],
    about: [
      'Unlike the TV show, you do not lose for going over. What counts is how many times off you are, so guessing 1,200 dollars for a 1,000-dollar phone scores the same as guessing about 830.',
      'Items range from a few cents to hundreds of millions of dollars, which makes the game more about sense of scale than about knowing exact shop prices.',
    ],
    tips: [
      'Think of the category first (snack, gadget, car, house, aircraft), then refine.',
      'Luxury items usually cost much more than people expect, cheap everyday items a bit less.',
      'For gadgets, remember the launch price, not today’s discounted price.',
    ],
    faq: [
      ['Which prices are used?', 'Typical US retail or list prices; for consoles and phones, the launch price.'],
      ['Which currency is used?', 'US dollars, so everyone plays with the same reference prices.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'followers-game',
    name: 'Followers',
    title: 'Followers Game – Guess Subscribers, Views and Players',
    description:
      'How many subscribers does MrBeast have? How many views does Despacito have? Guess followers, views and Steam player peaks. A free 1v1 guessing game.',
    h1: 'Guess the followers',
    intro:
      'A famous channel, account, video or game appears. Guess the number of subscribers, followers, views or players. Close guesses score big. Five questions per round, 15 seconds each.',
    how: [
      'A log-scale slider covers everything from thousands to hundreds of billions.',
      'Scored by how many times off you are, so the right order of magnitude still pays.',
      'Numbers are approximate and refreshed over time.',
      'Five questions per round, the same for both players.',
    ],
    about: [
      'Internet numbers are hard to feel: the gap between a million and a billion is a thousand times, but both just sound like “a lot”. This game trains that sense of scale with YouTube channels, Instagram and TikTok accounts, most-viewed videos and record Steam player peaks.',
      'Because the slider is logarithmic, moving it a little near the top changes the number a lot. Being within a factor of two is already a good score.',
    ],
    tips: [
      'The biggest YouTube channels are in the hundreds of millions of subscribers; the most-viewed videos in the billions of views.',
      'Steam player peaks are much smaller than follower counts: even huge games peak in the hundreds of thousands or low millions.',
      'Decide the order of magnitude first, then fine-tune.',
    ],
    faq: [
      ['Are the numbers exact?', 'They are rounded, approximate figures (2025), since follower counts change every day.'],
      ['Which platforms are included?', 'YouTube, Instagram, TikTok, X, Spotify, Twitch and Steam.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'flag-quiz',
    name: 'Flags',
    title: 'Flag Quiz Online – Guess the Country, 1v1',
    description:
      'Guess the flags of 194 countries in a 1v1 duel. 8 flags, 6 seconds each, wrong answers from the same region. Free flag quiz game, plus flag lists.',
    h1: 'Flag quiz duels',
    intro:
      'Eight flags, six seconds each. The wrong options always come from the same region, so you really need to know your flags, from Europe to Oceania. Your opponent sees the same flags at the same time.',
    how: [
      '194 countries from every continent: the 193 UN member states plus Vatican City.',
      'At most 3 lesser-known flags per round.',
      'Wrong options come from the same region, so Chad is compared with Romania and Andorra, not with Japan.',
      'Like trivia, harder flags are worth more and fast answers score a bonus.',
    ],
    about: [
      'Many flags share the same colors and layout: Indonesia and Monaco, Chad and Romania, Ireland and Ivory Coast, the Nordic crosses. Because the options in each question are neighbours, you have to notice the details, like the order of the stripes, the shade of blue or the emblem in the middle.',
      'Learn the flags continent by continent on the study pages below, then test yourself in a duel. Your flag rating is tracked separately, so you can watch it climb.',
    ],
    tips: [
      'Learn the look-alike pairs first; they decide most rounds.',
      'Vertical stripes are common in Europe and Africa, horizontal ones everywhere: check the order of the colors, not just the colors.',
      'Stars and crescents narrow it down quickly to a few regions.',
    ],
    faq: [
      ['Which countries are included?', 'Every country in Europe, Asia, Africa, the Americas and Oceania, 194 in total.'],
      ['Can I learn the flags first?', 'Yes. The flag pages list every flag of each continent with the country name.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'rubiks-cube',
    name: 'Rubik’s Cube',
    title: 'Rubik’s Cube Online – Solve a Real 3D Cube, 1v1',
    description:
      'Solve a real 3D Rubik’s Cube online against an opponent: build one full face or a cross of a given color in 3 minutes. Drag a row to turn it. Free.',
    h1: 'A real Rubik’s Cube, online, 1v1',
    intro:
      'A genuine 3×3 cube rendered in 3D. Drag a row or column with your finger or mouse to turn it, and drag outside the cube to look around. Both players get the same scramble and three minutes to build one full face or a cross of a given color.',
    how: [
      'The goal is either one full face or a cross, in the color shown at the start.',
      'You score for progress while you work: every correct piece of the goal counts.',
      'Completing the goal scores 2,000 points plus up to 1,500 for speed.',
      'Every turn is checked on the server: no shortcuts.',
    ],
    about: [
      'You do not need to know how to solve a whole Rubik’s Cube. One face or a cross is something most people can learn in an evening, and partial progress already scores, so beginners can win rounds against players who freeze.',
      'When you hold a row, it lights up and turns with your finger; let go before a third of a turn and it snaps back, so a slip does not cost you a move.',
    ],
    tips: [
      'For a cross, first find the centre of the goal color: it never moves, and the edges must line up with it.',
      'Bring one edge at a time to the top, then turn it down into place.',
      'Rotate the view often: most mistakes come from missing a sticker on a hidden side.',
    ],
    faq: [
      ['Do I need to know how to solve it?', 'No. Partial progress scores points, so beginners can still win a round.'],
      ['Is it a real cube or a simplified one?', 'A real 3×3 cube with the same moves and the same scramble for both players.'],
      ...COMMON_FAQ,
    ],
  },
];

const HOW_TO_PLAY: TopicPage = {
  slug: 'how-to-play',
  name: 'How to play',
  title: 'How to Play Duel – Rules, Leagues and Ratings',
  description:
    'Duel rules: 3 rounds on random games, best of 3 wins. 15 games, Glicko-2 ratings overall and per game, leagues from Bronze to Legend, private rooms.',
  h1: 'How Duel works',
  intro:
    'Press Play and you are matched with a real player of similar rating. If nobody is free within about five seconds you play a ghost (a recorded round of a real player) or a computer opponent, so you never wait. The server picks three different games; win two rounds to win the duel.',
  how: [
    `15 games: ${GAMES_SENTENCE}.`,
    'Each duel has three rounds on three different games. Win two to win the duel.',
    'Before each duel you can ban one game you don’t want; your opponent’s ban counts too.',
    'The Rubik’s Cube only comes up in private rooms, in about 1% of duels there.',
    'Leagues: Bronze, Silver (1300), Gold (1500), Platinum (1700), Diamond (1900), Legend (2100).',
    'Ratings use the Glicko-2 system, like many chess sites, with a small bonus for win streaks and one-sided wins.',
    'Leaving or being disconnected for more than 15 seconds counts as a loss.',
    'Private rooms: share a 5-character code or a link to play a friend, with no rating change. The room owner chooses which games are on, even just one.',
  ],
  about: [
    'Your overall rating changes after every duel, and you also have a separate rating for each game, so you can see which ones you are best at. New players move quickly; after a few dozen duels the rating settles and moves less.',
    'The leaderboard shows registered players. Guests can play everything and keep their rating in that browser; creating a free account (nickname and password) keeps everything they have earned and puts them on the leaderboard.',
  ],
  faq: [
    ['Is Duel free?', 'Yes, completely free. It runs in the browser and can be installed on your phone’s home screen.'],
    ['What is a ghost?', 'When nobody is online, you play a replay of a real player’s round, with their real timing and score. If there is no recording for a game yet, a computer opponent plays it.'],
    ['Can I choose the game?', 'Not in ranked duels: the server picks three different games at random, so all-round players do best. Each game has a practice page with the rules.'],
    ['How do I play with a friend?', 'Open “Play a friend”, create a room and send the code or the link. Your friend can join as a guest, no sign-up needed.'],
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
    title: '1v1 Games Online – 12 Free Brain Game Duels',
    description:
      'Free 1v1 games in your browser: trivia, flags, chess puzzles, a 3D Rubik’s Cube, mini golf, timeline and more. Three rounds, best of three, no download.',
    h1: '1v1 games online: 12 brain games, one opponent',
    intro:
      'Duel is a 1v1 game where every match mixes three different brain games. You don’t pick the game: the server draws three at random from fourteen, so you need to be good at a bit of everything to win consistently. It runs in any browser, on phone or PC, and a match takes about five minutes.',
    how: [
      'Press Play: you are matched with a live player of similar rating, or a recorded duel of a real player (or a computer opponent) if nobody is online within a few seconds.',
      `Three rounds on three different games, drawn from: ${GAMES_SENTENCE}.`,
      'Win two rounds to win the duel. Every duel changes your Glicko-2 rating, overall and per game.',
      'Climb the leagues from Bronze to Legend and appear on the leaderboard once you create a free account.',
      'Want to beat someone you know? Create a private room and send the link.',
    ],
    about: [
      'Most 1v1 games online are shooters or fighting games. Duel is a 1v1 for your head: knowledge, logic, precision and speed. Both players always get exactly the same questions, puzzles or courses, so the better player wins, not the one with the better device or connection.',
      'Because the games change every match, a duel never feels the same twice. One round you are racing through chess puzzles, the next you are guessing the price of a Bugatti.',
    ],
    faq: [
      ['Is this the shooter game 1v1.LOL?', 'No. Duel (1v1game.net) is a 1v1 brain game: knowledge, logic and speed instead of building and shooting. It is free and runs in the browser.'],
      ['Do I need to download anything?', 'No. Open 1v1game.net and press Play. You can install it on your phone’s home screen like an app if you want.'],
      ['Which 1v1 games are included?', 'A trivia quiz with 1,200+ questions, a flag quiz with 194 countries, chess puzzles, a real 3D Rubik’s Cube, split the shape, guess the color, mini golf, a timeline game, an estimation game, guess the year, guess the price and guess the followers.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: '2-player-games',
    name: '2 player games',
    title: '2 Player Games Online – Free Quiz and Puzzle Duels',
    description:
      'Free 2 player games online: trivia, flags, chess puzzles, a Rubik’s Cube, mini golf and more. Play a stranger or send a friend a link. Phone or PC.',
    h1: '2 player games online, in your browser',
    intro:
      'Every match on Duel is a two-player game: you and one opponent, the same questions or puzzles at the same moment, and you see their score move while you play. It is built for short sessions (one duel takes about five minutes) and works the same on a phone, a tablet or a laptop.',
    how: [
      'Both players get exactly the same content in each round, so the faster and more accurate player wins.',
      'Scores update live on both screens during the round.',
      'Rounds are short: 10 seconds per trivia question, 6 seconds per flag, 30 seconds for five chess puzzles, 3 minutes for the cube.',
      'Play a friend in a private room: send a 5-character code or a link, and they can join without signing up.',
      'If nobody else is online, you play a recorded duel of a real player, so you never wait.',
    ],
    about: [
      'Two-player games are better when they are fair. On Duel nothing depends on luck of the draw between players: the server generates one set of questions, puzzles or courses per round and both of you play it, then compares the scores.',
      `You get variety without choosing: each duel draws three of the games (${GAMES_SENTENCE}).`,
    ],
    faq: [
      ['Can I play with a friend?', 'Yes. Choose “Play a friend”, create a room and send the code or the link. Friend duels do not change your rating, and you can ask for a rematch at the end.'],
      ['Can we play on the same device?', 'No, each player uses their own phone or computer, even when you are in the same room.'],
      ['Is it free?', 'Yes. Duel is free, with no download and no sign-up needed to start.'],
      COMMON_FAQ[1],
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
      'Most online quizzes are solo: you answer, you get a score, you leave. On Duel the quiz is a match: an opponent answers the same questions at the same time, and speed matters as much as knowledge. Warm up on the free quizzes with answers, then put it to the test in a 1v1.',
    how: [
      'Trivia rounds: 5 questions from 5 different categories, 10 seconds each.',
      'Each question has 1 to 5 stars; harder questions are worth more, and fast answers add up to 50 %.',
      'Flag quiz rounds: 8 flags, 6 seconds each, with wrong answers from the same region.',
      'Guessing quizzes: estimate numbers, release years, prices and follower counts.',
      'Free practice quizzes with answers on history, geography, science, sports, football, films, TV and more.',
    ],
    about: [
      'A quiz duel rewards two things: knowing the answer and trusting it quickly. That is why the same question can be worth 950 points to one player and 1,400 to another.',
      'If you just want to read questions and answers, the practice quizzes are free and organised by topic and in nine languages. There is also a quiz of the day with ten new questions every day.',
    ],
    faq: [
      ['What kind of quiz questions are there?', 'General knowledge in 12 categories: history, geography, science, sport, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.'],
      ['Are the practice questions the same as in the game?', 'No. The questions published on the practice pages are never used in ranked rounds, so reading them doesn’t give anyone an unfair edge.'],
      ['Can I play a quiz with friends?', 'Yes. Create a private room and send the link; your friend joins as a guest.'],
      COMMON_FAQ[0],
    ],
  },
  {
    slug: 'trivia-games',
    name: 'Trivia games',
    title: 'Trivia Games Online – Free Trivia, 1,200+ Questions',
    description:
      'Play free trivia games online: 1,200+ hand-checked questions in 12 categories, 1v1 trivia duels and trivia questions with answers. Phone and PC.',
    h1: 'Trivia games online, free and fast',
    intro:
      'Duel’s trivia is built for quick, fair games: every question is checked by hand, each round mixes five categories so nobody can rely on one specialty, and fast correct answers score more. Play a 1v1 trivia duel, or browse the trivia questions and answers by topic.',
    how: [
      '1,200+ questions, at least 90 per category, rated from 1 to 5 stars.',
      'Each trivia round takes about a minute: 5 questions, 10 seconds each.',
      'Trivia is one of 14 games in random duels, so a duel can also include flags, chess puzzles, mini golf or a guessing game , pinning a country on a globe, dating an old photo or naming a car or plane. The Rubik’s Cube is played in private rooms.',
      'A daily quiz of the day with 10 new questions to keep your streak going.',
    ],
    about: [
      'The star rating of every question is recalculated from real answers, so “hard” really means that most players get it wrong. A correct 5-star answer is worth almost three times a 1-star one.',
      'Twelve categories mean a lot of variety: from the Roman Empire to the Champions League, from the human body to Netflix series.',
    ],
    faq: [
      ['Is there a daily trivia quiz?', 'Yes: the quiz of the day has 10 new general knowledge questions every day, with a score you can share.'],
      ['Which trivia categories are there?', 'History, geography, science, sports, football, film & music, TV shows, medicine, maths, technology, beauty and famous people.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'brain-games',
    name: 'Brain games',
    title: 'Brain Games Online – Free Brain Training Duels',
    description:
      'Free brain games for adults: general knowledge, flags, chess puzzles, a 3D Rubik’s Cube, estimation and precision games, played as short 1v1 duels.',
    h1: 'Brain games online, played against an opponent',
    intro:
      'Brain training works better when there is something at stake. Duel turns fifteen brain games (knowledge, visual recognition, logic, spatial reasoning, estimation, precision and timing) into short duels against an opponent, with a rating that shows whether you are actually improving.',
    how: [
      'Knowledge: trivia questions from 12 categories.',
      'Visual memory: recognise the flags of 194 countries.',
      'Logic: chess puzzles, mate in 1 and mate in 2.',
      'Precision: split a shape 50/50 with one cut, match a color by eye, or sink a mini golf shot.',
      'Estimation: guess numbers, prices, release years and follower counts.',
      'Chronology: put four events in order on a timeline.',
      'Spatial reasoning: a real 3D Rubik’s Cube you turn with your finger or mouse.',
    ],
    about: [
      'Each game has its own rating, so you can see your strong and weak spots: maybe your trivia is excellent but your estimation is way off. Playing all fifteen keeps the training varied, which is more fun than repeating one exercise.',
    ],
    faq: [
      ['Is it suitable for adults and teenagers?', 'Yes. The content is general-audience and the difficulty adapts through matchmaking: you mostly play people of a similar rating.'],
      ['How long does a game take?', 'About five minutes for a full duel of three rounds.'],
      ...COMMON_FAQ,
    ],
  },
  {
    slug: 'geography-games',
    name: 'Geography games',
    title: 'Geography Games Online – Flag and Capital Quiz Duels',
    description:
      'Free geography games: guess the flags of 194 countries, world capitals and geography trivia in 1v1 duels, plus flag lists by continent to learn from.',
    h1: 'Geography games: flags, capitals and countries',
    intro:
      'Geography on Duel comes in two forms: the flag quiz, where you recognise 194 country flags against the clock, and geography trivia: capitals, rivers, mountains, deserts and borders. Learn with the flag lists by continent and the capitals quiz, then test yourself in a duel.',
    how: [
      'Flag rounds: 8 flags, 6 seconds each; the wrong options come from the same region.',
      'Geography trivia: capitals, rivers, mountains, oceans and record holders.',
      'Study pages: all flags of Europe, Asia, Africa, the Americas and Oceania, with names.',
      'A world capitals quiz with answers to practise before you play.',
    ],
    about: [
      'Geography is the category where studying pays off fastest. There are only 194 flags and capitals to learn, and the look-alikes (Chad and Romania, Monaco and Indonesia, Slovenia and Slovakia) decide most rounds.',
    ],
    faq: [
      ['How many countries are in the flag quiz?', 'All 194: the 193 UN member states plus Vatican City, grouped by continent.'],
      ['Can I learn the flags first?', 'Yes. The flag pages list every flag of each continent with the country name.'],
      ...COMMON_FAQ,
    ],
  },
];

const ALL_PAGES = [...TOPIC_PAGES, HOW_TO_PLAY, ...KEYWORD_PAGES];

const PAGE_CSS = `
*{box-sizing:border-box}body{margin:0;background:#ffeecc;color:#46425e;font:16px/1.6 Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:#15788c}main,header,footer{max-width:720px;margin:0 auto;padding:0 20px}
header{display:flex;align-items:center;justify-content:space-between;padding-top:20px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.03em;color:#46425e;text-decoration:none}
.dots{display:inline-flex;gap:5px;margin-right:8px;vertical-align:middle}.dots i{width:9px;height:9px;border-radius:50%;display:block}
h1{font-size:clamp(32px,7vw,48px);line-height:1.1;letter-spacing:-.03em;margin:40px 0 16px}
h2{font-size:20px;margin:36px 0 8px;letter-spacing:-.01em}.lead{font-size:18px;color:#5e5a75}
.cta{display:inline-block;background:#15788c;color:#ffeecc;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:16px;margin:24px 0}
.cta:hover{background:#11606f}ul{padding-left:20px}li{margin:6px 0}
.card{background:#fff8e6;border:1px solid #ecd9b4;border-radius:20px;padding:4px 20px;margin-top:12px}
.topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}
.topics a{background:#fff8e6;border:1px solid #ecd9b4;border-radius:16px;padding:14px;text-decoration:none;color:#46425e;font-weight:600}
.topics a:hover{border-color:#dcc59a}footer{color:#67637d;font-size:14px;padding:48px 20px 32px}
details{border-top:1px solid #ecd9b4;padding:12px 0}details:first-child{border-top:0}summary{font-weight:600;cursor:pointer}
header{flex-wrap:wrap;gap:8px}nav.top{display:flex;gap:16px;align-items:center;font-size:14px;font-weight:600}nav.top a{color:#5e5a75;text-decoration:none}nav.top a.play{color:#d94a55}
footer nav.foot{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:10px}footer nav.foot a{color:#67637d}footer nav.foot strong{color:#5e5a75;margin-right:4px}
.crumbs{font-size:13px;color:#67637d;margin-top:28px}.crumbs a{color:#67637d}
ol.qs{padding-left:0;list-style:none;counter-reset:q}ol.qs>li{counter-increment:q;background:#fff8e6;border:1px solid #ecd9b4;border-radius:16px;padding:14px 16px;margin:10px 0}
ol.qs>li h3{font-size:16px;margin:0 0 8px;line-height:1.4}ol.qs>li h3::before{content:counter(q) ". ";color:#67637d}
ol.opts{list-style:upper-alpha;margin:0 0 6px;padding-left:22px;color:#5e5a75}ol.opts li{margin:2px 0}
.diff{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#c8705f;margin-left:6px}
ol.qs details{border:0;padding:4px 0 0}ol.qs summary{color:#15788c;font-size:14px}.ans{font-weight:700;color:#15788c}
.flags{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px}
.flags div{background:#fff8e6;border:1px solid #ecd9b4;border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px}
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
    ['trivia', 'quiz-games', 'trivia-games', '1v1-games', 'brain-games', '2-player-games', 'timeline-game', 'estimation-game'].includes(p.slug)
      ? `<h2>Practice quizzes with answers</h2><p>Warm up with free quizzes by topic: <a href="/quiz">all quizzes</a>, <a href="/quiz/general-knowledge">general knowledge</a>, <a href="/quiz/history">history</a>, <a href="/quiz/geography">geography</a>, <a href="/quiz/science">science</a>, <a href="/quiz/football">football</a>, <a href="/quiz/world-capitals/">world capitals</a>, <a href="/quiz/space/">space</a> and more, or the <a href="/quiz-of-the-day/">quiz of the day</a>.</p>`
      : ['flag-quiz', 'geography-games'].includes(p.slug)
        ? `<h2>Flags by continent</h2><nav class="topics">${FLAG_REGIONS.map((r) => `<a href="/flag-quiz/${r.id}">Flags of ${esc(r.name)}</a>`).join('')}${hasPack() ? '<a href="/flag-quiz/north-america/">Flags of North America</a><a href="/flag-quiz/south-america/">Flags of South America</a>' : ''}</nav>`
        : '';
  const body = `<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.intro)}</p>
<a class="cta" href="/">Play now — it’s free</a>
<h2>How it works</h2>
<ul>${p.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
${p.about?.length ? `<h2>About ${esc(p.name)}</h2>${p.about.map((a) => `<p>${esc(a)}</p>`).join('')}` : ''}
${p.tips?.length ? `<h2>Tips to win</h2><ul>${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
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
  // Google shows ~60 characters: add the brand only when it still fits.
  const title = o.brand === false || o.title.length + ' | 1v1game'.length > 60 ? o.title : `${o.title} | 1v1game`;
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
<header><a class="logo" href="/"><span class="dots"><i style="background:#00b9be"></i><i style="background:#ffb0a3"></i><i style="background:#ff6973"></i></span>Duel</a>
<nav class="top"><a href="/quiz">Quizzes</a><a href="/flag-quiz">Flags</a><a href="/how-to-play">How to play</a><a href="/" class="play">Play free →</a></nav></header>
<main>
${o.bodyHtml}
</main>
<footer>
<nav class="foot"><strong>Games</strong> <a href="/trivia">Trivia duel</a> <a href="/chess-puzzles">Chess puzzles</a> <a href="/flag-quiz">Flag quiz</a> <a href="/rubiks-cube">Rubik’s Cube</a> <a href="/split-the-shape">Split the shape</a> <a href="/color-game">Guess the color</a> <a href="/mini-golf">Mini golf</a> <a href="/timeline-game">Timeline</a> <a href="/estimation-game">Estimation game</a> <a href="/guess-the-year">Guess the year</a> <a href="/price-guessing-game">Price game</a> <a href="/followers-game">Followers game</a></nav><p>© ${new Date().getFullYear()} Duel on 1v1game.net · 1v1 brain games in your browser · <a href="/privacy">Privacy</a></p>
</footer>
</body>
</html>`;
}


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
<link rel="canonical" href="${base}/privacy"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:site_name" content="1v1game"><meta property="og:title" content="Privacy Policy | 1v1game"><meta property="og:description" content="How 1v1game handles your data: nickname, game results and optional analytics."><meta property="og:url" content="${base}/privacy"><meta property="og:image" content="${base}/og.png"><meta name="twitter:card" content="summary_large_image"><style>${PAGE_CSS}</style></head><body>
<header><a class="logo" href="/"><span class="dots"><i style="background:#00b9be"></i><i style="background:#ffb0a3"></i><i style="background:#ff6973"></i></span>Duel</a></header>
<main><h1>Privacy Policy</h1><p class="lead">Short version: we store what the game needs, nothing more, and we never sell data.</p>
${section('What we store', 'Your nickname, a hashed password if you create an account (never the password itself), your ratings, and the results and moves of the duels you play. Rounds you play may be replayed to other players as a “ghost” opponent, shown with your nickname.')}
${section('Guests', 'Guests get a random nickname and a token saved in their browser. Guest data stays on our server until it is cleaned up; guests never appear on the leaderboard.')}
${section('Analytics', 'We count page views and game events (for example “duel finished”, with your score and rating change) to improve the game, linked to your account number, never to an email address. We use PostHog (hosted in the EU) for this. Cookies, Google Analytics, Microsoft Clarity and anonymised session recordings (what you tap on screen; typed text is hidden) only run if you accept them in the banner. You can change your mind by clearing this site’s data in your browser.')}
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
    res.type('text/plain').send(`User-agent: *\nAllow: /\nAllow: /api/guest\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${publicUrl()}/sitemap_index.xml\nSitemap: ${publicUrl()}/sitemap.xml\n${hasPack() ? `Sitemap: ${publicUrl()}/sitemap-i18n.xml\n` : ''}Sitemap: ${publicUrl()}/sitemap-images.xml\n`);
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
