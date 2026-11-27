/**
 * More "Followers" questions. Social numbers move every day, so these are rounded and dated
 * (approximate, 2025 unless the note says otherwise). Steam peaks are SteamDB all-time peaks;
 * sales are the publisher's or platform holder's latest reported totals.
 * Format: [who, number, unit, note?]
 */
type F = [string, number, string, string?];
const rows = (unit: string, note: string | undefined, list: [string, number][]): F[] => list.map(([w, n]) => [w, n, unit, note]);

const STEAM_PEAKS = rows('players at once', 'all-time peak on Steam (SteamDB)', [
  ['Lost Ark', 1_325_000], ['Monster Hunter Wilds', 1_385_000], ['Cyberpunk 2077', 1_054_000], ['Elden Ring', 953_000], ['Apex Legends', 624_000],
  ['Hogwarts Legacy', 879_000], ['New World', 914_000], ['Baldur’s Gate 3', 875_000], ['Monster Hunter: World', 335_000], ['Grand Theft Auto V', 365_000],
  ['Terraria', 490_000], ['Valheim', 502_000], ['Fall Guys', 172_000], ['Helldivers 2', 459_000], ['Path of Exile 2', 579_000], ['Marvel Rivals', 644_000],
  ['Lethal Company', 241_000], ['Among Us', 447_000], ['Fallout 4', 473_000], ['The Elder Scrolls V: Skyrim', 288_000], ['Destiny 2', 317_000],
  ['Team Fortress 2', 254_000], ['Stardew Valley', 237_000], ['Sons of the Forest', 414_000], ['Starfield', 331_000], ['Tom Clancy’s Rainbow Six Siege', 202_000],
  ['Halo Infinite', 273_000], ['The Finals', 243_000], ['Dragon’s Dogma 2', 229_000], ['Deadlock', 171_000], ['Sid Meier’s Civilization VI', 163_000],
  ['Sekiro: Shadows Die Twice', 125_000], ['Dark Souls III', 130_000],
]);

const GAME_SALES = rows('copies sold', 'reported total, approximate', [
  ['Minecraft', 300_000_000], ['Grand Theft Auto V', 200_000_000], ['Wii Sports', 82_900_000], ['PUBG: Battlegrounds (PC and console)', 75_000_000],
  ['Mario Kart 8 / Mario Kart 8 Deluxe', 67_000_000], ['Red Dead Redemption 2', 67_000_000], ['Super Mario Bros. (1985)', 58_000_000],
  ['The Witcher 3: Wild Hunt', 50_000_000], ['The Elder Scrolls V: Skyrim', 60_000_000], ['Animal Crossing: New Horizons', 47_000_000],
  ['Stardew Valley', 41_000_000], ['Super Smash Bros. Ultimate', 35_000_000], ['Pokémon Red, Green and Blue', 31_000_000],
  ['The Legend of Zelda: Breath of the Wild', 33_000_000], ['Elden Ring', 30_000_000], ['Cyberpunk 2077', 30_000_000], ['Hogwarts Legacy', 30_000_000],
  ['Super Mario Odyssey', 29_000_000], ['God of War (2018)', 23_000_000], ['Pokémon Sword and Shield', 26_000_000], ['Pokémon Scarlet and Violet', 26_000_000],
  ['Mario Kart Wii', 37_000_000], ['New Super Mario Bros. (DS)', 30_800_000], ['Nintendogs', 24_000_000], ['Wii Fit', 22_600_000],
  ['Super Mario 64', 11_900_000], ['Grand Theft Auto: San Andreas', 27_500_000], ['The Sims (all games in the series)', 200_000_000],
]);

const CONSOLES = rows('consoles sold', 'lifetime sales, approximate', [
  ['PlayStation 2', 160_000_000], ['Nintendo DS', 154_000_000], ['Nintendo Switch', 150_000_000], ['Game Boy and Game Boy Color', 118_700_000],
  ['PlayStation 4', 117_000_000], ['The original PlayStation', 102_000_000], ['Wii', 101_600_000], ['PlayStation 3', 87_000_000], ['Xbox 360', 84_000_000],
  ['Game Boy Advance', 81_500_000], ['PSP', 80_000_000], ['Nintendo 3DS', 75_900_000], ['NES', 61_900_000], ['Super Nintendo', 49_100_000],
  ['Nintendo 64', 32_900_000], ['GameCube', 21_700_000], ['Wii U', 13_560_000], ['Sega Dreamcast', 9_130_000], ['Sega Genesis / Mega Drive', 30_750_000],
]);

