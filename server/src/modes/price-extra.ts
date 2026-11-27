/**
 * More "The right price" questions, in US dollars. Only documented prices: launch / list prices (with
 * the year), auction results, IPO prices, acquisition prices, reported budgets and box-office totals.
 * Format: [what, price, note shown with the answer].
 */
type P = [string, number, string];
const launch = (rows: [string, number, number][]): P[] => rows.map(([w, p, y]) => [`${w} at launch`, p, `US launch price, ${y}`]);

const DEVICES = launch([
  ['The original iPhone (4 GB)', 499, 2007], ['iPhone 6', 649, 2014], ['iPhone 6s', 649, 2015], ['iPhone 7', 649, 2016], ['iPhone 8', 699, 2017],
  ['iPhone 8 Plus', 799, 2017], ['iPhone X', 999, 2017], ['iPhone XR', 749, 2018], ['iPhone XS', 999, 2018], ['iPhone XS Max', 1_099, 2018],
  ['iPhone 11', 699, 2019], ['iPhone 11 Pro', 999, 2019], ['iPhone SE (2nd generation)', 399, 2020], ['iPhone 12', 799, 2020], ['iPhone 12 mini', 699, 2020],
  ['iPhone 13', 799, 2021], ['iPhone 13 mini', 699, 2021], ['iPhone SE (3rd generation)', 429, 2022], ['iPhone 14', 799, 2022], ['iPhone 14 Plus', 899, 2022],
  ['iPhone 14 Pro', 999, 2022], ['iPhone 15 Pro Max', 1_199, 2023], ['iPhone 16', 799, 2024], ['iPhone 16 Pro', 999, 2024], ['iPhone 16 Pro Max', 1_199, 2024],
  ['The first iPad (16 GB Wi-Fi)', 499, 2010], ['The first iPad mini', 329, 2012], ['The first iPad Pro (12.9-inch)', 799, 2015], ['iPad (10th generation)', 449, 2022],
  ['The first MacBook Air', 1_799, 2008], ['MacBook Air M1', 999, 2020], ['MacBook Air M2', 1_199, 2022], ['MacBook Pro 14-inch (M1 Pro)', 1_999, 2021],
  ['MacBook Pro 16-inch (M1 Pro)', 2_499, 2021], ['Mac Pro (tower)', 5_999, 2019], ['Mac mini M1', 699, 2020], ['Mac mini M2', 599, 2023],
  ['iMac G3', 1_299, 1998], ['The original Apple Macintosh', 2_495, 1984], ['The Apple II', 1_298, 1977], ['The Apple I', 666.66, 1976],
  ['AirPods (1st generation)', 159, 2016], ['AirPods Max', 549, 2020], ['The first Apple Watch (38 mm Sport)', 349, 2015], ['Apple Watch Edition in gold', 10_000, 2015],
  ['HomePod', 349, 2018], ['The first iPod', 399, 2001], ['The first iPod nano (2 GB)', 199, 2005], ['The first iPod shuffle (512 MB)', 99, 2005],
  ['NES', 179.99, 1985], ['Super Nintendo', 199, 1991], ['Nintendo 64', 199.99, 1996], ['GameCube', 199.99, 2001], ['Wii', 249.99, 2006],
  ['Wii U (basic)', 299.99, 2012], ['Nintendo Switch', 299.99, 2017], ['Nintendo Switch Lite', 199.99, 2019], ['Nintendo Switch 2', 449.99, 2025],
  ['Game Boy Advance', 99.99, 2001], ['Nintendo DS', 149.99, 2004], ['Nintendo 3DS', 249.99, 2011], ['Virtual Boy', 179.95, 1995],
  ['The original PlayStation', 299, 1995], ['PlayStation 2', 299, 2000], ['PlayStation 3 (60 GB)', 599, 2006], ['PlayStation 4', 399, 2013],
  ['PlayStation 4 Pro', 399, 2016], ['PlayStation 5 Digital Edition', 399, 2020], ['PSP', 249, 2005], ['PS Vita (Wi-Fi)', 249, 2012],
  ['The original Xbox', 299, 2001], ['Xbox 360 (Premium)', 399, 2005], ['Xbox One', 499, 2013], ['Xbox Series S', 299, 2020],
  ['Sega Genesis', 189.99, 1989], ['Sega Dreamcast', 199, 1999], ['Steam Deck 512 GB', 649, 2022],
  ['Meta Quest 2 (64 GB)', 299, 2020], ['Oculus Rift', 599, 2016], ['Valve Index full kit', 999, 2019], ['IBM PC (5150)', 1_565, 1981],
  ['Commodore 64', 595, 1982], ['Motorola DynaTAC 8000X mobile phone', 3_995, 1983], ['The first Amazon Kindle', 399, 2007], ['Segway PT', 4_950, 2002],
  ['Google Glass Explorer Edition', 1_500, 2013], ['Nvidia GeForce RTX 3060', 329, 2021], ['Nvidia GeForce RTX 3080', 699, 2020],
  ['Nvidia GeForce RTX 3090', 1_499, 2020], ['Nvidia GeForce RTX 4080', 1_199, 2022], ['Nvidia GeForce RTX 4090', 1_599, 2022],
  ['Nvidia GeForce RTX 5090', 1_999, 2025], ['Tesla Cybertruck (AWD)', 79_990, 2023], ['Tesla Cybertruck Cyberbeast', 99_990, 2023],
  ['Ferrari LaFerrari', 1_400_000, 2013], ['The Ford Model T', 850, 1908],
  ['A Mario Kart World Nintendo Switch 2 game', 79.99, 2025], ['A standard new PS5 game', 69.99, 2020], ['Furby', 35, 1998], ['Tickle Me Elmo', 28.99, 1996],
]);

