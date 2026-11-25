import type { EstimateQ } from './estimate';

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
  ['How many ants are alive on Earth right now?', 2e16, 'PNAS, 2022 estimate'],
  ['How many chickens are alive on Earth?', 3e10],
  ['How many cups of coffee are drunk worldwide every day?', 2.25e9],
  ['How many emails are sent worldwide every day?', 3.5e11],
  ['How many Google searches happen every day?', 8.5e9],
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
  ['How many languages are spoken in the world today?', 7_000],
  ['How many different positions can a Rubik’s Cube be in?', 4.3e19],
  ['How many litres of blood does the heart pump in one day?', 7_500],
  ['How many McDonald’s restaurants are there worldwide?', 41_000, '2023'],
  ['How many Starbucks stores are there worldwide?', 38_000, '2023'],
  ['How many articles does the English Wikipedia have?', 6.9e6, '2025'],
  ['How many hours of video are uploaded to YouTube every minute?', 500],
  ['How many photos are taken worldwide in a year?', 1.8e12, '2023 estimate'],
  ['How many golf balls are lost in the US every year?', 3e8],
  ['How many planes are in the air at any given moment?', 10_000],
  ['How many airline passengers flew in 2019?', 4.5e9],
  ['How many babies are born worldwide every day?', 385_000],
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
  ['How many people have ever lived on Earth?', 1.17e11, 'Population Reference Bureau estimate'],
  ['How many songs are on Spotify?', 1e8],
  ['How many copies of Minecraft have been sold?', 3e8, '2023'],
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
  ['How many pizzas are eaten in the US every day?', 3e6, '100 million slices'],
  ['How many LEGO bricks would you need to build a tower to the Moon?', 4e10, '9.6 mm bricks'],
];

export function opinionQuestions(): EstimateQ[] {
  const facts = FACTS.map(([q, answer, note]) => ({ q, answer, note }));
  return [...facts, ...facts, ...packingQuestions()]; // facts weighted twice so rounds mix both kinds
}

// ------------------------------------------------------------------ RELEASE YEAR (1980–2026)
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
  ['Pac-Man (game)', 1980], ['Tetris is created', 1984], ['Super Mario Bros. (game)', 1985], ['The Legend of Zelda (game)', 1986],
  ['Street Fighter II (game)', 1991], ['Sonic the Hedgehog (game)', 1991], ['Doom (game)', 1993], ['Pokémon Red and Green (game)', 1996],
  ['Super Mario 64 (game)', 1996], ['GoldenEye 007 (game)', 1997], ['Half-Life (game)', 1998], ['The Sims (game)', 2000],
  ['Counter-Strike 1.0 (game)', 2000], ['Halo: Combat Evolved (game)', 2001], ['GTA: San Andreas (game)', 2004], ['World of Warcraft (game)', 2004],
  ['Wii Sports (game)', 2006], ['Portal (game)', 2007], ['Minecraft first public version', 2009], ['League of Legends (game)', 2009],
  ['Angry Birds (game)', 2009], ['Skyrim (game)', 2011], ['Candy Crush Saga (game)', 2012], ['GTA V (game)', 2013], ['Flappy Bird (game)', 2013],
  ['The Witcher 3 (game)', 2015], ['Overwatch (game)', 2016], ['Pokémon Go (game)', 2016], ['Zelda: Breath of the Wild (game)', 2017],
  ['Fortnite Battle Royale (game)', 2017], ['Red Dead Redemption 2 (game)', 2018], ['Among Us (game)', 2018],
  ['Animal Crossing: New Horizons (game)', 2020], ['Elden Ring (game)', 2022], ['Baldur’s Gate 3 (game)', 2023],
  ['“Thriller” by Michael Jackson (album)', 1982], ['“Africa” by Toto (song)', 1982], ['“Never Gonna Give You Up” by Rick Astley', 1987],
  ['“Like a Prayer” by Madonna', 1989], ['“Smells Like Teen Spirit” by Nirvana', 1991], ['“Wonderwall” by Oasis', 1995],
  ['“...Baby One More Time” by Britney Spears', 1998], ['“Crazy in Love” by Beyoncé', 2003], ['“Hey Ya!” by OutKast', 2003],
  ['“Dragostea Din Tei” by O-Zone', 2003], ['“Umbrella” by Rihanna', 2007], ['“Poker Face” by Lady Gaga', 2008],
  ['“Rolling in the Deep” by Adele', 2010], ['“Gangnam Style” by PSY', 2012], ['“Happy” by Pharrell Williams', 2013],
  ['“Uptown Funk” by Mark Ronson ft. Bruno Mars', 2014], ['“Despacito” by Luis Fonsi', 2017], ['“Shape of You” by Ed Sheeran', 2017],
  ['“Old Town Road” by Lil Nas X', 2019], ['“Blinding Lights” by The Weeknd', 2019], ['“Bad Guy” by Billie Eilish', 2019], ['“Flowers” by Miley Cyrus', 2023],
  ['First YouTube video, “Me at the zoo”', 2005], ['“Charlie Bit My Finger” goes viral', 2007], ['The Harlem Shake meme', 2013],
  ['The Ice Bucket Challenge', 2014], ['“The Dress”: blue and black or white and gold?', 2015], ['The fidget spinner craze', 2017],
  ['First iPhone released', 2007], ['Facebook launched', 2004], ['Twitter launched', 2006], ['Instagram launched', 2010],
  ['Bitcoin whitepaper published', 2008], ['ChatGPT released', 2022], ['Windows 95 released', 1995], ['Google founded', 1998],
  ['Wikipedia launched', 2001], ['Fall of the Berlin Wall', 1989], ['Chernobyl disaster', 1986], ['Euro coins and notes introduced', 2002],
  ['Tamagotchi released', 1996], ['Game Boy released', 1989], ['PlayStation 2 released', 2000], ['Nintendo Wii released', 2006],
  ['Netflix starts streaming', 2007], ['COVID-19 declared a pandemic', 2020], ['Nintendo Switch released', 2017],
];

