/**
 * More "Opinion" questions: numbers with a known answer. Exact counts and fixed facts where possible;
 * measured or changing values carry a note ("approximate", "2023") that is shown with the answer.
 * Every answer is ≥ 1 and ≤ 1e20 (the game's slider range).
 */
type Fact = [string, number, string?];
const many = (rows: [string, number][], q: (name: string) => string, note?: string): Fact[] => rows.map(([n, v]) => [q(n), v, note]);

// ------------------------------------------------------------------ exact counts
const COUNTS: Fact[] = [
  ['How many keys does a standard piano have?', 88], ['How many squares are on a chessboard?', 64], ['How many cards are in a standard deck (no jokers)?', 52],
  ['How many tiles are in a double-six domino set?', 28], ['How many spaces are on a classic Monopoly board?', 40], ['How many letter tiles are in an English Scrabble set?', 100],
  ['How many coloured stickers are on a classic Rubik’s Cube?', 54], ['How many pips are on a standard six-sided die in total?', 21], ['How many cells are in a Sudoku grid?', 81],
  ['How many cards are in a tarot deck?', 78], ['How many blocks are in a classic Jenga set?', 54], ['How many discs come with Connect Four?', 42],
  ['How many pieces does each player start with in checkers (draughts)?', 12], ['How many balls are on the table at the start of a snooker frame?', 22],
  ['How many holes are on a standard golf course?', 18], ['How many players does a rugby union team have on the field?', 15], ['How many metres long is a marathon?', 42_195],
  ['How many metres long is an Olympic swimming pool?', 50], ['How many teams play in the 2026 FIFA World Cup?', 48], ['How many teams play in the NBA?', 30],
  ['How many teams play in the NFL?', 32], ['How many matches are played in one Premier League season?', 380], ['How many seconds are in a day?', 86_400],
  ['How many minutes are in a week?', 10_080], ['How many hours are in a (non-leap) year?', 8_760], ['How many seconds are in a (non-leap) year?', 31_536_000],
  ['How many letters are in the Romanian alphabet?', 31], ['How many letters are in the Greek alphabet?', 24], ['How many letters are in the Russian alphabet?', 33],
  ['How many basic hiragana characters are there?', 46], ['How many letters are in the Hawaiian alphabet?', 13], ['How many sonnets did Shakespeare publish?', 154],
  ['How many symphonies did Beethoven complete?', 9], ['How many books are in the Protestant Bible?', 66], ['How many episodes of Friends were made?', 236],
  ['How many episodes of Game of Thrones were made?', 73], ['How many episodes of Breaking Bad were made?', 62], ['How many episodes of Seinfeld were made?', 180],
  ['How many episodes of The Office (US) were made?', 201], ['How many Pokémon were in the first games (Red and Green)?', 151],
  ['How many stars are there to collect in Super Mario 64?', 120], ['How many official James Bond films did Eon make up to No Time to Die?', 25],
  ['How many member states does the United Nations have?', 193], ['How many countries are in the European Union?', 27], ['How many countries are in NATO?', 32],
  ['How many states does the USA have?', 50], ['How many provinces does Canada have?', 10], ['How many states does Germany have?', 16],
  ['How many counties does Romania have (not counting Bucharest)?', 41], ['How many cantons does Switzerland have?', 26], ['How many countries are in Africa?', 54],
  ['How many countries are in South America?', 12], ['How many time zones does Russia have?', 11], ['How many official languages does the EU have?', 24],
  ['How many stars are on the flag of the European Union?', 12], ['How many stripes are on the US flag?', 13], ['How many stars are on the US flag?', 50],
  ['How many bones are in an adult human body?', 206], ['How many teeth does an adult human have (wisdom teeth included)?', 32], ['How many milk teeth does a child have?', 20],
  ['How many chromosomes does a human cell have?', 46], ['How many ribs does a human have?', 24], ['How many bones are in one human hand (wrist included)?', 27],
  ['How many bones are in one human foot?', 26], ['How many bones make up the adult human skull?', 22], ['How many vertebrae does a human spine have (sacrum and coccyx counted as separate bones)?', 33],
  ['How many legs does a spider have?', 8], ['How many hearts does an octopus have?', 3], ['How many Grand Slam singles titles did Roger Federer win?', 20],
  ['How many Grand Slam singles titles did Rafael Nadal win?', 22], ['How many Grand Slam singles titles had Novak Djokovic won by the end of 2025?', 24, 'as of the end of 2025'],
  ['How many Grand Slam singles titles did Serena Williams win?', 23], ['How many Olympic medals did Michael Phelps win?', 28], ['How many Olympic gold medals did Michael Phelps win?', 23],
  ['How many Olympic gold medals did Usain Bolt win?', 8], ['How many perfect 10s did Nadia Comăneci score at the 1976 Olympics?', 7], ['How many times has Brazil won the football World Cup?', 5],
  ['How many Ballon d’Or awards had Lionel Messi won by the end of 2025?', 8], ['How many Ballon d’Or awards had Cristiano Ronaldo won by the end of 2025?', 5], ['How many European Cups / Champions Leagues had Real Madrid won by the end of 2025?', 15, 'as of the end of 2025'],
  ['How many points did Wilt Chamberlain score in his record NBA game?', 100], ['How many points did Wayne Gretzky score in his NHL career?', 2_857],
  ['How many goals does Guinness credit Pelé with?', 1_279], ['How many years did Queen Elizabeth II reign (rounded down)?', 70], ['How many years did Louis XIV reign (rounded down)?', 72],
  ['How many years did Queen Victoria reign (rounded down)?', 63], ['How many years did the Hundred Years’ War actually last?', 116], ['How many years did the Berlin Wall stand (rounded down)?', 28],
  ['How many years did the Byzantine Empire last, from Constantinople becoming capital (330) to its fall (1453)?', 1_123], ['How many years did the Ottoman Empire last (1299–1922)?', 623],
  ['How many days are in a leap year?', 366], ['How many white keys does a standard piano have?', 52], ['How many black keys does a standard piano have?', 36],
  ['How many strings does a standard guitar have?', 6], ['How many squares are on a Scrabble board?', 225],
  ['How many players are on the field for one football (soccer) team?', 11],
];