const AUCTIONS: P[] = [
  ['Andy Warhol’s Shot Sage Blue Marilyn (auction)', 195_000_000, 'Christie’s, 2022'],
  ['Picasso’s Les Femmes d’Alger (Version O) (auction)', 179_400_000, 'Christie’s, 2015'],
  ['Modigliani’s Nu couché (auction)', 170_400_000, 'Christie’s, 2015'],
  ['Francis Bacon’s Three Studies of Lucian Freud (auction)', 142_400_000, 'Christie’s, 2013'],
  ['Munch’s The Scream, pastel version (auction)', 119_900_000, 'Sotheby’s, 2012'],
  ['Basquiat’s Untitled (1982 skull) (auction)', 110_500_000, 'Sotheby’s, 2017'],
  ['Jeff Koons’ Rabbit (auction)', 91_100_000, 'Christie’s, 2019'],
  ['Beeple’s NFT Everydays: The First 5000 Days (auction)', 69_300_000, 'Christie’s, 2021'],
  ['Banksy’s Love is in the Bin (auction)', 25_400_000, 'Sotheby’s, 2021'],
  ['A 1952 Topps Mickey Mantle baseball card (auction)', 12_600_000, '2022'],
  ['A T206 Honus Wagner baseball card (sale)', 7_250_000, '2022'],
  ['Action Comics #1, the first Superman comic (auction)', 6_000_000, '2024'],
  ['Michael Jordan’s 1998 NBA Finals jersey (auction)', 10_100_000, 'Sotheby’s, 2022'],
  ['Maradona’s “Hand of God” shirt (auction)', 9_300_000, 'Sotheby’s, 2022'],
  ['Babe Ruth’s “called shot” jersey (auction)', 24_100_000, '2024'],
  ['A Shakespeare First Folio (auction)', 9_980_000, 'Christie’s, 2020'],
  ['Leonardo da Vinci’s Codex Leicester (auction)', 30_800_000, 'Christie’s, 1994, bought by Bill Gates'],
  ['The “Lady Blunt” Stradivarius violin (auction)', 15_900_000, '2011'],
  ['The Pink Star diamond (auction)', 71_200_000, 'Sotheby’s, 2017'],
  ['The Oppenheimer Blue diamond (auction)', 57_500_000, 'Christie’s, 2016'],
  ['The stegosaurus skeleton “Apex” (auction)', 44_600_000, 'Sotheby’s, 2024'],
  ['The T. rex skeleton “Stan” (auction)', 31_800_000, 'Christie’s, 2020'],
  ['A 1962 Ferrari 250 GTO (auction)', 48_400_000, 'RM Sotheby’s, 2018'],
  ['The 1955 Mercedes-Benz 300 SLR Uhlenhaut Coupé (auction)', 143_000_000, '2022'],
  ['Kurt Cobain’s MTV Unplugged guitar (auction)', 6_000_000, '2020'],
  ['Jack Dorsey’s first tweet as an NFT (sale)', 2_900_000, '2021'],
];

const DEALS: P[] = [
  ['Google buying YouTube', 1_650_000_000, '2006'], ['Facebook buying Instagram', 1_000_000_000, '2012'], ['Facebook buying WhatsApp', 19_000_000_000, '2014, as announced'],
  ['Elon Musk buying Twitter', 44_000_000_000, '2022'], ['Microsoft buying LinkedIn', 26_200_000_000, '2016'], ['Microsoft buying Activision Blizzard', 68_700_000_000, '2023'],
  ['Disney buying Lucasfilm', 4_050_000_000, '2012'], ['Disney buying Marvel', 4_000_000_000, '2009'], ['Disney buying Pixar', 7_400_000_000, '2006'],
  ['Microsoft buying Mojang (Minecraft)', 2_500_000_000, '2014'], ['Microsoft buying Skype', 8_500_000_000, '2011'], ['Amazon buying Whole Foods', 13_700_000_000, '2017'],
  ['Microsoft buying GitHub', 7_500_000_000, '2018'], ['Apple buying Beats', 3_000_000_000, '2014'], ['Facebook buying Oculus', 2_000_000_000, '2014'],
  ['Google buying Nest', 3_200_000_000, '2014'], ['Yahoo buying Tumblr', 1_100_000_000, '2013'], ['Disney buying 21st Century Fox', 71_300_000_000, '2019'],
  ['The US buying Alaska from Russia', 7_200_000, '1867'], ['The Louisiana Purchase from France', 15_000_000, '1803'],
];

