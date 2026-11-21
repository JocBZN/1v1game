import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LEAGUE_META } from '../lib/leagues';
import { C } from '../lib/theme';
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

/** Soft tint + strong letter, all from the palette. */
const AVATAR_COLORS: [string, string][] = [
  ['#f9d6c9', '#b8240f'],
  ['#ffe0aa', '#b56500'],
  ['#c8ecea', '#007f8f'],
  ['#df301c', '#fff1d1'],
  ['#ff9100', '#2b1b12'],
  ['#00b7cd', '#2b1b12'],
];

export function Avatar({ name, size = 44, ring }: { name: string; size?: number; ring?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [bg, fg] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size, height: size, fontSize: size * 0.42, background: bg, color: fg,
        boxShadow: ring ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${ring}` : undefined,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function LeagueBadge({ league, small }: { league: League['id']; small?: boolean }) {
  const m = LEAGUE_META[league];
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${small ? 'text-[11px]' : 'text-sm'}`} style={{ color: m.color }}>
      <span>{m.emoji}</span>
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
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-sunken ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

/** Thin progress bar (0..1). */
export function Progress({ value, color = C.cyan, className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-sunken ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

/** Back button + title for secondary screens. */
export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-2">
      <button onClick={onBack} className="btn btn-ghost -ml-2 h-10 w-10 text-xl" aria-label="Back">←</button>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    </header>
  );
}

/** Emoji in a soft circle (topic icons). */
export function TopicIcon({ emoji, soft, size = 40 }: { emoji: string; soft: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: soft, fontSize: size * 0.5 }}>
      {emoji}
    </span>
  );
}

export function SecondsLeft({ endsAt, className = '' }: { endsAt: number; className?: string }) {
  const now = useNow(100);
  const s = Math.max(0, Math.ceil((endsAt - now) / 1000));
  return <span className={`tabular-nums ${s <= 5 ? 'text-red' : ''} ${className}`}>{s}s</span>;
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto flex min-h-full w-full max-w-md flex-col px-5 pt-5 safe-bottom ${className}`}>{children}</div>;
}

export function AsyncTag() {
  return (
    <span className="rounded-full border border-line px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-muted" title="Asynchronous opponent">
      async
    </span>
  );
}
