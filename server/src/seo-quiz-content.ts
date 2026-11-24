/**
 * Hand-written copy for the quiz landing pages. Each page targets one search cluster (see
 * docs/seo-keywords.md); titles lead with the head term, descriptions sell the click, intros are unique.
 */
import type { TriviaCategory } from './modes/trivia';

export interface QuizPageCopy {
  cat: TriviaCategory;
  slug: string;
  name: string; // "History"
  title: string; // <title>, {n} = number of questions on the page
  description: string;
  h1: string;
  intro: string;
  faq: [string, string][];
  related: string[]; // slugs
}

export const QUIZ_PAGES: QuizPageCopy[] = [
  {
    cat: 'history', slug: 'history', name: 'History',
    title: 'History Quiz: {n} History Trivia Questions & Answers',
    description: 'Free history quiz with {n} trivia questions and answers: ancient Rome and Egypt, the World Wars, revolutions, empires and Romanian history. Then duel a real player.',
    h1: 'History quiz: trivia questions and answers',
    intro: 'From the pharaohs and the Roman Empire to the fall of the Berlin Wall, these history trivia questions cover the people, battles and dates every history buff should know. Each question has four options; open the answer when you are ready. Want a real challenge? Play a live history round against another player and climb the rankings.',
    faq: [
      ['How hard are these history questions?', 'They mix easy, medium and hard questions, from the year World War II ended to who led the Expedition of the Thousand.'],
      ['Can I play a history quiz against someone?', 'Yes. Duel matches you with a real opponent in seconds: three rounds on random topics, and history is one of the trivia categories.'],
    ],
    related: ['geography', 'celebrities', 'general-knowledge'],
  },
  {
    cat: 'geography', slug: 'geography', name: 'Geography',
    title: 'Geography Quiz: {n} Questions on Capitals, Rivers & Countries',
    description: 'Test yourself with {n} geography quiz questions and answers: world capitals, rivers, mountains, deserts and countries. Free, no sign-up, then play 1v1.',
    h1: 'Geography quiz: capitals, rivers and countries',
    intro: 'Know the capital of Kazakhstan or the river that flows through Baghdad? This geography quiz covers world capitals, the longest rivers, the highest mountains, lakes, deserts and borders. It is great practice for pub quizzes and school tests alike, and it pairs perfectly with our flag quiz.',
    faq: [
      ['Is there a capital cities quiz?', 'Yes, many of these geography questions are about capital cities, from Canberra to Ulaanbaatar.'],
      ['Where can I practise flags?', 'Try the flag quiz: 194 countries, grouped by continent, with names.'],
    ],
    related: ['flags', 'history', 'general-knowledge'] as string[],
  },
  {
    cat: 'science', slug: 'science', name: 'Science',
    title: 'Science Quiz: {n} Science Trivia Questions & Answers',
    description: 'Free science quiz with {n} questions and answers on physics, chemistry, biology, space and famous scientists. Learn something new, then duel a real player.',
    h1: 'Science quiz: physics, chemistry, biology and space',
    intro: 'Chemical symbols, planets and moons, the speed of sound, famous scientists and how the human body works: this science quiz has questions for curious minds of every level. It is a fun way to revise for exams or to win your next trivia night.',
    faq: [
      ['What topics does the science quiz cover?', 'Physics, chemistry, biology, astronomy, earth science and the history of science.'],
      ['Are the answers checked?', 'Yes. Every question is hand-checked and has exactly one correct answer.'],
    ],
    related: ['medical', 'math', 'technology'],
  },
  {
    cat: 'sport', slug: 'sports', name: 'Sports',
    title: 'Sports Quiz: {n} Sports Trivia Questions & Answers',
    description: 'Sports quiz with {n} trivia questions and answers on the Olympics, tennis, basketball, F1, golf and athletics. Free online, then challenge a real opponent.',
    h1: 'Sports quiz: Olympics, tennis, basketball, F1 and more',
    intro: 'Grand Slams, Olympic records, Formula 1, the NBA, golf scoring and the rules of rugby: this sports trivia quiz is for fans who know more than just the scores. If football is your thing, there is a dedicated football quiz too.',
    faq: [
      ['Is football included?', 'Football has its own quiz with Champions League, World Cup and Premier League questions.'],
      ['Can I play sports trivia with friends?', 'Duel is a 1v1 game: you are matched against a real opponent and see their score live.'],
    ],
    related: ['football', 'general-knowledge', 'celebrities'],
  },
  {
    cat: 'film_music', slug: 'movies-music', name: 'Movies & Music',
    title: 'Movie & Music Quiz: {n} Film and Music Trivia Questions',
    description: 'Movie quiz and music quiz in one: {n} questions and answers on Oscar winners, directors, classic films, bands, hit songs and composers. Free online.',
    h1: 'Movie and music quiz',
    intro: 'Who directed The Godfather? Which band recorded Bohemian Rhapsody? This quiz mixes cinema and music: Oscar winners, famous directors, film quotes, rock legends, pop hits and classical composers. Perfect for film buffs and music lovers.',
    faq: [
      ['Is it a movie quiz or a music quiz?', 'Both: the questions cover films, soundtracks, bands, singers and classical music.'],
      ['How do I play live?', 'Press Play on Duel. Film & Music is one of the trivia categories in ranked duels.'],
    ],
    related: ['tv-shows', 'celebrities', 'general-knowledge'],
  },
  {
    cat: 'football', slug: 'football', name: 'Football',
    title: 'Football Quiz: {n} Soccer Trivia Questions & Answers',
    description: 'Football quiz with {n} soccer trivia questions and answers: World Cup, Champions League, Premier League, Ballon d’Or, legendary players and clubs.',
    h1: 'Football quiz: soccer trivia questions and answers',
    intro: 'World Cup winners, Champions League finals, Ballon d’Or winners, club nicknames and the laws of the game: this football quiz is built for real fans. From Pelé and Maradona to Messi, Ronaldo and Haaland, how many can you get right?',
    faq: [
      ['Is this soccer trivia up to date?', 'It includes recent seasons such as the 2024–25 Premier League and the 2025 Champions League final.'],
      ['Can I play football trivia against someone?', 'Yes. Football questions come up in Duel’s live 1v1 trivia rounds.'],
    ],
    related: ['sports', 'celebrities', 'general-knowledge'],
  },
  {
    cat: 'medicine', slug: 'medical', name: 'Medical',
    title: 'Medical Quiz: {n} Health & Human Body Trivia Questions',
    description: 'Medical quiz with {n} questions and answers on the human body, vitamins, diseases, organs and medical history. Great for students. Free online.',
    h1: 'Medical quiz: the human body, health and medicine',
    intro: 'How many vertebrae are in the neck? Which vitamin helps blood clot? Who performed the first heart transplant? This medical trivia quiz covers anatomy, physiology, vitamins, infectious diseases, medical specialties and the pioneers of medicine. A great refresher for nursing and medical students.',
    faq: [
      ['Is this quiz medical advice?', 'No. It is a trivia game for learning and fun, not health advice.'],
      ['Who is it for?', 'Anyone curious about the human body, and students revising anatomy and physiology basics.'],
    ],
    related: ['science', 'general-knowledge', 'math'],
  },
  {
    cat: 'math', slug: 'math', name: 'Math',
    title: 'Math Quiz: {n} Math Trivia Questions with Answers',
    description: 'Math quiz with {n} questions and answers: arithmetic, geometry, primes, fractions, Roman numerals and famous mathematicians. Plus a 1v1 mental math game.',
    h1: 'Math quiz: numbers, geometry and famous mathematicians',
    intro: 'Primes, fractions, angles, Roman numerals, logarithms and the stories behind Gauss and Archimedes: this math quiz is part mental arithmetic, part maths trivia. When you are warmed up, try the timed mental math duel against a real player.',
    faq: [
      ['Is there a mental math game?', 'Yes. Duel has a 60-second mental math round where problems get harder as you go.'],
      ['What level are the questions?', 'From primary-school arithmetic to questions about Gödel and the Poincaré conjecture.'],
    ],
    related: ['science', 'technology', 'general-knowledge'],
  },
  {
    cat: 'technology', slug: 'technology', name: 'Technology',
    title: 'Technology Quiz: {n} Tech & Computer Trivia Questions',
    description: 'Tech quiz with {n} questions and answers on computers, the internet, programming languages, gadgets, video games, AI and tech founders. Free online.',
    h1: 'Technology quiz: computers, the internet and AI',
    intro: 'What does HTTP stand for? Who created Python? Which company makes Fortnite? This technology quiz covers computer basics, internet history, programming languages, video games, gadgets, cybersecurity and artificial intelligence.',
    faq: [
      ['Is this a computer quiz for beginners?', 'It mixes easy computer basics with harder questions for developers and tech fans.'],
      ['Does it include video games?', 'Yes, from Pong and Tetris to Minecraft, Fortnite and League of Legends.'],
    ],
    related: ['science', 'math', 'general-knowledge'],
  },
  {
    cat: 'cosmetics', slug: 'beauty', name: 'Beauty & Makeup',
    title: 'Beauty Quiz: {n} Makeup, Skincare & Perfume Questions',
    description: 'Beauty quiz with {n} questions and answers on skincare ingredients, makeup, perfume, hair care and famous beauty brands. How much do you know?',
    h1: 'Beauty quiz: makeup, skincare and perfume',
    intro: 'Retinol or niacinamide? What does SPF really measure? Which notes of a perfume do you smell first? This beauty and makeup quiz covers skincare ingredients, sun protection, makeup techniques, nail and hair care, fragrances and the stories behind famous brands.',
    faq: [
      ['Is this a skincare quiz too?', 'Yes. Many questions are about skincare ingredients, SPF and how skin works.'],
      ['Can I play it against a friend?', 'Beauty & Cosmetics is one of Duel’s live trivia categories.'],
    ],
    related: ['celebrities', 'tv-shows', 'general-knowledge'],
  },
  {
    cat: 'tv_shows', slug: 'tv-shows', name: 'TV Shows',
    title: 'TV Show Quiz: {n} Questions on Netflix, HBO & Sitcoms',
    description: 'TV show quiz with {n} trivia questions and answers: Friends, Game of Thrones, Breaking Bad, Stranger Things, The Simpsons, anime and reality TV.',
    h1: 'TV show quiz: sitcoms, dramas, anime and Netflix hits',
    intro: 'Central Perk, Winterfell, Hawkins and Springfield: if those names mean something to you, this TV trivia quiz is for you. It covers classic sitcoms, HBO and Netflix dramas, cartoons, anime and the reality shows everyone talks about.',
    faq: [
      ['Which shows are in the TV quiz?', 'Friends, The Office, Breaking Bad, Game of Thrones, Stranger Things, The Simpsons, Squid Game, anime and many more.'],
      ['Is there a movie quiz too?', 'Yes, see the movie and music quiz.'],
    ],
    related: ['movies-music', 'celebrities', 'general-knowledge'],
  },
  {
    cat: 'celebrities', slug: 'celebrities', name: 'Famous People',
    title: 'Celebrity Quiz: {n} Questions on Famous People',
    description: 'Celebrity quiz with {n} questions and answers on famous people: singers, actors, artists, writers, athletes and world figures. Free online trivia.',
    h1: 'Celebrity quiz: famous people trivia',
    intro: 'Painters and poets, pop stars and film legends, inventors and royals: this famous people quiz asks who did what, who comes from where and who is behind the stage name. A great mix of pop culture and general knowledge.',
    faq: [
      ['Who is in the celebrity quiz?', 'Artists like Picasso and Frida Kahlo, singers like Adele and Rihanna, actors, writers, athletes and royals.'],
      ['Is there a mixed general knowledge quiz?', 'Yes, the general knowledge quiz mixes questions from every category.'],
    ],
    related: ['movies-music', 'tv-shows', 'history'],
  },
];