// ------------------------------------------------------------------ atomic numbers (exact)
const ELEMENTS: [string, number][] = [
  ['helium', 2], ['lithium', 3], ['carbon', 6], ['nitrogen', 7], ['oxygen', 8], ['neon', 10], ['sodium', 11], ['magnesium', 12], ['aluminium', 13],
  ['silicon', 14], ['phosphorus', 15], ['sulfur', 16], ['chlorine', 17], ['argon', 18], ['potassium', 19], ['calcium', 20], ['titanium', 22],
  ['chromium', 24], ['iron', 26], ['cobalt', 27], ['nickel', 28], ['copper', 29], ['zinc', 30], ['arsenic', 33], ['bromine', 35], ['krypton', 36],
  ['silver', 47], ['tin', 50], ['iodine', 53], ['xenon', 54], ['tungsten', 74], ['platinum', 78], ['gold', 79], ['mercury', 80], ['lead', 82],
  ['radon', 86], ['radium', 88], ['uranium', 92], ['plutonium', 94], ['oganesson', 118],
  ['beryllium', 4], ['boron', 5], ['fluorine', 9], ['scandium', 21], ['vanadium', 23], ['manganese', 25], ['gallium', 31], ['germanium', 32],
  ['selenium', 34], ['rubidium', 37], ['strontium', 38], ['zirconium', 40], ['molybdenum', 42], ['palladium', 46], ['cadmium', 48], ['antimony', 51],
  ['caesium', 55], ['barium', 56], ['neodymium', 60], ['iridium', 77], ['bismuth', 83], ['polonium', 84], ['thorium', 90], ['einsteinium', 99],
];

