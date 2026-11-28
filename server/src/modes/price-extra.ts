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

/** Famous sales not in the generated list (price-sold.ts). Each says what the thing is and when it sold. */
const AUCTIONS: P[] = [
  ['Michael Jordan’s game-worn 1998 NBA Finals jersey (Chicago Bulls, “Last Dance” season), sold at auction', 10_100_000, 'Sotheby’s, 2022'],
  ['Diego Maradona’s “Hand of God” shirt from the 1986 World Cup (Argentina v England), sold at auction', 9_300_000, 'Sotheby’s, 2022'],
  ['Babe Ruth’s game-worn “called shot” jersey from the 1932 World Series, sold at auction', 24_100_000, 'Heritage Auctions, 2024'],
  ['A Shakespeare First Folio (the 1623 first collected edition of his plays, one complete copy), sold at auction', 9_980_000, 'Christie’s, 2020'],
  ['The “Lady Blunt” Stradivarius violin (made in 1721), sold at auction', 15_900_000, 'Tarisio online auction, 2011'],
  ['The Pink Star (a 59.6-carat pink diamond), sold at auction', 71_200_000, 'Sotheby’s Hong Kong, 2017'],
  ['The Oppenheimer Blue (a 14.6-carat blue diamond), sold at auction', 57_500_000, 'Christie’s Geneva, 2016'],
  ['“Apex”, a stegosaurus fossil skeleton, sold at auction', 44_600_000, 'Sotheby’s New York, 2024'],
  ['“Stan”, a Tyrannosaurus rex fossil skeleton, sold at auction', 31_800_000, 'Christie’s New York, 2020'],
  ['Kurt Cobain’s Martin D-18E acoustic guitar from MTV Unplugged (1993), sold at auction', 6_000_000, 'Julien’s Auctions, 2020'],
  ['Jack Dorsey’s first tweet (“just setting up my twttr”, 2006), sold as an NFT', 2_900_000, 'Valuables by Cent, 2021'],
];

const DEALS: P[] = [
  ['What Google paid for YouTube', 1_650_000_000, '2006'], ['What Facebook paid for Instagram', 1_000_000_000, '2012'], ['What Facebook paid for WhatsApp', 19_000_000_000, '2014, as announced'],
  ['What Elon Musk paid for Twitter', 44_000_000_000, '2022'], ['What Microsoft paid for LinkedIn', 26_200_000_000, '2016'], ['What Microsoft paid for Activision Blizzard', 68_700_000_000, '2023'],
  ['What Disney paid for Lucasfilm', 4_050_000_000, '2012'], ['What Disney paid for Marvel', 4_000_000_000, '2009'], ['What Disney paid for Pixar', 7_400_000_000, '2006'],
  ['What Microsoft paid for Mojang, the maker of Minecraft', 2_500_000_000, '2014'], ['What Microsoft paid for Skype', 8_500_000_000, '2011'], ['What Amazon paid for Whole Foods', 13_700_000_000, '2017'],
  ['What Microsoft paid for GitHub', 7_500_000_000, '2018'], ['What Apple paid for Beats', 3_000_000_000, '2014'], ['What Facebook paid for Oculus', 2_000_000_000, '2014'],
  ['What Google paid for Nest', 3_200_000_000, '2014'], ['What Yahoo paid for Tumblr', 1_100_000_000, '2013'], ['What Disney paid for 21st Century Fox', 71_300_000_000, '2019'],
  ['What the US paid Russia for Alaska', 7_200_000, '1867'], ['What the US paid France for the Louisiana Purchase', 15_000_000, '1803'],
];

const IPO: P[] = [
  ['One Apple share at its IPO', 22, '1980'], ['One Amazon share at its IPO', 18, '1997'], ['One Google share at its IPO', 85, '2004'],
  ['One Facebook share at its IPO', 38, '2012'], ['One Tesla share at its IPO', 17, '2010'], ['One Microsoft share at its IPO', 21, '1986'],
  ['One Nvidia share at its IPO', 12, '1999'],
];

