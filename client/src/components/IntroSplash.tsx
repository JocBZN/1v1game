import { useEffect, useRef, useState } from 'react';
import { DOMAIN_LIST } from '../lib/domains';

const SEEN_KEY = 'duel.introSeen';

/** First visit ever (or `?intro` in the URL to replay it). */
export function shouldShowIntro(): boolean {
  try {
    if (new URLSearchParams(location.search).has('intro')) return true;
    return localStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

// Timeline (ms)
const CLASH = 850;
const LETTER_START = 1050;
const LETTER_GAP = 120;
const ICONS = 1750;
const CONFETTI = 2350;
const EXIT = 3900;
const EXIT_MS = 550;

const SPARK_COLORS = ['#ffffff', '#fff3c4', '#ffd166', '#ff8a3d', '#ff4d6d'];
const CONFETTI_COLORS = ['#ffd166', '#ff8a3d', '#ff4d6d', '#2ee6c4', '#b18cff', '#5cc8ff', '#3ddc97'];

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string;
  kind: 'spark' | 'confetti' | 'ember';
  size: number; rot: number; vr: number;
}

/** Canvas particle system: sparks (additive streaks), embers and confetti. */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const parts = useRef<Particle[]>([]);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);
    const loop = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const next: Particle[] = [];
      for (const p of parts.current) {
        p.life++;
        if (p.life > p.max) continue;
        const k = 1 - p.life / p.max;
        if (p.kind === 'confetti') {
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 0.18;
          p.rot += p.vr;
          p.x += p.vx + Math.sin(p.life / 8) * 0.6;
          p.y += p.vy;
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.abs(Math.cos(p.life / 6)) * 0.8 + 0.2);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
          ctx.restore();
        } else {
          p.vx *= 0.955;
          p.vy = p.vy * 0.955 + (p.kind === 'spark' ? 0.22 : 0.05);
          const px = p.x;
          const py = p.y;
          p.x += p.vx;
          p.y += p.vy;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = k;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * k + 0.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px - p.vx * (p.kind === 'spark' ? 2.5 : 0.5), py - p.vy * (p.kind === 'spark' ? 2.5 : 0.5));
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        next.push(p);
      }
      ctx.globalAlpha = 1;
      parts.current = next;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
    };
  }, [canvasRef]);

  return {
    sparks(x: number, y: number, n: number, power = 1) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (3 + Math.random() * 13) * power;
        parts.current.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 0, max: 40 + Math.random() * 50,
          color: SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0], kind: 'spark', size: 1.5 + Math.random() * 2.5, rot: 0, vr: 0,
        });
      }
    },
    embers(n: number) {
      for (let i = 0; i < n; i++) {
        parts.current.push({
          x: Math.random() * innerWidth, y: innerHeight + 10, vx: (Math.random() - 0.5) * 1.5, vy: -2 - Math.random() * 4,
          life: 0, max: 90 + Math.random() * 80, color: SPARK_COLORS[2 + ((Math.random() * 3) | 0)], kind: 'ember', size: 2 + Math.random() * 2, rot: 0, vr: 0,
        });
      }
    },
    confetti(x: number, y: number, n: number, dir: number) {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + dir * (0.25 + Math.random() * 0.5);
        const s = 9 + Math.random() * 11;
        parts.current.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 110 + Math.random() * 60,
          color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0], kind: 'confetti',
          size: 7 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        });
      }
    },
  };
}