// ------------------------------------------------------------------ ages at death (from birth and death dates)
const AGES: [string, number][] = [
  ['Wolfgang Amadeus Mozart', 35], ['Ludwig van Beethoven', 56], ['Johann Sebastian Bach', 65], ['Albert Einstein', 76], ['Isaac Newton', 84],
  ['Charles Darwin', 73], ['William Shakespeare', 52], ['Abraham Lincoln', 56], ['John F. Kennedy', 46], ['Elvis Presley', 42], ['Michael Jackson', 50],
  ['Freddie Mercury', 45], ['John Lennon', 40], ['Kurt Cobain', 27], ['Amy Winehouse', 27], ['Jimi Hendrix', 27], ['Napoleon Bonaparte', 51],
  ['Alexander the Great', 32], ['Marie Curie', 66], ['Queen Elizabeth II', 96], ['Queen Victoria', 81], ['Pablo Picasso', 91], ['Vincent van Gogh', 37],
  ['Leonardo da Vinci', 67], ['Michelangelo', 88], ['Galileo Galilei', 77], ['Steve Jobs', 56], ['Princess Diana', 36], ['Bruce Lee', 32],
  ['Martin Luther King Jr.', 39], ['Mahatma Gandhi', 78], ['Nelson Mandela', 95], ['Stephen Hawking', 76], ['Pelé', 82], ['Diego Maradona', 60],
  ['Kobe Bryant', 41], ['Stan Lee', 95], ['Walt Disney', 65], ['Mark Twain', 74], ['Charles Dickens', 58], ['Jane Austen', 41], ['Edgar Allan Poe', 40],
  ['Mihai Eminescu', 39], ['Constantin Brâncuși', 81], ['George Enescu', 73], ['Queen Marie of Romania', 62], ['Frédéric Chopin', 39],
  ['Pyotr Ilyich Tchaikovsky', 53], ['Franz Schubert', 31], ['Nikola Tesla', 86], ['Thomas Edison', 84], ['Winston Churchill', 90],
  ['Jeanne Calment, the oldest person ever verified', 122],
  ['Ernest Hemingway', 61], ['Leo Tolstoy', 82], ['Fyodor Dostoevsky', 59], ['Victor Hugo', 83], ['Oscar Wilde', 46], ['Franz Kafka', 40],
  ['George Orwell', 46], ['J. R. R. Tolkien', 81], ['Agatha Christie', 85], ['Claude Monet', 86], ['Salvador Dalí', 84], ['Frida Kahlo', 47],
  ['Rembrandt', 63], ['Johannes Vermeer', 43], ['Antonio Vivaldi', 63], ['Giuseppe Verdi', 87], ['Richard Wagner', 69], ['Johannes Brahms', 63],
  ['George Gershwin', 38], ['Louis Armstrong', 69], ['Frank Sinatra', 82], ['David Bowie', 69], ['Prince', 57], ['Whitney Houston', 48],
  ['Bob Marley', 36], ['Tupac Shakur', 25], ['The Notorious B.I.G.', 24], ['Avicii', 28], ['Marilyn Monroe', 36], ['James Dean', 24],
  ['Heath Ledger', 28], ['Robin Williams', 63], ['Charlie Chaplin', 88], ['Audrey Hepburn', 63], ['Ayrton Senna', 34], ['Muhammad Ali', 74],
  ['Johan Cruyff', 68], ['Julius Caesar', 55], ['Cleopatra', 39], ['Genghis Khan (traditional birth year)', 65], ['Christopher Columbus', 54],
  ['Ferdinand Magellan', 41], ['Nicolaus Copernicus', 70], ['Johannes Kepler', 58], ['Louis Pasteur', 72], ['Alexander Fleming', 73],
  ['Alan Turing', 41], ['Ada Lovelace', 36], ['Steve Irwin', 44], ['Paul Walker', 40], ['Chadwick Boseman', 43], ['Matthew Perry', 54],
];