/** Box office totals and budgets: the film's year is in the question; dollars of the time (not adjusted for inflation). */
const FILM_MONEY: P[] = [
  ['Avatar (2009 film): worldwide box office, all releases up to 2025', 2_920_000_000, 'dollars of the time, not adjusted for inflation'],
  ['Avengers: Endgame (2019 film): worldwide box office, all releases up to October 2026', 2_925_500_000, 'after its re-release passed Avatar · dollars of the time'],
  ['Avatar: The Way of Water (2022 film): worldwide box office', 2_320_000_000, 'approximate, dollars of the time'],
  ['Titanic (1997 film): worldwide box office, all releases up to 2025', 2_260_000_000, 'dollars of the time, not adjusted for inflation'],
  ['Star Wars: The Force Awakens (2015 film): worldwide box office', 2_070_000_000, 'approximate, dollars of the time'],
  ['Avengers: Infinity War (2018 film): worldwide box office', 2_050_000_000, 'approximate, dollars of the time'],
  ['Spider-Man: No Way Home (2021 film): worldwide box office', 1_920_000_000, 'approximate, dollars of the time'],
  ['Inside Out 2 (2024 film): worldwide box office', 1_700_000_000, 'approximate'],
  ['Jurassic World (2015 film): worldwide box office', 1_670_000_000, 'approximate, dollars of the time'],
  ['Top Gun: Maverick (2022 film): worldwide box office', 1_500_000_000, 'approximate'],
  ['Barbie (2023 film): worldwide box office', 1_450_000_000, 'approximate'],
  ['Frozen II (2019 film): worldwide box office', 1_450_000_000, 'approximate, dollars of the time'],
  ['The Super Mario Bros. Movie (2023): worldwide box office', 1_360_000_000, 'approximate'],
  ['Deadpool & Wolverine (2024 film): worldwide box office', 1_340_000_000, 'approximate'],
  ['Joker (2019 film): worldwide box office', 1_080_000_000, 'approximate, dollars of the time'],
  ['Oppenheimer (2023 film): worldwide box office', 975_000_000, 'approximate'],
  ['Titanic (1997 film): production budget', 200_000_000, 'reported, in 1997 dollars'],
  ['Avengers: Endgame (2019 film): production budget', 356_000_000, 'reported, in 2019 dollars'],
  ['Pirates of the Caribbean: On Stranger Tides (2011 film): production budget', 379_000_000, 'reported, in 2011 dollars'],
  ['Jurassic Park (1993 film): production budget', 63_000_000, 'reported, in 1993 dollars'],
  ['Star Wars (1977 film): production budget', 11_000_000, 'reported, in 1977 dollars'],
  ['Paranormal Activity (2007 film): production budget', 15_000, 'reported, in 2007 dollars'],
  ['The Blair Witch Project (1999 film): production budget of the original shoot', 60_000, 'reported, in 1999 dollars'],
  ['El Mariachi (1992 film): production budget', 7_000, 'reported, in 1992 dollars'],
  ['Mad Max: Fury Road (2015 film): production budget', 150_000_000, 'reported, in 2015 dollars'],
  ['Oppenheimer (2023 film): production budget', 100_000_000, 'reported'],
  ['Barbie (2023 film): production budget', 145_000_000, 'reported'],
  ['GTA V (2013 video game): development and marketing budget', 265_000_000, 'reported, in 2013 dollars'],
  ['GTA V (2013 video game): sales in its first 24 hours', 800_000_000, 'Take-Two, 2013'],
  ['GTA V (2013 video game): sales in its first 3 days', 1_000_000_000, 'Take-Two, 2013'],
];

const BUILT: P[] = [
  ['Building the Empire State Building in New York (finished 1931)', 41_000_000, 'in 1931 dollars'], ['Building the Golden Gate Bridge in San Francisco (finished 1937)', 35_000_000, 'in 1937 dollars'],
  ['The International Space Station, total cost for all partners (built 1998–2011)', 150_000_000_000, 'approximate, dollars of the time'], ['The James Webb Space Telescope, total cost up to its launch in 2021', 10_000_000_000, 'approximate, dollars of the time'],
  ['The Apollo Moon program, total cost (1960–1973)', 25_800_000_000, 'in dollars of the 1960s–70s, not adjusted for inflation'], ['Building Allegiant Stadium in Las Vegas (finished 2020)', 1_900_000_000, 'approximate, 2020 dollars'],
  ['A 30-second TV ad during the 2024 Super Bowl', 7_000_000, 'approximate'], ['The US federal minimum wage, per hour', 7.25, 'unchanged since 2009'],
  ['A US first-class Forever stamp', 0.73, 'from July 2024'], ['Amazon Prime, per year (US)', 139, '2024'], ['Costco Gold Star membership, per year', 65, '2024'],
  ['YouTube Premium, per month (US)', 13.99, '2024'], ['Apple Music, per month (US individual)', 10.99, '2024'], ['Netflix Standard with ads, per month (US)', 6.99, '2024'],
  ['Netflix Premium, per month (US)', 22.99, '2024'], ['The FIFA World Cup 2022 winner’s prize money', 42_000_000, 'Argentina'],
  ['Bugha’s prize for winning the Fortnite World Cup solo', 3_000_000, '2019'], ['Team Spirit’s prize for winning The International (Dota 2)', 18_200_000, '2021'],
['One bitcoin at its 2021 peak', 69_000, 'November 2021'], ['One bitcoin at its 2017 peak', 19_700, 'December 2017'],
];

export const EXTRA_PRICES: P[] = [...DEVICES, ...AUCTIONS, ...DEALS, ...IPO, ...FILM_MONEY, ...BUILT];
