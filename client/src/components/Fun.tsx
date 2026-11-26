import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../lib/cn';
import { DOMAIN_LIST, type DomainMeta } from '../lib/domains';
import { TopicIcon } from './ui';

/** Shared look of the home screen: drifting shapes, VS bubble, the mystery opponent, game chips. */

const PALETTE = ['#00b9be', '#ffb0a3', '#ff6973', '#15788c', '#46425e'];

/** Soft shapes drifting behind a screen. `calm` = fainter and slower (used while playing). */
export function FloatingShapes({ calm }: { calm?: boolean }) {
  const still = useReducedMotion();
  const shapes = [
    { c: PALETTE[0], s: 180, x: '-8%', y: '6%', r: 999, d: 14 },
    { c: PALETTE[1], s: 120, x: '78%', y: '2%', r: 32, d: 18 },
    { c: PALETTE[2], s: 70, x: '86%', y: '44%', r: 999, d: 12 },
    { c: PALETTE[3], s: 90, x: '4%', y: '62%', r: 24, d: 16 },
    { c: PALETTE[1], s: 150, x: '60%', y: '80%', r: 999, d: 20 },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {shapes.map((p, i) => (
        <motion.div
          key={i}
          className={calm ? 'absolute opacity-[0.08]' : 'absolute opacity-[0.16]'}
          style={{ left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: p.r, background: p.c }}
          animate={still ? undefined : { y: [0, -18, 0], x: [0, 10, 0], rotate: p.r < 100 ? [0, 25, 0] : 0 }}
          transition={{ duration: p.d * (calm ? 1.6 : 1), repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/** The pulsing coral VS bubble; optional content underneath (e.g. the round score). */
export function VsBubble({ size = 48, children, still: forceStill }: { size?: number; children?: ReactNode; still?: boolean }) {
  const reduce = useReducedMotion();
  const still = reduce || forceStill;
  return (
    <motion.div
      className="z-10 flex shrink-0 flex-col items-center justify-center rounded-full bg-red font-display font-bold leading-none text-white shadow-[0_8px_20px_-8px_#ff6973]"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      animate={still ? undefined : { scale: [1, 1.1, 1], rotate: [0, -6, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      VS
      {children}
    </motion.div>
  );
}

/** "?" avatar with a spinning dashed ring (opponent not known yet). */
export function MysteryAvatar({ size = 40, fast }: { size?: number; fast?: boolean }) {
  const still = useReducedMotion();
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full bg-cream/15 font-display font-bold"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      ?
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full border-2 border-dashed border-cream/50"
        animate={still ? undefined : { rotate: 360 }}
        transition={{ duration: fast ? 2.5 : 8, repeat: Infinity, ease: 'linear' }}
      />
    </span>
  );
}

/** Light rounded panel used for "you" (and most cards on these screens). */
export function SoftPanel({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-3xl p-3 backdrop-blur',
        dark ? 'bg-slate text-cream' : 'bg-surface/85 shadow-[0_10px_30px_-18px_rgb(70_66_94/0.5)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GameChip({ d }: { d: DomainMeta }) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold" style={{ background: d.soft, color: d.color }}>
      <TopicIcon domain={d.id} size={28} solid />
      {d.name}
    </span>
  );
}

/** Rows of game chips sliding in opposite directions. */
export function GameMarquee({ rows = 2, className }: { rows?: 1 | 2; className?: string }) {
  const still = useReducedMotion();
  const half = Math.ceil(DOMAIN_LIST.length / 2);
  const lines = rows === 2 ? [DOMAIN_LIST.slice(0, half), DOMAIN_LIST.slice(half)] : [DOMAIN_LIST];
  return (
    <div className={cn('space-y-2.5 overflow-hidden py-1 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]', className)}>
      {lines.map((row, r) => (
        <motion.div
          key={r}
          className="flex w-max gap-2.5"
          animate={still ? undefined : { x: r === 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
          transition={{ duration: rows === 1 ? 40 : 26, repeat: Infinity, ease: 'linear' }}
        >
          {[...row, ...row].map((d, i) => <GameChip key={`${d.id}-${i}`} d={d} />)}
        </motion.div>
      ))}
    </div>
  );
}