// ------------------------------------------------------------------ heights, lengths, areas
const MOUNTAINS: [string, number][] = [
  ['K2', 8_611], ['Kangchenjunga', 8_586], ['Lhotse', 8_516], ['Makalu', 8_485], ['Aconcagua', 6_961], ['Denali', 6_190], ['Kilimanjaro', 5_895],
  ['Mount Elbrus', 5_642], ['Mont Blanc', 4_806], ['the Matterhorn', 4_478], ['Moldoveanu, Romania’s highest peak', 2_544], ['Mount Fuji', 3_776],
  ['Mount Olympus (Greece)', 2_918], ['Ben Nevis', 1_345], ['Mount Kosciuszko', 2_228], ['Mount Vinson', 4_892], ['Puncak Jaya', 4_884],
  ['Table Mountain', 1_085], ['Mount Vesuvius', 1_281], ['Mount Rainier', 4_392], ['Mauna Kea (above sea level)', 4_207], ['the Zugspitze', 2_962],
  ['the Grossglockner', 3_798], ['Mount Triglav', 2_864], ['Musala, Bulgaria’s highest peak', 2_925], ['Gerlachovský štít', 2_655], ['Rysy', 2_499],
  ['Mount St. Helens (after 1980)', 2_549], ['Mount Ararat', 5_137],
];
const BUILDINGS: [string, number, string?][] = [
  ['the Burj Khalifa', 828], ['the Shanghai Tower', 632], ['the Abraj Al-Bait clock tower in Mecca', 601], ['the Lotte World Tower', 555],
  ['One World Trade Center (with spire)', 541], ['Taipei 101', 508], ['the Petronas Towers', 452], ['the Empire State Building (to the tip)', 443],
  ['the Eiffel Tower (with antennas)', 330], ['the Tokyo Skytree', 634], ['Toronto’s CN Tower', 553], ['the Leaning Tower of Pisa', 56],
  ['the Statue of Liberty (ground to torch)', 93], ['the Elizabeth Tower (Big Ben)', 96], ['the Great Pyramid of Giza when it was built', 147],
  ['the Christ the Redeemer statue (without pedestal)', 30], ['the Colosseum’s outer wall', 48], ['the Millau Viaduct’s tallest pier with mast', 343],
  ['the Space Needle in Seattle', 184], ['the Gateway Arch in St. Louis', 192], ['the Washington Monument', 169], ['Cologne Cathedral', 157],
  ['St. Peter’s Basilica dome (to the top of the cross)', 137],
];
const LENGTHS_KM: [string, number][] = [
  ['the Panama Canal', 82], ['the Suez Canal', 193], ['the Channel Tunnel', 50], ['the Gotthard Base Tunnel', 57], ['the Trans-Siberian Railway (Moscow–Vladivostok)', 9_289],
  ['the Danube', 2_850], ['the Rhine', 1_230], ['the Thames', 346], ['the Volga', 3_530], ['the Seine', 777], ['the Mississippi River', 3_730],
  ['the Nile', 6_650], ['the Yangtze', 6_300], ['the Mekong', 4_900], ['the Congo River', 4_700], ['the Ganges', 2_525], ['the Yellow River', 5_464],
  ['the Elbe', 1_094], ['the Dniester', 1_362], ['Earth’s circumference at the Equator', 40_075], ['Earth’s diameter', 12_742],
];
const AREAS: [string, number][] = [
  ['Russia', 17_100_000], ['Canada', 9_985_000], ['the United States', 9_834_000], ['China', 9_600_000], ['Brazil', 8_516_000], ['Australia', 7_692_000],
  ['India', 3_287_000], ['Argentina', 2_780_000], ['Kazakhstan', 2_725_000], ['Algeria', 2_382_000], ['Saudi Arabia', 2_150_000], ['Mexico', 1_964_000],
  ['Indonesia', 1_905_000], ['Iran', 1_648_000], ['Mongolia', 1_564_000], ['Egypt', 1_010_000], ['Turkey', 783_600], ['Ukraine', 603_500],
  ['metropolitan France', 551_500], ['Spain', 506_000], ['Sweden', 450_000], ['Japan', 378_000], ['Germany', 357_600], ['Poland', 312_700],
  ['Italy', 301_300], ['the United Kingdom', 243_600], ['Romania', 238_400], ['Greece', 132_000], ['Bulgaria', 111_000], ['Iceland', 103_000],
  ['Hungary', 93_000], ['Portugal', 92_200], ['Austria', 83_900], ['Czechia', 78_900], ['Ireland', 70_300], ['Denmark (without Greenland)', 42_900],
  ['the Netherlands', 41_500], ['Switzerland', 41_300], ['Moldova', 33_800], ['Belgium', 30_700], ['Cyprus', 9_251], ['Luxembourg', 2_586],
  ['Andorra', 468], ['Malta', 316], ['Liechtenstein', 160], ['San Marino', 61], ['Singapore', 734], ['Monaco', 2],
];

// ------------------------------------------------------------------ islands, lakes, deserts (approximate areas)
const BIG_AREAS: [string, number][] = [
  ['Greenland', 2_166_000], ['New Guinea', 786_000], ['Borneo', 743_000], ['Madagascar', 587_000], ['the island of Great Britain', 209_000],
  ['Sicily', 25_700], ['Crete', 8_450], ['Sardinia', 24_100], ['Corsica', 8_680], ['Tasmania', 68_400], ['the Caspian Sea', 371_000],
  ['Lake Superior', 82_100], ['Lake Victoria', 59_900], ['Lake Baikal', 31_500], ['Lake Balaton', 592], ['Lake Geneva', 580], ['Lake Titicaca', 8_372],
  ['the Dead Sea', 605], ['the Sahara', 9_200_000], ['the Gobi Desert', 1_300_000], ['Antarctica', 14_200_000], ['the Danube Delta', 4_152],
  ['Alaska', 1_723_000], ['Texas', 696_000], ['California', 424_000], ['Florida', 170_000], ['Rhode Island', 4_000],
];