const YOUTUBE = rows('subscribers', 'approximate, 2025', [
  ['SET India on YouTube', 180_000_000], ['Vlad and Niki on YouTube', 130_000_000], ['Kids Diana Show on YouTube', 130_000_000], ['Like Nastya on YouTube', 125_000_000],
  ['WWE on YouTube', 105_000_000], ['BLACKPINK on YouTube', 97_000_000], ['5-Minute Crafts on YouTube', 81_000_000], ['BANGTANTV (BTS) on YouTube', 80_000_000],
  ['Justin Bieber on YouTube', 76_000_000], ['Pinkfong Baby Shark on YouTube', 77_000_000], ['Canal KondZilla on YouTube', 67_000_000], ['Dude Perfect on YouTube', 60_000_000],
  ['Marshmello on YouTube', 58_000_000], ['Ed Sheeran on YouTube', 57_000_000], ['Taylor Swift on YouTube', 61_000_000], ['Eminem on YouTube', 59_000_000],
  ['Ariana Grande on YouTube', 56_000_000], ['Markiplier on YouTube', 37_000_000], ['Mark Rober on YouTube', 66_000_000], ['Ninja on YouTube', 24_000_000],
  ['Jacksepticeye on YouTube', 31_000_000], ['KSI on YouTube', 24_000_000], ['Logan Paul on YouTube', 23_000_000], ['Jake Paul on YouTube', 20_000_000],
  ['Mrwhosetheboss on YouTube', 20_000_000], ['Marques Brownlee (MKBHD) on YouTube', 20_000_000], ['Linus Tech Tips on YouTube', 16_000_000],
  ['Veritasium on YouTube', 18_000_000], ['Kurzgesagt on YouTube', 24_000_000], ['TED on YouTube', 26_000_000], ['NASA on YouTube', 12_000_000],
]);

const INSTAGRAM = rows('followers', 'approximate, 2025', [
  ['Kylie Jenner on Instagram', 395_000_000], ['Dwayne Johnson on Instagram', 395_000_000], ['Ariana Grande on Instagram', 375_000_000],
  ['Kim Kardashian on Instagram', 355_000_000], ['Beyoncé on Instagram', 310_000_000], ['Khloé Kardashian on Instagram', 300_000_000],
  ['Justin Bieber on Instagram', 290_000_000], ['Kendall Jenner on Instagram', 290_000_000], ['Nike on Instagram', 300_000_000],
  ['Instagram’s own account', 690_000_000], ['Neymar on Instagram', 230_000_000], ['Jennifer Lopez on Instagram', 250_000_000],
  ['Nicki Minaj on Instagram', 225_000_000], ['Miley Cyrus on Instagram', 215_000_000], ['Kourtney Kardashian on Instagram', 225_000_000],
  ['Katy Perry on Instagram', 205_000_000], ['Zendaya on Instagram', 185_000_000], ['Virat Kohli on Instagram', 270_000_000],
  ['Real Madrid on Instagram', 175_000_000], ['FC Barcelona on Instagram', 135_000_000], ['National Geographic on Instagram', 280_000_000],
  ['Cardi B on Instagram', 165_000_000], ['Rihanna on Instagram', 150_000_000], ['Billie Eilish on Instagram', 120_000_000],
  ['Shakira on Instagram', 90_000_000], ['Lisa (BLACKPINK) on Instagram', 105_000_000], ['Kevin Hart on Instagram', 175_000_000],
  ['Leonardo DiCaprio on Instagram', 60_000_000], ['Kylian Mbappé on Instagram', 120_000_000], ['LeBron James on Instagram', 160_000_000],
  ['Zlatan Ibrahimović on Instagram', 60_000_000], ['Tom Holland on Instagram', 65_000_000],
]);