export const GENERAL_KNOWLEDGE = {
  slug: 'general-knowledge',
  title: 'General Knowledge Quiz: {n} Trivia Questions & Answers (Free)',
  description: 'Free general knowledge quiz with {n} trivia questions and answers from history, geography, science, sport, movies, TV and more. Then play 1v1 against a real person.',
  h1: 'General knowledge quiz',
  intro: 'A mixed trivia quiz with questions from every category: history, geography, science, sport, football, movies, music, TV, medicine, maths, technology, beauty and famous people. Ideal for pub quiz practice, family quiz nights and classroom warm-ups.',
  faq: [
    ['How many questions are in the general knowledge quiz?', 'This page shows a mixed selection; Duel has more than 1,200 hand-checked trivia questions in total.'],
    ['Is it free?', 'Yes, completely free, with no sign-up needed to play.'],
  ] as [string, string][],
};

export const QUIZ_HUB = {
  title: 'Free Online Quiz Games: 1,200+ Trivia Questions & Answers',
  description: 'Free online quizzes and trivia questions with answers: general knowledge, history, geography, science, sports, football, movies, TV, flags and more. Play 1v1 live.',
  h1: 'Free online quizzes and trivia questions',
  intro: 'Pick a quiz below to practise with real questions and answers, or press Play to challenge a real opponent: three rounds, random topics, best of three wins. Duel combines trivia with flag quizzes, chess puzzles, mental math and a real Rubik’s Cube.',
};

export const FLAG_REGIONS = [
  { id: 'europe', name: 'Europe', adjective: 'European' },
  { id: 'asia', name: 'Asia', adjective: 'Asian' },
  { id: 'africa', name: 'Africa', adjective: 'African' },
  { id: 'americas', name: 'the Americas', adjective: 'American' },
  { id: 'oceania', name: 'Oceania', adjective: 'Oceanian' },
] as const;
