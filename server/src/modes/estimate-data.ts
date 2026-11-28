import type { EstimateQ } from './estimate';
import { EVENTS } from './timeline';
import { EXTRA_OPINION } from './opinion-extra';
import { EXTRA_PRICES } from './price-extra';
import { FOLLOWER_QUESTIONS } from './followers-extra';
import { EXTRA_YEAR_QUESTIONS } from './year-extra';
import { SOLD } from './price-sold';

/** Round to 2 significant digits so reference answers don't look falsely precise. */
const sig2 = (n: number) => {
  const p = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
};

// ------------------------------------------------------------------ OPINION: "how many would fit"
// Bulk volume per object in cm³, packing already included (random-packed spheres ≈ 64 %).
const OBJECTS: [string, number][] = [
  ['tennis balls', 245],
  ['golf balls', 64],
  ['ping-pong balls', 52],
  ['football (soccer) balls', 8_700],
  ['basketballs', 11_300],
  ['marbles', 3.35],
  ['beach balls', 52_000],
  ['grains of rice', 0.024],
  ['LEGO 2×4 bricks (poured in)', 9.8],
  ['gummy bears', 4.2],
  ['rubber ducks', 600],
  ['smartphones (stacked neatly)', 100],
  ['bananas', 300],
  ['1-euro coins (poured in)', 1.65],
  ['sugar cubes (stacked)', 4.3],
  ['pieces of popped popcorn', 3.3],
  ['grapes', 7],
  ['apples', 450],
  ['watermelons', 11_700],
];

// Container volumes in m³ and the assumption revealed with the answer.
const CONTAINERS: [string, number, string][] = [
  ['a bedroom', 40, '4 × 4 × 2.5 m room'],
  ['a school bus', 48, 'inside of a school bus, about 48 m³'],
  ['an Olympic swimming pool', 2_500, '50 × 25 × 2 m pool'],
  ['a car boot (trunk)', 0.45, '450-litre boot'],
  ['a bathtub', 0.2, '200-litre bathtub'],
  ['a 40-foot shipping container', 67, '67 m³ container'],
  ['a jumbo jet cabin', 880, 'about 880 m³ of cabin'],
  ['an elevator', 10, '2 × 2 × 2.5 m elevator'],
  ['a fridge', 0.35, '350-litre fridge'],
  ['a whole house', 390, '150 m² house with 2.6 m ceilings'],
  ['the Great Pyramid of Giza', 2_580_000, 'about 2.6 million m³'],
  ['a hot-air balloon', 2_200, 'about 2,200 m³ envelope'],
  ['a backpack', 0.025, '25-litre backpack'],
  ['a classroom', 168, '8 × 7 × 3 m classroom'],
  ['a phone booth', 2.3, '1 × 1 × 2.3 m booth'],
  ['a 5-litre bucket', 0.005, '5 litres'],
  ['the Royal Albert Hall', 86_650, 'about 86,650 m³ inside'],
];

function packingQuestions(): EstimateQ[] {
  const out: EstimateQ[] = [];
  for (const [obj, cm3] of OBJECTS)
    for (const [where, m3, note] of CONTAINERS) {
      const n = (m3 * 1e6) / cm3;
      if (n < 5 || n > 1e14) continue;
      out.push({ q: `How many ${obj} would fit in ${where}?`, answer: sig2(n), note: `Our estimate: ${note}, real sizes, realistic packing.` });
    }
  return out;
}

