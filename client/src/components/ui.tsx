import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star as StarIcon, type LucideIcon } from 'lucide-react';
import { LEAGUE_META } from '../lib/leagues';
import { DOMAINS, type DomainId } from '../lib/domains';
import { C } from '../lib/theme';
import { cn } from '../lib/cn';
import type { League } from '../lib/api';

/** Re-renders on every animation frame (or every `ms`) and returns performance.now(). */
export function useNow(ms = 0): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    let raf = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    if (ms > 0) iv = setInterval(() => setNow(performance.now()), ms);
    else {
      const loop = () => {
        setNow(performance.now());
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (iv) clearInterval(iv);
    };
  }, [ms]);
  return now;
}

/** Smoothly counts towards `value`. */
export function useAnimatedNumber(value: number, durationMs = 450): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(a + (value - a) * eased);
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, durationMs]);
  return shown;
}

/** Gradient avatars built from the palette. */
const AVATAR_GRADIENTS: [string, string, string][] = [
  ['#ffb0a3', '#ff6973', '#ffeecc'],
  ['#00b9be', '#15788c', '#ffeecc'],
  ['#ff6973', '#c23f4a', '#ffeecc'],
  ['#ffc2b7', '#ffb0a3', '#46425e'],
  ['#7fdcde', '#00b9be', '#46425e'],
  ['#ffe1de', '#ff6973', '#46425e'],
];

export function Avatar({ name, size = 44, ring, src }: { name: string; size?: number; ring?: string; src?: string | null }) {
  const ringShadow = ring ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${ring}` : undefined;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="shrink-0 rounded-full bg-sunken object-cover"
        style={{ width: size, height: size, boxShadow: ringShadow }}
      />
    );
  }
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b, fg] = AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      style={{
        width: size, height: size, fontSize: size * 0.42, color: fg,
        background: a === '#ffe1de' ? b : a,
        boxShadow: ring ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${ring}` : undefined,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function LeagueIcon({ league, size = 16 }: { league: League['id']; size?: number }) {
  const m = LEAGUE_META[league];
  const Icon = m.icon;
  return <Icon size={size} strokeWidth={2.4} style={{ color: m.color }} aria-hidden />;
}

export function LeagueBadge({ league, small }: { league: League['id']; small?: boolean }) {
  const m = LEAGUE_META[league];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full font-semibold', small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs')}
      style={{ color: m.color, background: `${m.color}1a` }}
    >
      <LeagueIcon league={league} size={small ? 12 : 14} />
      {m.name}
    </span>
  );
}

export function TimerBar({ endsAt, totalMs, className = '' }: { endsAt: number; totalMs: number; className?: string }) {
  const now = useNow();
  const left = Math.max(0, endsAt - now);
  const pct = totalMs > 0 ? Math.min(1, left / totalMs) : 0;
  const color = pct > 0.5 ? C.cyan : pct > 0.2 ? C.orange : C.red;
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}>
      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

/** Thin progress bar (0..1). */
export function Progress({ value, color = C.cyan, className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        style={{ background: color }}
      />
    </div>
  );
}

/** Back button + title for secondary screens. */
export function PageHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-2">
      <button onClick={onBack} className="btn btn-secondary -ml-1 h-10 w-10 rounded-xl p-0" aria-label="Back">
        <ArrowLeft size={18} strokeWidth={2.5} />
      </button>
      <h1 className="flex-1 font-display text-2xl font-bold tracking-tight">{title}</h1>
      {right}
    </header>
  );
}

/** A topic's icon on its tinted tile. */
export function TopicIcon({ domain, size = 40, solid }: { domain: DomainId; size?: number; solid?: boolean }) {
  const m = DOMAINS[domain];
  const Icon = m.icon;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: size, height: size, borderRadius: size * 0.32,
        background: solid ? m.color : m.soft,
        color: solid ? '#fff8e6' : m.color,
      }}
    >
      <Icon size={size * 0.5} strokeWidth={2} aria-hidden />
    </span>
  );
}

/** A lucide icon on a round tinted chip (for headers, prompts). */
export function IconChip({ icon: Icon, tone = 'cyan', size = 32 }: { icon: LucideIcon; tone?: 'cyan' | 'red' | 'orange'; size?: number }) {
  const tones = { cyan: ['#d2f0ef', '#15788c'], red: ['#ffe1de', '#d94a55'], orange: ['#ffe4dc', '#c8705f'] }[tone];
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: tones[0], color: tones[1] }}>
      <Icon size={size * 0.52} strokeWidth={2.4} aria-hidden />
    </span>
  );
}

export function SecondsLeft({ endsAt, className = '' }: { endsAt: number; className?: string }) {
  const now = useNow(100);
  const s = Math.max(0, Math.ceil((endsAt - now) / 1000));
  return <span className={cn('tabular-nums', s <= 5 && 'text-red', className)}>{s}s</span>;
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.3, 1] }}
      className={cn('mx-auto flex min-h-full w-full max-w-md flex-col px-5 pt-5 safe-bottom', className)}
    >
      {children}
    </motion.div>
  );
}

export function AsyncTag() {
  return (
    <span className="rounded-full bg-sunken px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-muted" title="Recorded opponent">
      async
    </span>
  );
}

/** Staggered entrance for lists and stacks. */
export const rise = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, type: 'spring' as const, stiffness: 260, damping: 24 },
});

/** 1–5 difficulty stars. */
export function Stars({ n, size = 13, className }: { n: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} title={`Difficulty ${n}/5`} aria-label={`Difficulty ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} strokeWidth={1.8} className={i <= n ? 'fill-current' : 'opacity-30'} />
      ))}
    </span>
  );
}