const TIKTOK = rows('followers', 'approximate, 2025', [
  ['MrBeast on TikTok', 110_000_000], ['Bella Poarch on TikTok', 94_000_000], ['Addison Rae on TikTok', 88_000_000], ['Zach King on TikTok', 82_000_000],
  ['Kimberly Loaiza on TikTok', 85_000_000], ['Will Smith on TikTok', 75_000_000], ['Dwayne Johnson on TikTok', 80_000_000], ['Spencer X on TikTok', 55_000_000],
]);

const X = rows('followers', 'approximate, 2025', [
  ['Cristiano Ronaldo on X', 110_000_000], ['Justin Bieber on X', 110_000_000], ['Rihanna on X', 108_000_000], ['Katy Perry on X', 105_000_000],
  ['Taylor Swift on X', 95_000_000], ['Narendra Modi on X', 107_000_000], ['Donald Trump on X', 105_000_000], ['Lady Gaga on X', 84_000_000],
  ['YouTube on X', 79_000_000], ['NASA on X', 89_000_000], ['Kim Kardashian on X', 75_000_000], ['CNN on X', 63_000_000],
]);

const VIDEOS = rows('views', 'approximate, 2025', [
  ['“Johny Johny Yes Papa” (LooLoo Kids) on YouTube', 7_000_000_000], ['Cocomelon’s “Wheels on the Bus” on YouTube', 8_000_000_000],
  ['Ed Sheeran’s “Shape of You” video on YouTube', 6_400_000_000], ['Cocomelon’s “Bath Song” on YouTube', 7_000_000_000],
  ['“Phonics Song with Two Words” (ChuChu TV) on YouTube', 6_000_000_000], ['“Uptown Funk” video on YouTube', 5_400_000_000],
  ['Masha and the Bear’s “Recipe for Disaster” on YouTube', 4_600_000_000], ['Maroon 5’s “Sugar” video on YouTube', 4_100_000_000],
  ['OneRepublic’s “Counting Stars” video on YouTube', 4_200_000_000], ['Katy Perry’s “Roar” video on YouTube', 4_200_000_000],
  ['Justin Bieber’s “Sorry” video on YouTube', 3_800_000_000], ['Ed Sheeran’s “Thinking Out Loud” video on YouTube', 4_000_000_000],
  ['Alan Walker’s “Faded” video on YouTube', 3_800_000_000], ['Katy Perry’s “Dark Horse” video on YouTube', 3_600_000_000],
  ['Ed Sheeran’s “Perfect” video on YouTube', 3_900_000_000], ['Passenger’s “Let Her Go” video on YouTube', 3_700_000_000],
  ['Shakira’s “Waka Waka” video on YouTube', 4_000_000_000], ['Maroon 5’s “Girls Like You” video on YouTube', 4_000_000_000],
  ['Enrique Iglesias’ “Bailando” video on YouTube', 3_700_000_000], ['J Balvin’s “Mi Gente” video on YouTube', 3_600_000_000],
]);

const SPOTIFY = rows('streams', 'approximate, 2025', [
  ['The Weeknd’s “Blinding Lights” on Spotify', 4_800_000_000], ['Ed Sheeran’s “Shape of You” on Spotify', 4_200_000_000],
  ['Lewis Capaldi’s “Someone You Loved” on Spotify', 3_800_000_000], ['The Neighbourhood’s “Sweater Weather” on Spotify', 3_400_000_000],
  ['Harry Styles’ “As It Was” on Spotify', 3_600_000_000], ['The Weeknd’s “Starboy” on Spotify', 3_500_000_000],
  ['Post Malone and Swae Lee’s “Sunflower” on Spotify', 3_600_000_000], ['Drake’s “One Dance” on Spotify', 3_500_000_000],
  ['The Kid Laroi and Justin Bieber’s “Stay” on Spotify', 3_500_000_000], ['Ed Sheeran’s “Perfect” on Spotify', 3_200_000_000],
  ['Imagine Dragons’ “Believer” on Spotify', 3_100_000_000], ['Tones and I’s “Dance Monkey” on Spotify', 3_100_000_000],
  ['Glass Animals’ “Heat Waves” on Spotify', 3_300_000_000], ['The Chainsmokers’ “Closer” on Spotify', 3_100_000_000],
]);