// ------------------------------------------------------------------ OPINION: crazy numbers with a known answer
const FACTS: [string, number, string?][] = [
  ['How many times does a human heart beat in an 80-year life?', 2.9e9, '70 beats a minute'],
  ['How many breaths does a person take in an 80-year life?', 6.3e8, '15 breaths a minute'],
  ['How many hairs are on an average human head?', 100_000],
  ['How many grains of sand are in 1 kg of sand?', 6e6, 'medium sand, 0.5 mm grains'],
  ['How many words are in the King James Bible?', 783_000],
  ['How many words are in all seven Harry Potter books together?', 1_084_000],
  ['How many steps would it take to walk around the Equator?', 5.3e7, '75 cm steps over 40,075 km'],
  ['How many litres of water are in an Olympic swimming pool?', 2_500_000],
  ['How many bricks were used to build the Empire State Building?', 10_000_000],
  ['How many trees are there on Earth?', 3e12, 'Nature, 2015 study'],
  ['How many ants are alive on Earth, according to a 2022 study?', 2e16, 'PNAS, 2022 estimate'],
  ['How many chickens are alive on Earth?', 3e10],
  ['How many cups of coffee are drunk worldwide every day (2020s estimate)?', 2.25e9],
  ['How many emails were sent worldwide every day in 2024?', 3.5e11, 'estimate'],
  ['How many Google searches happened every day in 2024?', 8.5e9, 'estimate'],
  ['How many stars can you see with the naked eye across the whole sky?', 9_000],
  ['How many kilometres away is the Moon?', 384_400],
  ['How many taste buds are on a human tongue?', 10_000],
  ['How many kilometres of blood vessels are in one human body?', 100_000],
  ['How many cells make up a human body?', 3.7e13],
  ['How many times do you blink in a day?', 15_000],
  ['How many litres of saliva does a person produce in a lifetime?', 30_000, 'about 1 litre a day for 80 years'],
  ['How many tonnes does the Eiffel Tower weigh?', 10_100],
  ['How many metres tall is Mount Everest?', 8_849],
  ['How many islands does Sweden have?', 267_570],
  ['How many languages are spoken in the world (Ethnologue, 2024)?', 7_000],
  ['How many different positions can a Rubik’s Cube be in?', 4.3e19],
  ['How many litres of blood does the heart pump in one day?', 7_500],
  ['How many McDonald’s restaurants were there worldwide in 2023?', 41_000, '2023'],
  ['How many Starbucks stores were there worldwide in 2023?', 38_000, '2023'],
  ['How many articles did the English Wikipedia have in 2025?', 6.9e6, '2025'],
  ['How many hours of video were uploaded to YouTube every minute in 2019?', 500, 'YouTube, 2019'],
  ['How many photos were taken worldwide in 2023?', 1.8e12, '2023 estimate'],
  ['How many golf balls are lost in the US every year (2010s estimate)?', 3e8],
  ['How many planes are in the air at any given moment (busy day, 2024)?', 10_000],
  ['How many airline passengers flew in 2019?', 4.5e9],
  ['How many babies are born worldwide every day (2024)?', 385_000],
  ['How many grains of rice are in a 1 kg bag?', 50_000],
  ['How many sesame seeds are on a Big Mac bun?', 178, 'McDonald’s average'],
  ['How many stitches are on a baseball?', 108],
  ['How many dimples are on a golf ball?', 350, 'usually between 300 and 400'],
  ['How many kilometres long is the Great Wall of China, all branches included?', 21_196],
  ['How many steps does it take to climb to the top of the Eiffel Tower?', 1_665],
  ['How many windows does the Empire State Building have?', 6_514],
  ['How many bees live in a strong hive in summer?', 50_000],
  ['How many eggs does a queen bee lay in one day?', 1_500],
  ['How many feathers does a swan have?', 25_000],
  ['How many spines does a hedgehog have?', 6_000],
  ['How many kilograms does a blue whale weigh?', 150_000],
  ['How many kilograms does a blue whale’s heart weigh?', 180],
  ['How many muscles are in an elephant’s trunk?', 40_000],
  ['How many kilometres does light travel in one second?', 299_792],
  ['How fast does Earth move around the Sun, in km per hour?', 107_000],
  ['How many lightning strikes hit Earth every day?', 3.8e6, 'about 44 per second'],
  ['How many earthquakes are detected in a year?', 500_000],
  ['How many litres of water does it take to make one pair of jeans?', 7_500],
  ['How many litres of water does it take to produce 1 kg of beef?', 15_400],
  ['How many litres of water does it take to make one cup of coffee, growing the beans included?', 140],
  ['How many possible combinations are there in a 6-out-of-49 lottery?', 13_983_816],
  ['How many seconds are there in 100 years?', 3.16e9],
  ['How many people have ever lived on Earth (estimate made in 2022)?', 1.17e11, 'Population Reference Bureau estimate'],
  ['How many songs were on Spotify in 2022?', 1e8, 'Spotify, 2022'],
  ['How many copies of the video game Minecraft had been sold by April 2025?', 3.5e8, 'Guinness World Records'],
  ['How many coins would you need to stack to reach the Moon?', 2.5e11, '1.5 mm thick coins'],
  ['How many sheets of paper would you need to stack to reach the top of Everest?', 8.8e7, '0.1 mm sheets'],
  ['How many football pitches would fit in Monaco?', 290, '2.08 km² country, 7,140 m² pitch'],
  ['How many Earths would fit inside the Sun?', 1.3e6],
  ['How many Moons would fit inside the Earth?', 49],
  ['How many times does a hummingbird beat its wings in a minute?', 3_000],
  ['How many kilograms of food does an elephant eat in a day?', 150],
  ['How many hours does a koala sleep in a week?', 140, 'about 20 hours a day'],
  ['How many litres of water does an average person drink in a lifetime?', 60_000, 'about 2 litres a day'],
  ['How many kilometres does an average person walk in a lifetime?', 110_000],
  ['How many pizzas are eaten in the US every day (2010s estimate)?', 3e6, '100 million slices'],
  ['How many LEGO bricks would you need to build a tower to the Moon?', 4e10, '9.6 mm bricks'],
];