// ------------------------------------------------------------------ speed records
const SPEED: [string, number][] = [
  ['the land speed record car ThrustSSC (1997)', 1_228], ['a Japanese SCMaglev train in its record run (2015)', 603], ['Concorde at cruising speed', 2_180],
  ['the SR-71 Blackbird at its record speed', 3_530], ['a French TGV in its record run (2007)', 575], ['the Bugatti Chiron Super Sport 300+ in its record run', 490],
  ['the fastest tennis serve recorded (Sam Groth, 2012)', 263], ['a cheetah at full sprint', 110], ['a racing greyhound', 70],
];

// ------------------------------------------------------------------ space
const SPACE: Fact[] = [
  ['How many kilometres is the Sun from Earth on average?', 149_600_000], ['How many kilometres wide is the Sun?', 1_392_000], ['How many kilometres wide is the Moon?', 3_474],
  ['How many kilometres wide is Mars?', 6_779], ['How many kilometres wide is Jupiter?', 139_820], ['How many kilometres wide is Saturn (without rings)?', 116_460],
  ['How many kilometres wide is Mercury?', 4_879], ['How many kilometres wide is Venus?', 12_104], ['How many kilometres wide is Uranus?', 50_724],
  ['How many kilometres wide is Neptune?', 49_244], ['How many kilometres wide is Pluto?', 2_377], ['How many Earth days is one year on Mars?', 687],
  ['How many Earth days is one year on Jupiter?', 4_333], ['How many Earth days is one year on Saturn?', 10_759], ['How many Earth days is one year on Neptune?', 60_190],
  ['How many seconds does sunlight take to reach Earth?', 499], ['How many years old is the universe?', 13_800_000_000, 'about 13.8 billion'],
  ['How many years old is Earth?', 4_540_000_000, 'about 4.54 billion'], ['How many kilometres above Earth does the ISS fly?', 400, 'approximate'],
  ['How fast does the ISS fly, in km per hour?', 28_000, 'approximate'], ['How many kilometres above the Equator is a geostationary orbit?', 35_786],
  ['How fast must a rocket go to escape Earth, in km per hour?', 40_270, '11.2 km/s'], ['How many light-years away is Proxima Centauri?', 4.24],
  ['How many light-years away is the Andromeda galaxy?', 2_500_000, 'about 2.5 million'], ['How many light-years across is the Milky Way?', 100_000, 'about'],
  ['How many °C is the surface of the Sun?', 5_500, 'about'], ['How many °C is the core of the Sun?', 15_000_000, 'about'], ['How many metres tall is Olympus Mons on Mars?', 21_900, 'about 21.9 km'],
  ['How many metres deep is the deepest point of the Mariana Trench?', 10_935, 'approximate'], ['How many metres deep is Lake Baikal at its deepest?', 1_642],
  ['How many metres high is Angel Falls?', 979], ['How many metres high is Victoria Falls?', 108], ['How many days did Apollo 11 take, launch to splashdown?', 8],
  ['How many people have walked on the Moon?', 12], ['How many Apollo missions landed on the Moon?', 6], ['How many km/h is the speed of sound at 20 °C?', 1_235],
];

// ------------------------------------------------------------------ records and people
const RECORDS: Fact[] = [
  ['How many centimetres tall was Robert Wadlow, the tallest man ever?', 272], ['How many seconds did Kelvin Kiptum’s marathon world record take?', 7_235, '2:00:35'],
  ['How many km/h was Usain Bolt’s top speed in his 9.58 world record?', 44.72], ['How many centimetres is Javier Sotomayor’s high-jump world record?', 245],
  ['How many centimetres is Mike Powell’s long-jump world record?', 895],
  ['How many steps are there to the top of the Statue of Liberty’s crown?', 354], ['How many rooms does Buckingham Palace have?', 775],
  ['How many square metres of floor does Romania’s Palace of the Parliament have?', 365_000], ['How many metres long is the Golden Gate Bridge’s main span?', 1_280],
  ['How many metres long is the Brooklyn Bridge’s main span?', 486], ['How many metres long is the Çanakkale 1915 Bridge’s main span?', 2_023],
  ['How many metres long is the Akashi Kaikyō Bridge’s main span?', 1_991], ['How many species of ants have been described?', 14_000, 'approximate'],
  ['How many species of birds are there?', 11_000, 'approximate'], ['How many species of mammals are there?', 6_500, 'approximate'],
  ['How many beats per minute can a hummingbird’s heart reach?', 1_200, 'approximate'], ['How fast does a peregrine falcon dive, in km per hour?', 390, 'fastest measured'],
  ['How many days does an African elephant’s pregnancy last?', 650, 'about 22 months'], ['How many grams does an ostrich egg weigh?', 1_400, 'approximate'],
  ['How many metres long can a blue whale grow?', 30, 'longest measured'], ['How many metres tall can a giraffe grow?', 5.7, 'tallest recorded'],
];