const TWITCH = rows('followers', 'approximate, 2025', [
  ['Ninja on Twitch', 19_000_000], ['Ibai on Twitch', 19_000_000], ['AuronPlay on Twitch', 16_000_000], ['Rubius on Twitch', 16_000_000],
  ['xQc on Twitch', 12_000_000], ['Tfue on Twitch', 11_000_000], ['shroud on Twitch', 11_000_000], ['Pokimane on Twitch', 9_300_000], ['TheGrefg on Twitch', 12_000_000],
]);

const PLATFORMS: F[] = [
  ['Instagram, monthly active users', 2_000_000_000, 'users', 'approximate, 2024'], ['TikTok, monthly active users', 1_000_000_000, 'users', 'reported in 2021'],
  ['Snapchat, daily active users', 450_000_000, 'users', 'approximate, 2024'], ['Reddit, daily active users', 100_000_000, 'users', 'approximate, 2024'],
  ['LinkedIn, members', 1_000_000_000, 'members', 'reported in 2023'], ['Spotify, monthly active users', 675_000_000, 'users', 'end of 2024'],
  ['Spotify, paying subscribers', 263_000_000, 'subscribers', 'end of 2024'], ['Netflix, paying memberships', 301_600_000, 'members', 'end of 2024'],
  ['Discord, monthly active users', 200_000_000, 'users', 'approximate'], ['Duolingo, daily active users', 40_000_000, 'users', 'approximate, 2024'],
  ['ChatGPT, weekly active users', 800_000_000, 'users', 'reported in 2025'], ['Gmail, users', 1_800_000_000, 'users', 'approximate'],
  ['Telegram, monthly active users', 1_000_000_000, 'users', 'reported in 2025'], ['Kai Cenat’s record number of Twitch subscribers', 1_000_000, 'subscribers', '2025 subathon, approximate'],
];

const MORE_SALES = rows('copies sold', 'reported total, approximate', [
  ['Tetris (Game Boy)', 35_000_000], ['Pokémon Gold and Silver', 23_000_000], ['Pokémon Diamond and Pearl', 17_670_000], ['Pokémon X and Y', 16_600_000],
  ['Pokémon Sun and Moon', 16_200_000], ['Pokémon Let’s Go, Pikachu! and Eevee!', 15_000_000], ['Super Mario World', 20_600_000], ['Super Mario Bros. 3', 17_300_000],
  ['New Super Mario Bros. Wii', 30_300_000], ['The Legend of Zelda: Tears of the Kingdom', 21_000_000], ['Luigi’s Mansion 3', 14_000_000],
  ['Animal Crossing: Wild World', 11_750_000], ['Brain Age (Brain Training)', 19_000_000], ['Diablo III', 30_000_000], ['StarCraft', 11_000_000],
  ['Super Mario Bros. Wonder', 15_000_000], ['Mario Kart DS', 23_600_000], ['Super Mario 3D World + Bowser’s Fury', 13_000_000],
]);

const MORE_PEAKS = rows('players at once', 'all-time peak on Steam (SteamDB), approximate', [
  ['Rust', 262_000], ['Phasmophobia', 113_000], ['ARK: Survival Evolved', 248_000], ['No Man’s Sky', 213_000], ['Monster Hunter Rise', 231_000],
  ['Enshrouded', 160_000], ['Last Epoch', 265_000], ['Manor Lords', 172_000], ['Once Human', 231_000], ['The First Descendant', 264_000],
]);

const MORE_USERS: F[] = [
  ['WeChat, monthly active users', 1_380_000_000, 'users', 'approximate, 2024'], ['Pinterest, monthly active users', 553_000_000, 'users', 'end of 2024'],
  ['Threads, monthly active users', 275_000_000, 'users', 'reported in late 2024'], ['Bluesky, registered users', 30_000_000, 'users', 'approximate, 2025'],
  ['PlayStation Network, monthly active users', 116_000_000, 'users', 'approximate, 2024'], ['Xbox Game Pass, subscribers', 34_000_000, 'subscribers', 'reported in 2024'],
  ['Nintendo Switch Online, members', 34_000_000, 'members', 'approximate, 2023'], ['Disney+, subscribers', 125_000_000, 'subscribers', 'approximate, 2024'],
  ['YouTube Music and Premium, subscribers', 100_000_000, 'subscribers', 'reported in 2024'], ['Amazon Prime, members worldwide', 200_000_000, 'members', 'reported in 2021'],
  ['Zoom, daily meeting participants at the 2020 peak', 300_000_000, 'participants', 'April 2020'], ['Fortnite, registered players', 350_000_000, 'players', 'reported in May 2020'],
  ['Minecraft, monthly active players', 140_000_000, 'players', 'reported in 2021'], ['Pokémon Go, downloads', 1_000_000_000, 'downloads', 'reached in 2019'],
  ['World of Warcraft, subscribers at its peak', 12_000_000, 'subscribers', '2010'], ['League of Legends Worlds 2024 final, peak viewers (outside China)', 6_900_000, 'viewers', 'approximate'],
  ['Cristiano Ronaldo on Facebook', 170_000_000, 'followers', 'approximate, 2025'],
];