function Sword({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 200" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="blade" x1="0" x2="1">
          <stop offset="0" stopColor="#8f97b8" />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e8ecff" />
          <stop offset="1" stopColor="#7a80a3" />
        </linearGradient>
        <linearGradient id="gold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <polygon points="20,0 28,16 28,138 12,138 12,16" fill="url(#blade)" />
      <line x1="20" y1="18" x2="20" y2="132" stroke="#9aa2c6" strokeWidth="1.5" />
      <rect x="1" y="136" width="38" height="9" rx="4" fill="url(#gold)" />
      <rect x="15.5" y="145" width="9" height="36" rx="3" fill="#5a2e3a" />
      {[151, 159, 167, 175].map((y) => (
        <rect key={y} x="15" y={y} width="10" height="3" rx="1.5" fill="#ff6b8b" opacity="0.7" />
      ))}
      <circle cx="20" cy="188" r="8" fill="url(#gold)" />
    </svg>
  );
}

/**
 * Full-screen "crazy" intro shown on the very first visit: swords clash → flash, shake, shockwave and a
 * spark explosion → DUEL slams in letter by letter → domain icons fly in → confetti → zoom into the app.
 * Tap anywhere to skip.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fx = useParticles(canvasRef);
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const exit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    markSeen();
    setExiting(true);
    setTimeout(onDone, reduced ? 250 : EXIT_MS);
  };

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(exit, 1200);
      return () => clearTimeout(t);
    }
    const cx = () => innerWidth / 2;
    const cy = () => innerHeight * 0.42;
    const timers = [
      setTimeout(() => fx.embers(25), 150),
      setTimeout(() => {
        fx.sparks(cx(), cy(), 220, 1.2);
        fx.embers(40);
        navigator.vibrate?.(60);
      }, CLASH),
      ...[0, 1, 2, 3].map((i) =>
        setTimeout(() => fx.sparks(cx() + (i - 1.5) * Math.min(innerWidth * 0.2, 110), innerHeight * 0.5, 40, 0.6), LETTER_START + i * LETTER_GAP + 140),
      ),
      setTimeout(() => {
        fx.confetti(0, innerHeight, 90, 1);
        fx.confetti(innerWidth, innerHeight, 90, -1);
      }, CONFETTI),
      setTimeout(() => fx.embers(30), CONFETTI + 400),
    ];
    // `?intro=hold` keeps the splash on screen (for tweaking); otherwise it leaves by itself.
    if (new URLSearchParams(location.search).get('intro') !== 'hold') timers.push(setTimeout(exit, EXIT));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reduced) {
    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-ink transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-7xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-fire-1 via-fire-2 to-fire-3 bg-clip-text text-transparent">DUEL</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`splash fixed inset-0 z-[100] overflow-hidden bg-ink ${exiting ? 'splash-exit' : ''}`} onPointerDown={exit} role="presentation">
      <div className="splash-shake absolute inset-0">
        {/* spinning light rays */}
        <div className="splash-rays absolute left-1/2 top-[42%] h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,rgb(15_11_23/0.2)_30%,var(--color-ink)_75%)]" />

        {/* shockwaves */}
        <div className="splash-ring absolute left-1/2 top-[42%] h-40 w-40 rounded-full border-[6px] border-fire-1" />
        <div className="splash-ring absolute left-1/2 top-[42%] h-40 w-40 rounded-full border-[3px] border-me" style={{ animationDelay: `${CLASH + 120}ms` }} />

        {/* swords */}
        <div className="absolute left-1/2 top-[42%] h-0 w-0">
          <Sword className="splash-sword-l absolute h-[min(52vh,420px)] -translate-x-1/2 -translate-y-1/2" />
          <Sword className="splash-sword-r absolute h-[min(52vh,420px)] -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* title */}
        <div className="absolute inset-x-0 top-[50%] flex flex-col items-center">
          <div className="flex select-none text-[clamp(84px,26vw,190px)] font-black leading-none tracking-tight">
            {'DUEL'.split('').map((ch, i) => (
              <span key={i} className="splash-letter inline-block" style={{ animationDelay: `${LETTER_START + i * LETTER_GAP}ms, ${LETTER_START + 700}ms` }}>
                {ch}
              </span>
            ))}
          </div>
          <div className="splash-sub mt-2 text-center text-sm font-extrabold uppercase tracking-[0.35em] text-muted sm:text-base">
            <span className="text-me">tu</span> <span className="text-fire-2">vs</span> <span className="text-foe">oricine</span>
          </div>
          <div className="mt-6 flex gap-3">
            {DOMAIN_LIST.map((d, i) => (
              <div
                key={d.id}
                className={`splash-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} text-2xl shadow-lg`}
                style={{ animationDelay: `${ICONS + i * 90}ms`, ['--from-x' as string]: `${(i - 1.5) * 60}vw`, ['--from-y' as string]: i % 2 ? '60vh' : '-60vh' }}
              >
                {d.emoji}
              </div>
            ))}
          </div>
        </div>

        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="splash-flash pointer-events-none absolute inset-0 bg-white" />
        <div className="splash-hint absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] text-center text-xs font-bold uppercase tracking-[0.3em] text-muted">
          atinge ca să intri
        </div>
      </div>
    </div>
  );
}
