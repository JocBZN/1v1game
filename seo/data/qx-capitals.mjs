// Extra capital-city questions, generated from a template so grammar stays correct in every language:
// "Poland: what is the capital?" style (no articles / case endings needed). Country names come from ICU (Intl.DisplayNames).
// Row = [ISO code, en, es, pt, fr, de, it, ro, pl, tr] city names.
const L = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ro', 'pl', 'tr'];
const CITIES = [
  ['FR', 'Paris', 'París', 'Paris', 'Paris', 'Paris', 'Parigi', 'Paris', 'Paryż', 'Paris'],
  ['DE', 'Berlin', 'Berlín', 'Berlim', 'Berlin', 'Berlin', 'Berlino', 'Berlin', 'Berlin', 'Berlin'],
  ['ES', 'Madrid', 'Madrid', 'Madri', 'Madrid', 'Madrid', 'Madrid', 'Madrid', 'Madryt', 'Madrid'],
  ['IT', 'Rome', 'Roma', 'Roma', 'Rome', 'Rom', 'Roma', 'Roma', 'Rzym', 'Roma'],
  ['GB', 'London', 'Londres', 'Londres', 'Londres', 'London', 'Londra', 'Londra', 'Londyn', 'Londra'],
  ['RU', 'Moscow', 'Moscú', 'Moscou', 'Moscou', 'Moskau', 'Mosca', 'Moscova', 'Moskwa', 'Moskova'],
  ['CN', 'Beijing', 'Pekín', 'Pequim', 'Pékin', 'Peking', 'Pechino', 'Beijing', 'Pekin', 'Pekin'],
  ['US', 'Washington, D.C.', 'Washington D. C.', 'Washington, D.C.', 'Washington', 'Washington, D.C.', 'Washington', 'Washington, D.C.', 'Waszyngton', 'Washington, D.C.'],
  ['MX', 'Mexico City', 'Ciudad de México', 'Cidade do México', 'Mexico', 'Mexiko-Stadt', 'Città del Messico', 'Ciudad de México', 'Meksyk', 'Meksiko City'],
  ['PL', 'Warsaw', 'Varsovia', 'Varsóvia', 'Varsovie', 'Warschau', 'Varsavia', 'Varșovia', 'Warszawa', 'Varşova'],
  ['RO', 'Bucharest', 'Bucarest', 'Bucareste', 'Bucarest', 'Bukarest', 'Bucarest', 'București', 'Bukareszt', 'Bükreş'],
  ['PT', 'Lisbon', 'Lisboa', 'Lisboa', 'Lisbonne', 'Lissabon', 'Lisbona', 'Lisabona', 'Lizbona', 'Lizbon'],
  ['GR', 'Athens', 'Atenas', 'Atenas', 'Athènes', 'Athen', 'Atene', 'Atena', 'Ateny', 'Atina'],
  ['NL', 'Amsterdam', 'Ámsterdam', 'Amsterdã', 'Amsterdam', 'Amsterdam', 'Amsterdam', 'Amsterdam', 'Amsterdam', 'Amsterdam'],
  ['BE', 'Brussels', 'Bruselas', 'Bruxelas', 'Bruxelles', 'Brüssel', 'Bruxelles', 'Bruxelles', 'Bruksela', 'Brüksel'],
  ['AT', 'Vienna', 'Viena', 'Viena', 'Vienne', 'Wien', 'Vienna', 'Viena', 'Wiedeń', 'Viyana'],
  ['HU', 'Budapest', 'Budapest', 'Budapeste', 'Budapest', 'Budapest', 'Budapest', 'Budapesta', 'Budapeszt', 'Budapeşte'],
  ['CZ', 'Prague', 'Praga', 'Praga', 'Prague', 'Prag', 'Praga', 'Praga', 'Praga', 'Prag'],
  ['SE', 'Stockholm', 'Estocolmo', 'Estocolmo', 'Stockholm', 'Stockholm', 'Stoccolma', 'Stockholm', 'Sztokholm', 'Stockholm'],
  ['FI', 'Helsinki', 'Helsinki', 'Helsinque', 'Helsinki', 'Helsinki', 'Helsinki', 'Helsinki', 'Helsinki', 'Helsinki'],
  ['DK', 'Copenhagen', 'Copenhague', 'Copenhague', 'Copenhague', 'Kopenhagen', 'Copenaghen', 'Copenhaga', 'Kopenhaga', 'Kopenhag'],
  ['IE', 'Dublin', 'Dublín', 'Dublin', 'Dublin', 'Dublin', 'Dublino', 'Dublin', 'Dublin', 'Dublin'],
  ['IS', 'Reykjavík', 'Reikiavik', 'Reykjavík', 'Reykjavik', 'Reykjavík', 'Reykjavík', 'Reykjavík', 'Reykjavík', 'Reykjavik'],
  ['UA', 'Kyiv', 'Kiev', 'Kiev', 'Kyiv', 'Kyjiw', 'Kiev', 'Kiev', 'Kijów', 'Kiev'],
  ['CO', 'Bogotá', 'Bogotá', 'Bogotá', 'Bogota', 'Bogotá', 'Bogotà', 'Bogotá', 'Bogota', 'Bogota'],
  ['CL', 'Santiago', 'Santiago de Chile', 'Santiago', 'Santiago', 'Santiago de Chile', 'Santiago del Cile', 'Santiago de Chile', 'Santiago de Chile', 'Santiago'],
  ['CU', 'Havana', 'La Habana', 'Havana', 'La Havane', 'Havanna', 'L’Avana', 'Havana', 'Hawana', 'Havana'],
  ['PH', 'Manila', 'Manila', 'Manila', 'Manille', 'Manila', 'Manila', 'Manila', 'Manila', 'Manila'],
  ['PK', 'Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'İslamabad'],
  ['IR', 'Tehran', 'Teherán', 'Teerã', 'Téhéran', 'Teheran', 'Teheran', 'Teheran', 'Teheran', 'Tahran'],
  ['SA', 'Riyadh', 'Riad', 'Riade', 'Riyad', 'Riad', 'Riad', 'Riad', 'Rijad', 'Riyad'],
  ['ET', 'Addis Ababa', 'Adís Abeba', 'Adis Abeba', 'Addis-Abeba', 'Addis Abeba', 'Addis Abeba', 'Addis Abeba', 'Addis Abeba', 'Addis Ababa'],
  ['GH', 'Accra', 'Acra', 'Acra', 'Accra', 'Accra', 'Accra', 'Accra', 'Akra', 'Akra'],
  ['BG', 'Sofia', 'Sofía', 'Sófia', 'Sofia', 'Sofia', 'Sofia', 'Sofia', 'Sofia', 'Sofya'],
  ['RS', 'Belgrade', 'Belgrado', 'Belgrado', 'Belgrade', 'Belgrad', 'Belgrado', 'Belgrad', 'Belgrad', 'Belgrad'],
  ['HR', 'Zagreb', 'Zagreb', 'Zagreb', 'Zagreb', 'Zagreb', 'Zagabria', 'Zagreb', 'Zagrzeb', 'Zagreb'],
  ['MD', 'Chișinău', 'Chisináu', 'Chisinau', 'Chișinău', 'Chișinău', 'Chișinău', 'Chișinău', 'Kiszyniów', 'Kişinev'],
  ['MN', 'Ulaanbaatar', 'Ulán Bator', 'Ulan Bator', 'Oulan-Bator', 'Ulaanbaatar', 'Ulan Bator', 'Ulan Bator', 'Ułan Bator', 'Ulan Batur'],
  ['MY', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur', 'Kuala Lumpur'],
  ['LV', 'Riga', 'Riga', 'Riga', 'Riga', 'Riga', 'Riga', 'Riga', 'Ryga', 'Riga'],
  ['JM', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Kingston'],
];
// English keeps the natural sentence; "the" for the few names that need it.
const EN_THE = new Set(['US', 'GB', 'NL', 'PH']);
const Q = {
  en: (c, cc) => `What is the capital of ${EN_THE.has(cc) ? 'the ' : ''}${c}?`,
  es: (c) => `${c}: ¿cuál es su capital?`,
  pt: (c) => `${c}: qual é a capital?`,
  fr: (c) => `${c} : quelle est la capitale ?`,
  de: (c) => `${c}: Wie heißt die Hauptstadt?`,
  it: (c) => `${c}: qual è la capitale?`,
  ro: (c) => `${c}: care este capitala?`,
  pl: (c) => `${c}: jaka jest stolica?`,
  tr: (c) => `${c}: başkenti neresidir?`,
};
export const capitals = CITIES.map(([cc, ...cities]) => {
  const q = {}; const a = {};
  L.forEach((l, i) => { q[l] = Q[l](new Intl.DisplayNames([l], { type: 'region' }).of(cc), cc); a[l] = cities[i]; });
  return { q, a };
});
