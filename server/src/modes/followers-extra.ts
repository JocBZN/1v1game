/**
 * "Followers" questions. Every question says WHEN its number is from, inside the question itself,
 * because these numbers move. Live counts (subscribers, followers, views, streams) are only kept where
 * a 2026 figure was confirmed; lifetime sales and all-time peaks carry the date they were reported.
 * Format: [who, number, unit, when (shown in the question), note shown with the answer]
 */
export type FollowerRow = [string, number, string, string, string];
const rows = (unit: string, when: string, note: string, list: [string, number][]): FollowerRow[] => list.map(([w, n]) => [w, n, unit, when, note]);

// ------------------------------------------------------------------ live counts confirmed in 2026
const LIVE_2026: FollowerRow[] = [
  ['MrBeast on YouTube', 528_000_000, 'subscribers', 'November 2026', 'first channel past 500 million (June 2026)'],
  ['T-Series on YouTube', 317_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['Cocomelon – Nursery Rhymes on YouTube', 203_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['Like Nastya on YouTube', 134_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['Zee Music Company on YouTube', 123_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['WWE on YouTube', 114_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['PewDiePie on YouTube', 109_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['BLACKPINK on YouTube', 102_000_000, 'subscribers', 'November 2026', 'vidIQ'],
  ['Selena Gomez on Instagram', 402_000_000, 'followers', 'November 2026', 'approximate'],
  ['Kylie Jenner on Instagram', 381_000_000, 'followers', 'November 2026', 'approximate'],
  ['SET India on YouTube', 190_000_000, 'subscribers', 'October 2026', 'approximate'],
  ['Vlad and Niki on YouTube', 151_000_000, 'subscribers', 'October 2026', 'approximate'],
  ['Stokes Twins on YouTube', 148_000_000, 'subscribers', 'October 2026', 'approximate'],
  ['Instagram’s own account on Instagram', 686_000_000, 'followers', 'November 2026', 'approximate'],
  ['Cristiano Ronaldo on Instagram', 681_000_000, 'followers', 'November 2026', 'the most-followed person on Instagram'],
  ['Lionel Messi on Instagram', 517_000_000, 'followers', 'June 2026', 'approximate'],
  ['Ariana Grande on Instagram', 353_000_000, 'followers', '2026', 'approximate'],
  ['Kendall Jenner on Instagram', 294_000_000, 'followers', '2026', 'approximate'],
  ['Khaby Lame on TikTok', 161_000_000, 'followers', 'April 2026', 'the most-followed TikTok account'],
  ['TikTok’s own account on TikTok', 96_700_000, 'followers', '2026', 'approximate'],
  ['Elon Musk on X', 230_000_000, 'followers', '2026', 'sources range from about 226 to 240 million'],
  ['Barack Obama on X', 120_000_000, 'followers', '2026', 'approximate'],
  ['Cristiano Ronaldo on X', 110_000_000, 'followers', '2026', 'approximate'],
  ['Donald Trump on X', 111_000_000, 'followers', '2026', 'approximate'],
  ['“Baby Shark Dance” (Pinkfong) on YouTube', 16_600_000_000, 'views', 'February 2026', 'Guinness World Records: the most-viewed YouTube video'],
  ['the “Despacito” music video on YouTube', 9_070_000_000, 'views', 'July 2026', 'the most-viewed music video'],
  ['the “See You Again” music video on YouTube', 7_030_000_000, 'views', 'July 2026', 'approximate'],
  ['The Weeknd’s song “Blinding Lights” on Spotify', 5_350_000_000, 'streams', 'April 2026', 'Spotify’s most-streamed song of all time'],
  ['Ed Sheeran’s song “Shape of You” on Spotify', 4_850_000_000, 'streams', 'April 2026', 'approximate'],
  ['Steam, the record for users online at the same time', 43_500_000, 'users', 'October 2026', 'record set on 11 October 2026'],
  ['Facebook, monthly active users', 3_100_000_000, 'users', '2026', 'approximate'],
  ['YouTube, monthly active users', 2_700_000_000, 'users', '2026', 'estimate'],
  ['Instagram, monthly active users', 3_000_000_000, 'users', 'September 2025', 'as announced by Meta'],
  ['Snapchat, monthly active users', 956_000_000, 'users', 'early 2026', 'first quarter of 2026'],
];

// ------------------------------------------------------------------ all-time Steam peaks (records, not live counts)
const STEAM_PEAKS = rows('players online at the same time', 'all-time Steam peak, as of 2025', 'SteamDB', [
  ['PUBG: Battlegrounds', 3_257_000], ['Black Myth: Wukong', 2_415_000], ['Palworld', 2_102_000], ['Counter-Strike 2', 1_862_000], ['Dota 2', 1_291_000],
  ['Lost Ark', 1_325_000], ['Monster Hunter Wilds', 1_385_000], ['Cyberpunk 2077', 1_054_000], ['Elden Ring', 953_000], ['Apex Legends', 624_000],
  ['Hogwarts Legacy', 879_000], ['New World', 914_000], ['Baldur’s Gate 3', 875_000], ['Grand Theft Auto V', 365_000], ['Terraria', 490_000],
  ['Valheim', 502_000], ['Helldivers 2', 459_000], ['Path of Exile 2', 579_000], ['Marvel Rivals', 644_000], ['Among Us', 447_000], ['Fallout 4', 473_000],
  ['The Elder Scrolls V: Skyrim', 288_000], ['Destiny 2', 317_000], ['Team Fortress 2', 254_000], ['Sons of the Forest', 414_000], ['Starfield', 331_000],
  ['Lethal Company', 241_000], ['Stardew Valley', 237_000], ['Rust', 262_000], ['No Man’s Sky', 213_000], ['Monster Hunter: World', 335_000],
]);

// ------------------------------------------------------------------ lifetime sales
const GAME_SALES: FollowerRow[] = [
  ['Minecraft (video game)', 350_000_000, 'copies sold', 'April 2025', 'Guinness World Records'],
  ['Grand Theft Auto V (video game)', 225_000_000, 'copies sold', 'February 2026', 'Take-Two'],
  ['Mario Kart 8 Deluxe (Switch video game)', 71_500_000, 'copies sold', 'June 2026', 'Nintendo, Switch version only'],
  ...rows('copies sold', 'lifetime total, as of 2025', 'reported, approximate', [
    ['Wii Sports (video game)', 82_900_000], ['Super Mario Bros. (1985 video game)', 58_000_000], ['Pokémon Red, Green and Blue (video games)', 31_000_000],
    ['Mario Kart Wii (video game)', 37_000_000], ['New Super Mario Bros. (DS video game)', 30_800_000], ['New Super Mario Bros. Wii (video game)', 30_300_000],
    ['Tetris (Game Boy video game)', 35_000_000], ['Grand Theft Auto: San Andreas (video game)', 27_500_000], ['Super Mario World (video game)', 20_600_000],
    ['Pokémon Gold and Silver (video games)', 23_000_000], ['Brain Age / Brain Training (DS video game)', 19_000_000], ['Mario Kart DS (video game)', 23_600_000],
    ['Super Mario Bros. 3 (video game)', 17_300_000], ['Pokémon Diamond and Pearl (video games)', 17_670_000], ['Nintendogs (video game)', 24_000_000],
    ['Wii Fit (video game)', 22_600_000], ['Super Mario 64 (video game)', 11_900_000], ['Diablo III (video game)', 30_000_000], ['StarCraft (video game)', 11_000_000],
  ]),
  ...rows('copies sold', 'reported in 2024–2025', 'reported, approximate', [
    ['The Witcher 3: Wild Hunt (video game)', 50_000_000], ['The Elder Scrolls V: Skyrim (video game)', 60_000_000], ['Red Dead Redemption 2 (video game)', 67_000_000],
    ['Animal Crossing: New Horizons (video game)', 47_000_000], ['Stardew Valley (video game)', 41_000_000], ['Super Smash Bros. Ultimate (video game)', 35_000_000],
    ['The Legend of Zelda: Breath of the Wild (video game)', 33_000_000], ['Elden Ring (video game)', 30_000_000], ['Cyberpunk 2077 (video game)', 30_000_000],
    ['Hogwarts Legacy (video game)', 30_000_000], ['Super Mario Odyssey (video game)', 29_000_000], ['God of War (2018 video game)', 23_000_000],
    ['Pokémon Sword and Shield (video games)', 26_000_000], ['Pokémon Scarlet and Violet (video games)', 26_000_000],
    ['The Legend of Zelda: Tears of the Kingdom (video game)', 21_000_000], ['Luigi’s Mansion 3 (video game)', 14_000_000],
    ['Super Mario Bros. Wonder (video game)', 15_000_000], ['PUBG: Battlegrounds (PC and console)', 75_000_000],
  ]),
];

const CONSOLES: FollowerRow[] = [
  ['Nintendo Switch (console)', 155_920_000, 'consoles sold', 'March 2026', 'Nintendo'],
  ['Nintendo Switch 2 (console)', 23_680_000, 'consoles sold', 'June 2026', 'Nintendo, about a year after launch'],
  ...rows('consoles sold', 'final lifetime total', 'approximate', [
    ['PlayStation 2 (console)', 160_000_000], ['Nintendo DS (handheld console)', 154_000_000], ['Game Boy and Game Boy Color (handheld consoles)', 118_700_000],
    ['PlayStation 4 (console)', 117_000_000], ['the original PlayStation (console)', 102_000_000], ['Wii (console)', 101_600_000], ['PlayStation 3 (console)', 87_000_000],
    ['Xbox 360 (console)', 84_000_000], ['Game Boy Advance (handheld console)', 81_500_000], ['PSP (handheld console)', 80_000_000], ['Nintendo 3DS (handheld console)', 75_900_000],
    ['NES (console)', 61_900_000], ['Super Nintendo (console)', 49_100_000], ['Nintendo 64 (console)', 32_900_000], ['GameCube (console)', 21_700_000],
    ['Wii U (console)', 13_560_000], ['Sega Dreamcast (console)', 9_130_000], ['Sega Genesis / Mega Drive (console)', 30_750_000], ['Atari 2600 (console)', 30_000_000],
    ['Sega Game Gear (handheld console)', 10_600_000], ['Sega Saturn (console)', 9_260_000], ['the original Xbox (console)', 24_000_000], ['Virtual Boy (console)', 770_000],
    ['Nintendo Game & Watch handhelds', 43_400_000],
  ]),
];

const ALBUM_SALES = rows('copies sold', 'claimed lifetime sales, as of 2025', 'claimed sales, approximate', [
  ['Michael Jackson’s album Thriller', 70_000_000], ['AC/DC’s album Back in Black', 50_000_000], ['Pink Floyd’s album The Dark Side of the Moon', 45_000_000],
  ['The Bodyguard soundtrack album', 45_000_000], ['Meat Loaf’s album Bat Out of Hell', 43_000_000], ['the Eagles’ album Their Greatest Hits (1971–1975)', 44_000_000],
  ['the Saturday Night Fever soundtrack album', 40_000_000], ['Fleetwood Mac’s album Rumours', 40_000_000], ['Shania Twain’s album Come On Over', 40_000_000],
  ['Adele’s album 21', 31_000_000], ['Alanis Morissette’s album Jagged Little Pill', 33_000_000], ['Celine Dion’s album Falling into You', 32_000_000],
  ['Santana’s album Supernatural', 30_000_000], ['the Dirty Dancing soundtrack album', 32_000_000], ['the Titanic soundtrack album', 30_000_000],
  ['Michael Jackson’s album Bad', 35_000_000], ['Michael Jackson’s album Dangerous', 32_000_000], ['the Eagles’ album Hotel California', 32_000_000],
  ['the Beatles’ album 1', 31_000_000], ['Led Zeppelin’s album Led Zeppelin IV', 37_000_000], ['Nirvana’s album Nevermind', 30_000_000],
]);

const BOOK_SALES = rows('copies sold', 'reported, as of 2025', 'reported, approximate', [
  ['the seven Harry Potter novels together', 600_000_000], ['the novel The Hobbit', 100_000_000], ['the novel Harry Potter and the Philosopher’s Stone', 120_000_000],
  ['the Diary of a Wimpy Kid book series', 275_000_000], ['the Hunger Games novel trilogy', 100_000_000], ['the novel The Lord of the Rings', 150_000_000],
  ['the novel The Da Vinci Code', 80_000_000], ['the Goosebumps book series', 400_000_000], ['the comic series The Adventures of Tintin', 250_000_000],
  ['the One Piece manga series', 500_000_000], ['the Dragon Ball manga series', 260_000_000], ['the Naruto manga series', 250_000_000],
]);

// ------------------------------------------------------------------ platform numbers as reported at the time
const REPORTED: FollowerRow[] = [
  ['Netflix, paying memberships', 301_600_000, 'members', 'end of 2024, the last figure Netflix published', 'Netflix'],
  ['Spotify, monthly active users', 675_000_000, 'users', 'end of 2024', 'Spotify'],
  ['Spotify, paying subscribers', 263_000_000, 'subscribers', 'end of 2024', 'Spotify'],
  ['ChatGPT, weekly active users', 800_000_000, 'users', 'October 2025', 'OpenAI'],
  ['WeChat, monthly active users', 1_380_000_000, 'users', '2024', 'Tencent'],
  ['Pinterest, monthly active users', 553_000_000, 'users', 'end of 2024', 'Pinterest'],
  ['LinkedIn, members', 1_000_000_000, 'members', '2023', 'LinkedIn'],
  ['Xbox Game Pass, subscribers', 34_000_000, 'subscribers', 'February 2024', 'Microsoft'],
  ['Amazon Prime, members worldwide', 200_000_000, 'members', '2021', 'Amazon'],
  ['Zoom, daily meeting participants at its peak', 300_000_000, 'participants', 'April 2020', 'Zoom'],
  ['Fortnite, registered players', 350_000_000, 'players', 'May 2020', 'Epic Games'],
  ['Pokémon Go, downloads', 1_000_000_000, 'downloads', 'reached in 2019', 'Niantic'],
  ['World of Warcraft, subscribers at its all-time peak', 12_000_000, 'subscribers', '2010', 'Blizzard'],
  ['Twitch, viewers at the same time for one stream (La Velada del Año 4)', 3_800_000, 'viewers', 'July 2024', 'record at the time'],
  ['the first YouTube video, “Me at the zoo”', 350_000_000, 'views', '2025', 'approximate'],
];

export const FOLLOWER_QUESTIONS: FollowerRow[] = [
  ...LIVE_2026, ...STEAM_PEAKS, ...GAME_SALES, ...CONSOLES, ...ALBUM_SALES, ...BOOK_SALES, ...REPORTED,
];