const CLASSIC_VIDEOS = rows('views', 'approximate, 2025', [
  ['“Me at the zoo”, the first YouTube video', 350_000_000], ['Rick Astley’s “Never Gonna Give You Up” on YouTube', 1_600_000_000],
  ['Queen’s “Bohemian Rhapsody” video on YouTube', 2_000_000_000], ['Toto’s “Africa” on YouTube', 1_000_000_000],
  ['Michael Jackson’s “Thriller” video on YouTube', 1_000_000_000], ['Nirvana’s “Smells Like Teen Spirit” video on YouTube', 2_000_000_000],
]);

const MORE_CONSOLES = rows('consoles sold', 'lifetime sales, approximate', [
  ['Atari 2600', 30_000_000], ['Sega Game Gear', 10_600_000], ['Sega Saturn', 9_260_000], ['The original Xbox', 24_000_000],
  ['Virtual Boy', 770_000], ['Nintendo Game & Watch handhelds', 43_400_000],
]);

const ALBUM_SALES = rows('copies sold', 'claimed sales, approximate', [
  ['Michael Jackson’s Thriller', 70_000_000], ['AC/DC’s Back in Black', 50_000_000], ['Pink Floyd’s The Dark Side of the Moon', 45_000_000],
  ['The Bodyguard soundtrack', 45_000_000], ['Meat Loaf’s Bat Out of Hell', 43_000_000], ['Eagles’ Their Greatest Hits (1971–1975)', 44_000_000],
  ['Saturday Night Fever soundtrack', 40_000_000], ['Fleetwood Mac’s Rumours', 40_000_000], ['Shania Twain’s Come On Over', 40_000_000],
  ['Adele’s 21', 31_000_000], ['Alanis Morissette’s Jagged Little Pill', 33_000_000], ['Celine Dion’s Falling into You', 32_000_000],
  ['Santana’s Supernatural', 30_000_000], ['Dirty Dancing soundtrack', 32_000_000], ['Titanic soundtrack', 30_000_000], ['Michael Jackson’s Bad', 35_000_000],
  ['Michael Jackson’s Dangerous', 32_000_000], ['Eagles’ Hotel California', 32_000_000], ['The Beatles’ 1', 31_000_000], ['Led Zeppelin IV', 37_000_000],
  ['Nirvana’s Nevermind', 30_000_000],
]);

const BOOK_SALES = rows('copies sold', 'reported, approximate', [
  ['The Harry Potter books (all seven)', 600_000_000], ['The Hobbit', 100_000_000], ['Harry Potter and the Philosopher’s Stone', 120_000_000],
  ['The Diary of a Wimpy Kid series', 275_000_000], ['The Hunger Games trilogy', 100_000_000], ['The Lord of the Rings', 150_000_000],
  ['The Da Vinci Code', 80_000_000], ['The Goosebumps series', 400_000_000], ['The Adventures of Tintin', 250_000_000], ['The One Piece manga', 500_000_000],
  ['The Dragon Ball manga', 260_000_000], ['The Naruto manga', 250_000_000],
]);

export const EXTRA_FOLLOWERS: F[] = [
  ...MORE_CONSOLES, ...ALBUM_SALES, ...BOOK_SALES,
  ...MORE_SALES, ...MORE_PEAKS, ...MORE_USERS, ...CLASSIC_VIDEOS,
  ...STEAM_PEAKS, ...GAME_SALES, ...CONSOLES, ...YOUTUBE, ...INSTAGRAM, ...TIKTOK, ...X, ...VIDEOS, ...SPOTIFY, ...TWITCH, ...PLATFORMS,
];