export const yearQuestions = (): EstimateQ[] => YEARS.map(([q, answer]) => ({ q, answer }));

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
  ['Building the Burj Khalifa', 1_500_000_000], ['Salvator Mundi by Leonardo da Vinci (sold in 2017)', 450_300_000],
  ['A Louvre entry ticket (adult, 2024, in USD)', 24],
];

export const priceQuestions = (): EstimateQ[] =>
  PRICES.map(([q, answer, note]) => ({ q: `${q}?`, answer, unit: '$', note: note ?? 'typical US price' }));

// ------------------------------------------------------------------ FOLLOWERS / VIEWS (approximate, 2025)
const FOLLOWERS: [string, number, string][] = [
  ['MrBeast on YouTube', 4e8, 'subscribers'], ['T-Series on YouTube', 2.9e8, 'subscribers'], ['Cocomelon on YouTube', 1.9e8, 'subscribers'],
  ['PewDiePie on YouTube', 1.1e8, 'subscribers'], ['“Baby Shark Dance” on YouTube', 1.6e10, 'views'], ['“Despacito” on YouTube', 8.5e9, 'views'],
  ['“See You Again” on YouTube', 6.4e9, 'views'], ['“Gangnam Style” on YouTube', 5.3e9, 'views'],
  ['Cristiano Ronaldo on Instagram', 6.5e8, 'followers'], ['Lionel Messi on Instagram', 5e8, 'followers'], ['Selena Gomez on Instagram', 4.2e8, 'followers'],
  ['Taylor Swift on Instagram', 2.8e8, 'followers'], ['Khaby Lame on TikTok', 1.6e8, 'followers'], ['Charli D’Amelio on TikTok', 1.55e8, 'followers'],
  ['Elon Musk on X', 2.2e8, 'followers'], ['Barack Obama on X', 1.3e8, 'followers'],
  ['Counter-Strike 2, peak players at once on Steam', 1.8e6, 'players'], ['Dota 2, peak players at once on Steam', 1.29e6, 'players'],
  ['PUBG, peak players at once on Steam', 3.26e6, 'players'], ['Palworld, peak players at once on Steam', 2.1e6, 'players'],
  ['Black Myth: Wukong, peak players at once on Steam', 2.4e6, 'players'], ['Steam, record users online at once', 4e7, 'users'],
  ['Roblox, daily active users', 8.5e7, 'users'], ['The Weeknd on Spotify, record monthly listeners', 1.1e8, 'listeners'],
  ['YouTube, monthly logged-in users', 2.5e9, 'users'], ['Facebook, monthly active users', 3e9, 'users'],
  ['Biggest Twitch stream ever, viewers at once (La Velada 2024)', 3.8e6, 'viewers'],
];

export const followerQuestions = (): EstimateQ[] =>
  FOLLOWERS.map(([who, answer, unit]) => ({ q: `${who}: how many ${unit}?`, answer, unit, note: 'approximate, 2025' }));