// ------------------------------------------------------------------ populations (approximate, 2023)
const POP_COUNTRIES: [string, number][] = [
  ['India', 1_430_000_000], ['China', 1_410_000_000], ['the United States', 335_000_000], ['Indonesia', 278_000_000], ['Pakistan', 240_000_000],
  ['Nigeria', 224_000_000], ['Brazil', 216_000_000], ['Bangladesh', 173_000_000], ['Russia', 144_000_000], ['Mexico', 128_000_000], ['Japan', 124_000_000],
  ['the Philippines', 117_000_000], ['Egypt', 112_000_000], ['Vietnam', 99_000_000], ['Germany', 84_000_000], ['Turkey', 85_000_000], ['Iran', 89_000_000],
  ['the United Kingdom', 68_000_000], ['France', 68_000_000], ['Italy', 59_000_000], ['South Africa', 60_000_000], ['Spain', 48_000_000],
  ['Argentina', 46_000_000], ['Canada', 40_000_000], ['Poland', 37_000_000], ['Australia', 27_000_000], ['Romania', 19_000_000], ['the Netherlands', 18_000_000],
  ['Belgium', 11_700_000], ['Sweden', 10_500_000], ['Portugal', 10_400_000], ['Greece', 10_400_000], ['Hungary', 9_600_000], ['Austria', 9_100_000],
  ['Switzerland', 8_800_000], ['Bulgaria', 6_400_000], ['Denmark', 5_900_000], ['Finland', 5_600_000], ['Norway', 5_500_000], ['Ireland', 5_300_000],
  ['New Zealand', 5_200_000], ['Iceland', 390_000], ['Luxembourg', 670_000], ['Malta', 540_000], ['Monaco', 39_000],
];
const POP_CITIES: [string, number][] = [
  ['Bucharest', 1_700_000], ['London', 8_900_000], ['Paris (city proper)', 2_100_000], ['New York City', 8_300_000], ['Berlin', 3_800_000], ['Madrid', 3_400_000],
  ['Rome', 2_800_000], ['Istanbul', 15_600_000], ['Moscow', 13_000_000], ['the Tokyo metropolitan area', 37_000_000],
  ['Cluj-Napoca', 290_000], ['Iași', 270_000], ['Timișoara', 250_000], ['Constanța', 260_000], ['Vienna', 2_000_000],
  ['Budapest', 1_700_000], ['Warsaw', 1_860_000], ['Prague', 1_350_000], ['Sofia', 1_250_000], ['Athens (city proper)', 640_000], ['Lisbon (city proper)', 550_000],
  ['Barcelona', 1_650_000], ['Amsterdam', 930_000], ['Los Angeles', 3_800_000], ['Chicago', 2_650_000], ['Toronto', 2_800_000], ['the Sydney metropolitan area', 5_300_000],
  ['Mumbai (city)', 12_500_000], ['Mexico City (city proper)', 9_200_000],
];

export const EXTRA_OPINION: Fact[] = [
  ...COUNTS,
  ...many(ELEMENTS, (n) => `How many protons does an atom of ${n} have?`),
  ...many(AGES, (n) => `How old was ${n} when they died?`),
  ...many(MOUNTAINS, (n) => `How many metres high is ${n}?`),
  ...BUILDINGS.map(([n, v, note]): Fact => [`How many metres tall is ${n}?`, v, note]),
  ...many(LENGTHS_KM, (n) => `How many kilometres long is ${n}?`, 'approximate'),
  ...many(AREAS, (n) => `How many square kilometres is ${n}?`, 'approximate'),
  ...many(BIG_AREAS, (n) => `How many square kilometres is ${n}?`, 'approximate'),
  ...many(SPEED, (n) => `How fast is ${n}, in km per hour?`, 'approximate'),
  ...SPACE,
  ...RECORDS,
  ...many(POP_COUNTRIES, (n) => `How many people lived in ${n} in 2023?`, 'approximate'),
  ...many(POP_CITIES, (n) => `How many people lived in ${n} in 2023?`, 'approximate'),
];