export function opinionQuestions(): EstimateQ[] {
  const facts = [...FACTS, ...EXTRA_OPINION].map(([q, answer, note]) => ({ q, answer, note }));
  return [...facts, ...facts, ...packingQuestions()]; // facts weighted twice so rounds mix both kinds
}

// ------------------------------------------------------------------ RELEASE YEAR (any year, BC as negative)
const YEARS: [string, number][] = [
  ['E.T. the Extra-Terrestrial (film)', 1982], ['Back to the Future (film)', 1985], ['Top Gun (film)', 1986], ['Die Hard (film)', 1988],
  ['Home Alone (film)', 1990], ['Jurassic Park (film)', 1993], ['The Lion King (film)', 1994], ['Pulp Fiction (film)', 1994],
  ['Toy Story (film)', 1995], ['Titanic (film)', 1997], ['The Matrix (film)', 1999], ['Gladiator (film)', 2000],
  ['Shrek (film)', 2001], ['Spirited Away (film)', 2001], ['The Lord of the Rings: The Fellowship of the Ring (film)', 2001],
  ['Finding Nemo (film)', 2003], ['Mean Girls (film)', 2004], ['The Dark Knight (film)', 2008], ['Avatar (film)', 2009], ['Up (film)', 2009],
  ['Inception (film)', 2010], ['Frozen (film)', 2013], ['Interstellar (film)', 2014], ['Mad Max: Fury Road (film)', 2015], ['Inside Out (film)', 2015],
  ['Deadpool (film)', 2016], ['Get Out (film)', 2017], ['Black Panther (film)', 2018], ['Avengers: Endgame (film)', 2019], ['Joker (film)', 2019],
  ['Parasite (film)', 2019], ['Dune (film)', 2021], ['Top Gun: Maverick (film)', 2022], ['Everything Everywhere All at Once (film)', 2022],
  ['Barbie (film)', 2023], ['Oppenheimer (film)', 2023],
  ['Pac-Man (game)', 1980], ['Tetris (video game) created', 1984], ['Super Mario Bros. (game)', 1985], ['The Legend of Zelda (game)', 1986],
  ['Street Fighter II (game)', 1991], ['Sonic the Hedgehog (game)', 1991], ['Doom (game)', 1993], ['Pokémon Red and Green (game)', 1996],
  ['Super Mario 64 (game)', 1996], ['GoldenEye 007 (game)', 1997], ['Half-Life (game)', 1998], ['The Sims (game)', 2000],
  ['Counter-Strike 1.0 (video game)', 2000], ['Halo: Combat Evolved (game)', 2001], ['GTA: San Andreas (game)', 2004], ['World of Warcraft (game)', 2004],
  ['Wii Sports (game)', 2006], ['Portal (game)', 2007], ['Minecraft (video game): first public version', 2009], ['League of Legends (game)', 2009],
  ['Angry Birds (game)', 2009], ['Skyrim (game)', 2011], ['Candy Crush Saga (game)', 2012], ['GTA V (game)', 2013], ['Flappy Bird (game)', 2013],
  ['The Witcher 3 (game)', 2015], ['Overwatch (game)', 2016], ['Pokémon Go (game)', 2016], ['Zelda: Breath of the Wild (game)', 2017],
  ['Fortnite Battle Royale (game)', 2017], ['Red Dead Redemption 2 (game)', 2018], ['Among Us (game)', 2018],
  ['Animal Crossing: New Horizons (game)', 2020], ['Elden Ring (game)', 2022], ['Baldur’s Gate 3 (game)', 2023],
  ['“Africa” by Toto (song)', 1982], ['“Never Gonna Give You Up” by Rick Astley', 1987],
  ['“Like a Prayer” by Madonna', 1989], ['“Smells Like Teen Spirit” by Nirvana', 1991], ['“Wonderwall” by Oasis', 1995],
  ['“...Baby One More Time” by Britney Spears', 1998], ['“Crazy in Love” by Beyoncé', 2003], ['“Hey Ya!” by OutKast', 2003],
  ['“Dragostea Din Tei” by O-Zone', 2003], ['“Umbrella” by Rihanna', 2007], ['“Poker Face” by Lady Gaga', 2008],
  ['“Rolling in the Deep” by Adele', 2010], ['“Gangnam Style” by PSY', 2012], ['“Happy” by Pharrell Williams', 2013],
  ['“Uptown Funk” by Mark Ronson ft. Bruno Mars', 2014], ['“Despacito” by Luis Fonsi', 2017], ['“Shape of You” by Ed Sheeran', 2017],
  ['“Old Town Road” by Lil Nas X', 2019], ['“Blinding Lights” by The Weeknd', 2019], ['“Bad Guy” by Billie Eilish', 2019], ['“Flowers” by Miley Cyrus', 2023],
  ['First YouTube video, “Me at the zoo”, uploaded', 2005], ['“Charlie Bit My Finger” (viral YouTube video) goes viral', 2007], ['Harlem Shake (viral video meme)', 2013],
  ['Ice Bucket Challenge (viral charity challenge)', 2014], ['“The Dress” (viral photo): blue and black or white and gold?', 2015], ['Fidget spinner (toy) craze peaks', 2017],
  ['First iPhone (smartphone) released', 2007], ['Facebook (social network) launched', 2004], ['Twitter (social network) launched', 2006], ['Instagram (photo app) launched', 2010],
  ['Bitcoin (cryptocurrency) whitepaper published', 2008], ['ChatGPT (AI chatbot) released', 2022], ['Windows 95 (operating system) released', 1995], ['Google (search engine company) founded', 1998],
  ['Wikipedia (online encyclopedia) launched', 2001], ['Fall of the Berlin Wall', 1989], ['Chernobyl disaster', 1986], ['Euro coins and notes introduced', 2002],
  ['Tamagotchi (digital pet toy) launched in Japan', 1996], ['Game Boy (handheld console) released', 1989], ['Netflix starts its streaming service', 2007], ['COVID-19 declared a pandemic', 2020], ];

