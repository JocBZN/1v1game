import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LEAGUE_META } from '../lib/leagues';
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

const AVATAR_COLORS = ['#22d3ee', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa', '#f97316'];

export function Avatar({ name, size = 44, ring }: { name: string; size?: number; ring?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const color = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl font-black text-ink"
      style={{
        width: size, height: size, fontSize: size * 0.45,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        boxShadow: ring ? `0 0 0 3px ${ring}` : undefined,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function LeagueBadge({ league, small }: { league: League['id']; small?: boolean }) {
  const m = LEAGUE_META[league];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${small ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm'}`}
      style={{ borderColor: m.color + '66', color: m.color, background: m.color + '14' }}
    >
      <span>{m.emoji}</span>
      {m.name}
    </span>
  );
}

export function TimerBar({ endsAt, totalMs, className = '' }: { endsAt: number; totalMs: number; className?: string }) {
  const now = useNow();
  const left = Math.max(0, endsAt - now);
  const pct = totalMs > 0 ? Math.min(1, left / totalMs) : 0;
  const color = pct > 0.5 ? '#34d399' : pct > 0.2 ? '#fbbf24' : '#f87171';
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
    </div>
  );
}

export function SecondsLeft({ endsAt, className = '' }: { endsAt: number; className?: string }) {
  const now = useNow(100);
  const s = Math.max(0, Math.ceil((endsAt - now) / 1000));
  return <span className={`tabular-nums ${s <= 5 ? 'text-bad' : ''} ${className}`}>{s}s</span>;
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-4 safe-bottom ${className}`}>{children}</div>;
}

export function AsyncTag() {
  return (
    <span className="rounded-md border border-white/15 bg-white/5 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-muted" title="Adversar asincron">
      async
    </span>
  );
}
