/**
 * Profile icons: the only pictures players can use. Free ones are open to every account; the rest are
 * bought with coins (earning coins is not built yet, so balances start at 0).
 *
 * Shared with the client (which draws them), so keep this file free of server-only imports.
 */

export type IconTier = 'free' | 'common' | 'rare' | 'epic' | 'legendary';

export const TIER_PRICE: Record<IconTier, number> = { free: 0, common: 100, rare: 300, epic: 750, legendary: 2000 };
export const TIER_LABEL: Record<IconTier, string> = { free: 'Free', common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

/** Site palette pairs: background, glyph. */
export const ICON_SCHEMES = [
  { bg: '#15788c', fg: '#ffeecc', soft: '#00b9be' }, // teal
  { bg: '#ff6973', fg: '#ffeecc', soft: '#ffb0a3' }, // coral
  { bg: '#00b9be', fg: '#46425e', soft: '#d2f0ef' }, // cyan
  { bg: '#ffb0a3', fg: '#46425e', soft: '#ffe4dc' }, // peach
  { bg: '#46425e', fg: '#ffb0a3', soft: '#7b7790' }, // slate
] as const;

export interface ProfileIcon {
  id: string;
  name: string;
  tier: IconTier;
  price: number;
  /** Index into ICON_SCHEMES. */
  scheme: number;
}

const DEFS: [string, string, IconTier][] = [
  // free (8)
  ['smile', 'Smiley', 'free'], ['star', 'Star', 'free'], ['heart', 'Heart', 'free'], ['zap', 'Bolt', 'free'],
  ['sun', 'Sun', 'free'], ['moon', 'Moon', 'free'], ['cloud', 'Cloud', 'free'], ['flame', 'Flame', 'free'],
  // common (20)
  ['cat', 'Cat', 'common'], ['dog', 'Dog', 'common'], ['rabbit', 'Bunny', 'common'], ['bird', 'Bird', 'common'],
  ['fish', 'Fish', 'common'], ['turtle', 'Turtle', 'common'], ['squirrel', 'Squirrel', 'common'], ['snail', 'Snail', 'common'],
  ['bug', 'Ladybug', 'common'], ['leaf', 'Leaf', 'common'], ['flower', 'Flower', 'common'], ['cherry', 'Cherries', 'common'],
  ['pizza', 'Pizza', 'common'], ['ice-cream', 'Ice cream', 'common'], ['coffee', 'Coffee', 'common'], ['donut', 'Donut', 'common'],
  ['music', 'Music', 'common'], ['gamepad', 'Gamepad', 'common'], ['snowflake', 'Snowflake', 'common'], ['feather', 'Feather', 'common'],
  // rare (14)
  ['rocket', 'Rocket', 'rare'], ['ghost', 'Ghost', 'rare'], ['skull', 'Skull', 'rare'], ['anchor', 'Anchor', 'rare'],
  ['compass', 'Compass', 'rare'], ['mountain', 'Mountain', 'rare'], ['sailboat', 'Sailboat', 'rare'], ['plane', 'Plane', 'rare'],
  ['puzzle', 'Puzzle', 'rare'], ['dice', 'Dice', 'rare'], ['palette', 'Palette', 'rare'], ['headphones', 'Headphones', 'rare'],
  ['shell', 'Shell', 'rare'], ['panda', 'Panda', 'rare'],
  // epic (6)
  ['crown', 'Crown', 'epic'], ['gem', 'Gem', 'epic'], ['trophy', 'Trophy', 'epic'], ['swords', 'Swords', 'epic'],
  ['wand', 'Magic wand', 'epic'], ['telescope', 'Telescope', 'epic'],
  // legendary (2)
  ['rainbow', 'Rainbow', 'legendary'], ['orbit', 'Orbit', 'legendary'],
];

/**
 * Colours: stable per icon, picked so an icon never matches its left neighbour or the one above it in
 * the picker's 5-wide grid (each tier starts a new row).
 */
function assignSchemes(): number[] {
  const out: number[] = [];
  let tierStart = 0;
  DEFS.forEach(([id, , tier], i) => {
    if (i > 0 && tier !== DEFS[i - 1][2]) tierStart = i;
    const col = (i - tierStart) % 5;
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const left = col > 0 ? out[i - 1] : -1;
    const above = i - 5 >= tierStart ? out[i - 5] : -1;
    let k = h % ICON_SCHEMES.length;
    while (k === left || k === above) k = (k + 1) % ICON_SCHEMES.length;
    out.push(k);
  });
  return out;
}
const SCHEMES = assignSchemes();

export const PROFILE_ICONS: ProfileIcon[] = DEFS.map(([id, name, tier], i) => ({
  id,
  name,
  tier,
  price: TIER_PRICE[tier],
  scheme: SCHEMES[i],
}));

const BY_ID = new Map(PROFILE_ICONS.map((i) => [i.id, i]));
export const getProfileIcon = (id: unknown): ProfileIcon | undefined => (typeof id === 'string' ? BY_ID.get(id) : undefined);