const IPO: P[] = [
  ['One Apple share at its IPO', 22, '1980'], ['One Amazon share at its IPO', 18, '1997'], ['One Google share at its IPO', 85, '2004'],
  ['One Facebook share at its IPO', 38, '2012'], ['One Tesla share at its IPO', 17, '2010'], ['One Microsoft share at its IPO', 21, '1986'],
  ['One Nvidia share at its IPO', 12, '1999'],
];

const FILM_MONEY: P[] = [
  ['Avatar’s worldwide box office', 2_920_000_000, 'all releases'], ['Avengers: Endgame’s worldwide box office', 2_800_000_000, 'approximate'],
  ['Avatar: The Way of Water’s worldwide box office', 2_320_000_000, 'approximate'], ['Titanic’s worldwide box office', 2_260_000_000, 'all releases'],
  ['Star Wars: The Force Awakens’ worldwide box office', 2_070_000_000, 'approximate'], ['Avengers: Infinity War’s worldwide box office', 2_050_000_000, 'approximate'],
  ['Spider-Man: No Way Home’s worldwide box office', 1_920_000_000, 'approximate'], ['Inside Out 2’s worldwide box office', 1_700_000_000, 'approximate'],
  ['Jurassic World’s worldwide box office', 1_670_000_000, 'approximate'], ['Top Gun: Maverick’s worldwide box office', 1_500_000_000, 'approximate'],
  ['Barbie’s worldwide box office', 1_450_000_000, 'approximate'], ['Frozen II’s worldwide box office', 1_450_000_000, 'approximate'],
  ['The Super Mario Bros. Movie’s worldwide box office', 1_360_000_000, 'approximate'], ['Deadpool & Wolverine’s worldwide box office', 1_340_000_000, 'approximate'],
  ['Joker’s worldwide box office', 1_080_000_000, 'approximate'], ['Oppenheimer’s worldwide box office', 975_000_000, 'approximate'],
  ['Titanic’s production budget', 200_000_000, 'reported'], ['Avengers: Endgame’s production budget', 356_000_000, 'reported'],
  ['Pirates of the Caribbean: On Stranger Tides’ production budget', 379_000_000, 'reported'], ['Jurassic Park’s production budget', 63_000_000, 'reported'],
  ['Star Wars’ (1977) production budget', 11_000_000, 'reported'], ['Paranormal Activity’s production budget', 15_000, 'reported'],
  ['The Blair Witch Project’s production budget', 60_000, 'reported, original shoot'], ['El Mariachi’s production budget', 7_000, 'reported'],
  ['Mad Max: Fury Road’s production budget', 150_000_000, 'reported'], ['Oppenheimer’s production budget', 100_000_000, 'reported'],
  ['Barbie’s production budget', 145_000_000, 'reported'], ['GTA V’s development and marketing budget', 265_000_000, 'reported'],
  ['GTA V’s sales in its first 24 hours', 800_000_000, 'Take-Two, 2013'], ['GTA V’s sales in its first 3 days', 1_000_000_000, 'Take-Two, 2013'],
];

const BUILT: P[] = [
  ['Building the Empire State Building', 41_000_000, '1931 dollars'], ['Building the Golden Gate Bridge', 35_000_000, '1937 dollars'],
  ['The International Space Station, all partners', 150_000_000_000, 'approximate'], ['The James Webb Space Telescope', 10_000_000_000, 'approximate'],
  ['The Apollo program', 25_800_000_000, 'in 1960s–70s dollars'], ['Building Allegiant Stadium in Las Vegas', 1_900_000_000, 'approximate'],
  ['A 30-second TV ad during the 2024 Super Bowl', 7_000_000, 'approximate'], ['The US federal minimum wage, per hour', 7.25, 'unchanged since 2009'],
  ['A US first-class Forever stamp', 0.73, 'from July 2024'], ['Amazon Prime, per year (US)', 139, '2024'], ['Costco Gold Star membership, per year', 65, '2024'],
  ['YouTube Premium, per month (US)', 13.99, '2024'], ['Apple Music, per month (US individual)', 10.99, '2024'], ['Netflix Standard with ads, per month (US)', 6.99, '2024'],
  ['Netflix Premium, per month (US)', 22.99, '2024'], ['The FIFA World Cup 2022 winner’s prize money', 42_000_000, 'Argentina'],
  ['Bugha’s prize for winning the Fortnite World Cup solo', 3_000_000, '2019'], ['Team Spirit’s prize for winning The International (Dota 2)', 18_200_000, '2021'],
['One bitcoin at its 2021 peak', 69_000, 'November 2021'], ['One bitcoin at its 2017 peak', 19_700, 'December 2017'],
];

export const EXTRA_PRICES: P[] = [...DEVICES, ...AUCTIONS, ...DEALS, ...IPO, ...FILM_MONEY, ...BUILT];