/**
 * All "which year" questions: the original list, the extra films/games/songs/series/launches, and the
 * Timeline's history, science and music events (BC included). Films and games from 1980 on are already
 * asked by title, so the Timeline's versions of those are left out. First occurrence of a text wins.
 */
export const yearQuestions = (): EstimateQ[] => {
  const seen = new Set<string>();
  // Same wording everywhere: "(video game)", and songs say they are songs.
  const tidy = (q: string) => {
    let t = q.replace(/ \(game\)$/, ' (video game)');
    if (/^“[^”]+” by /.test(t) && !t.includes('(')) t += ' (song)';
    return t;
  };
  const rows: [string, number][] = [
    ...YEARS.map(([q, y]) => [tidy(q), y] as [string, number]),
    ...EXTRA_YEAR_QUESTIONS,
    ...EVENTS.filter((e) => !((e.kind === 'movie' || e.kind === 'game') && e.year >= 1980)).map((e) => [e.label, e.year] as [string, number]),
  ];
  return rows.filter(([q]) => !seen.has(q.toLowerCase()) && seen.add(q.toLowerCase())).map(([q, answer]) => ({ q, answer }));
};

// ------------------------------------------------------------------ PRICE (USD, typical price)
const PRICES: [string, number, string?][] = [
  ['A Big Mac in the US', 5.7, '2024 average'], ['A Starbucks grande latte (US)', 5, '2024'], ['A Snickers bar (US)', 1.5],
  ['A pack of instant ramen (US)', 0.4], ['A can of Red Bull (250 ml, US)', 2.5], ['A Costco hot dog and soda combo', 1.5, 'unchanged since 1985'],
  ['A single banana (US)', 0.25], ['A Bic Cristal pen (one pen, sold in packs)', 0.3], ['A gallon of gasoline in the US', 3.5, '2024 average'],
  ['Netflix Standard plan, per month (US)', 15.49, '2024'], ['Spotify Premium Individual, per month (US)', 11.99, '2024'],
  ['ChatGPT Plus, per month', 20], ['A classic Monopoly board game', 20], ['A Rubik’s Cube 3×3 (original brand)', 10],
  ['IKEA Billy bookcase (80 cm, white)', 70], ['A Victorinox Classic SD Swiss Army knife', 22], ['Nike Air Force 1 ’07 (white)', 115, '2024'],
  ['Levi’s 501 jeans', 80], ['PlayStation 5 DualSense controller', 70], ['GTA V at launch (2013)', 60], ['The original Game Boy at launch (1989)', 89.99],
  ['Apple AirPods Pro (2nd gen)', 249], ['Apple Pencil Pro', 129], ['Steam Deck 64 GB at launch', 399], ['Nintendo Switch OLED', 349],
  ['PlayStation 5 (disc edition) at launch', 499], ['Xbox Series X at launch', 499], ['Meta Quest 3 (128 GB) at launch', 499],
  ['iPhone 15 at launch', 799], ['iPhone 15 Pro at launch', 999], ['Apple Watch Ultra 2', 799], ['MacBook Air 13″ (M3, 2024)', 1_099],
  ['Dyson Supersonic hair dryer', 429], ['LEGO Eiffel Tower (set 10307)', 630], ['LEGO UCS Millennium Falcon (set 75192)', 850],
  ['Apple Vision Pro at launch', 3_499], ['Rolex Submariner Date (list price)', 10_250, '2023 list price'],
  ['Patek Philippe Nautilus 5711 (list price before it was discontinued)', 35_000], ['Tesla Model 3 (base, US)', 39_000, '2024'],
  ['Lamborghini Huracán (base)', 250_000], ['Ferrari SF90 Stradale', 507_000], ['Bugatti Chiron', 3_000_000],
  ['A seat on a Virgin Galactic space flight', 450_000], ['An F-35A fighter jet', 82_500_000], ['A Boeing 737 MAX 8 (list price)', 121_600_000],
  ['Building the Burj Khalifa in Dubai (finished 2010)', 1_500_000_000, 'in 2010 dollars'],
  ['A Louvre entry ticket (adult, 2024, in USD)', 24],
];

