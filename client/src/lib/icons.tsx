import {
  Anchor, Bird, Bug, Cat, Cherry, Cloud, Coffee, Compass, Crown, Dices, Dog, Donut, Feather, Fish, Flame, Flower2, Gamepad2,
  Gem, Ghost, Headphones, Heart, IceCreamCone, Leaf, Moon, Mountain, Music, Orbit, Palette, Panda, Pizza, Plane, Puzzle,
  Rabbit, Rainbow, Rocket, Sailboat, Shell, Skull, Smile, Snail, Snowflake, Squirrel, Star, Sun, Swords, Telescope, Trophy,
  Turtle, WandSparkles, Zap, type LucideIcon,
} from 'lucide-react';
import { PROFILE_ICONS, TIER_COLORS, getProfileIcon, type ProfileIcon } from '../../../server/src/icons';

export { PROFILE_ICONS, getProfileIcon, type ProfileIcon };
export { TIER_COLORS, TIER_LABEL, TIER_PRICE, type IconTier } from '../../../server/src/icons';

const GLYPHS: Record<string, LucideIcon> = {
  smile: Smile, star: Star, heart: Heart, zap: Zap, sun: Sun, moon: Moon, cloud: Cloud, flame: Flame,
  cat: Cat, dog: Dog, rabbit: Rabbit, bird: Bird, fish: Fish, turtle: Turtle, squirrel: Squirrel, snail: Snail,
  bug: Bug, leaf: Leaf, flower: Flower2, cherry: Cherry, pizza: Pizza, 'ice-cream': IceCreamCone, coffee: Coffee, donut: Donut,
  music: Music, gamepad: Gamepad2, snowflake: Snowflake, feather: Feather,
  rocket: Rocket, ghost: Ghost, skull: Skull, anchor: Anchor, compass: Compass, mountain: Mountain, sailboat: Sailboat,
  plane: Plane, puzzle: Puzzle, dice: Dices, palette: Palette, headphones: Headphones, shell: Shell, panda: Panda,
  crown: Crown, gem: Gem, trophy: Trophy, swords: Swords, wand: WandSparkles, telescope: Telescope,
  rainbow: Rainbow, orbit: Orbit,
};

/**
 * A profile icon in the site's style: a flat circle in its rarity's colour, soft shapes drifting behind
 * the glyph (like the home screen), and a little more shine the rarer it is.
 */
export function IconAvatar({ icon, size = 44, ring }: { icon: ProfileIcon; size?: number; ring?: string }) {
  const Glyph = GLYPHS[icon.id] ?? Smile;
  const sc = TIER_COLORS[icon.tier];
  const legendary = icon.tier === 'legendary';
  const bg = legendary ? `linear-gradient(135deg, #15788c 0%, #00b9be 45%, #ff6973 100%)` : sc.bg;
  const fg = legendary ? '#ffeecc' : sc.fg;
  const shadow = [
    icon.tier === 'rare' || icon.tier === 'epic' || legendary ? `inset 0 0 0 ${Math.max(1.5, size * 0.045)}px ${legendary ? '#ffeecc' : `${sc.fg}55`}` : null,
    ring ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${ring}` : null,
  ].filter(Boolean).join(', ');
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, background: bg, boxShadow: shadow || undefined }}
      role="img"
      aria-label={icon.name}
    >
      {/* soft shapes */}
      <span className="absolute rounded-full" style={{ width: size * 0.62, height: size * 0.62, right: -size * 0.2, top: -size * 0.22, background: legendary ? '#ffb0a3' : sc.soft, opacity: 0.35 }} />
      <span className="absolute rounded-[30%]" style={{ width: size * 0.34, height: size * 0.34, left: -size * 0.08, bottom: -size * 0.06, background: legendary ? '#ffeecc' : sc.soft, opacity: 0.28, transform: 'rotate(18deg)' }} />
      {(icon.tier === 'epic' || legendary) && (
        <>
          <span className="absolute rounded-full" style={{ width: size * 0.07, height: size * 0.07, left: '20%', top: '22%', background: fg, opacity: 0.85 }} />
          <span className="absolute rounded-full" style={{ width: size * 0.05, height: size * 0.05, right: '18%', bottom: '24%', background: fg, opacity: 0.7 }} />
          <span className="absolute rounded-full" style={{ width: size * 0.04, height: size * 0.04, right: '26%', top: '16%', background: fg, opacity: 0.6 }} />
        </>
      )}
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: fg }}>
        <Glyph size={size * 0.52} strokeWidth={2.2} />
      </span>
    </div>
  );
}
