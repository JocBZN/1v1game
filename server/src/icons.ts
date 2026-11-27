/**
 * Profile icons: the only pictures players can use. Free ones are open to every account; the rest are
 * bought with coins (earning coins is not built yet, so balances start at 0).
 *
 * Shared with the client (which draws them), so keep this file free of server-only imports.
 */

export type IconTier = 'free' | 'common' | 'rare' | 'epic' | 'legendary';

export const TIER_PRICE: Record<IconTier, number> = { free: 0, common: 100, rare: 300, epic: 750, legendary: 2000 };
export const TIER_LABEL: Record<IconTier, string> = { free: 'Free', common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

/** One colour per rarity, from the site palette: background, glyph, soft accent. */
export const TIER_COLORS: Record<IconTier, { bg: string; fg: string; soft: string }> = {
  free: { bg: '#7b7790', fg: '#ffeecc', soft: '#a9a5bb' }, // muted violet-grey
  common: { bg: '#00b9be', fg: '#46425e', soft: '#d2f0ef' }, // cyan
  rare: { bg: '#15788c', fg: '#ffeecc', soft: '#00b9be' }, // teal
  epic: { bg: '#ff6973', fg: '#ffeecc', soft: '#ffb0a3' }, // coral
  legendary: { bg: '#46425e', fg: '#ffeecc', soft: '#ffb0a3' }, // drawn with a teal→coral gradient
};

export interface ProfileIcon {
  id: string;
  name: string;
  tier: IconTier;
  price: number;
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

export const PROFILE_ICONS: ProfileIcon[] = DEFS.map(([id, name, tier]) => ({
  id,
  name,
  tier,
  price: TIER_PRICE[tier],
}));

const BY_ID = new Map(PROFILE_ICONS.map((i) => [i.id, i]));
export const getProfileIcon = (id: unknown): ProfileIcon | undefined => (typeof id === 'string' ? BY_ID.get(id) : undefined);