/**
 * The year a price is from goes into the question (prices change); undated base prices are 2024 US prices.
 * Old prices also say they are in the dollars of that year (an 1803 or 1990 dollar is not a 2026 dollar).
 */
const OLD_BEFORE = 2020;
const dollarsOf = (y: number) => (y < OLD_BEFORE ? `, in ${y} dollars` : '');
const withYear = (q: string, note: string | undefined, fallback: string) => {
  const y = note?.match(/\b(1[5-9]|20)\d{2}\b/)?.[0] ?? q.match(/\b(1[5-9]|20)\d{2}\b/g)?.pop();
  const said = /dollars/.test(q);
  if (y && q.includes(y)) {
    const add = said ? '' : dollarsOf(Number(y)).slice(2);
    if (!add) return `${q}?`;
    // "… (finished 1931)" → "… (finished 1931, in 1931 dollars)"
    return q.endsWith(')') ? `${q.slice(0, -1)}, ${add})?` : `${q} (${add})?`;
  }
  const tag = y ? `${y}${said ? '' : dollarsOf(Number(y))}` : fallback;
  return tag ? `${q} (${tag})?` : `${q}?`;
};
export const priceQuestions = (): EstimateQ[] => [
  ...PRICES.map(([q, answer, note]) => ({ q: withYear(q, note, 'US price, 2024'), answer, unit: '$', note: note ?? 'typical US price, 2024' })),
  ...EXTRA_PRICES.map(([q, answer, note]) => ({ q: withYear(q, note, ''), answer, unit: '$', note })),
  // Things that were sold: "…, sold in 1990" + "(in 1990 dollars)".
  ...SOLD.map(([q, answer, note]) => ({ q: withYear(q, note, ''), answer, unit: '$', note })),
];


/** "Followers": the date each number is from is part of the question (these numbers move). */
export const followerQuestions = (): EstimateQ[] =>
  FOLLOWER_QUESTIONS.map(([who, answer, unit, when, note]) => ({ q: `${who}: how many ${unit} (${when})?`, answer, unit, note }));
