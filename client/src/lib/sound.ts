/**
 * Small, soft UI and game sounds, synthesised with Web Audio (no audio files to download).
 * Everything goes through one master gain kept low; the player can mute it (remembered per browser).
 */

export type SoundName =
  | 'tap' | 'correct' | 'okay' | 'wrong' | 'found' | 'roundWin' | 'roundLose' | 'roundTie' | 'win' | 'lose' | 'draw'
  | 'chessMove' | 'chessCapture' | 'chessCheck' | 'putt' | 'bounce' | 'hole' | 'cut' | 'cubeTurn' | 'pickUp' | 'drop';

const KEY = 'duel.sound';
const VOLUME = 0.22;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
})();
const listeners = new Set<(m: boolean) => void>();

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? 'off' : 'on');
  } catch {
    /* private mode */
  }
  if (master) master.gain.value = m ? 0 : VOLUME;
  listeners.forEach((f) => f(m));
}
export function onMutedChange(f: (m: boolean) => void) {
  listeners.add(f);
  return () => void listeners.delete(f);
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

/** A sine/triangle note with a soft attack and exponential release. */
function tone(freq: number, at: number, dur: number, opts: { type?: OscillatorType; gain?: number; slideTo?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + at;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
  const peak = opts.gain ?? 0.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** A short burst of filtered noise (wood knocks, swooshes). */
function noise(at: number, dur: number, opts: { freq?: number; q?: number; gain?: number; sweepTo?: number; type?: BiquadFilterType } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + at;
  const len = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
  const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const f = a.ctx.createBiquadFilter();
  f.type = opts.type ?? 'bandpass';
  f.frequency.setValueAtTime(opts.freq ?? 1800, t);
  if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + dur);
  f.Q.value = opts.q ?? 1.2;
  const g = a.ctx.createGain();
  g.gain.value = opts.gain ?? 0.6;
  src.connect(f).connect(g).connect(a.out);
  src.start(t);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, A4 = 440, F4 = 349.23, D5 = 587.33;

const SOUNDS: Record<SoundName, () => void> = {
  tap: () => { tone(880, 0, 0.05, { gain: 0.16, slideTo: 620 }); },
  correct: () => { tone(E5, 0, 0.12, { gain: 0.32 }); tone(G5 * 1.5, 0.07, 0.22, { gain: 0.26 }); },
  okay: () => { tone(D5, 0, 0.14, { gain: 0.24, type: 'triangle' }); },
  wrong: () => { tone(220, 0, 0.18, { gain: 0.3, type: 'triangle', slideTo: 165 }); },
  found: () => { noise(0, 0.25, { freq: 600, sweepTo: 3000, gain: 0.25 }); tone(C5, 0.12, 0.16, { gain: 0.22 }); tone(G5, 0.2, 0.24, { gain: 0.2 }); },
  roundWin: () => { tone(C5, 0, 0.12, { gain: 0.26 }); tone(E5, 0.08, 0.12, { gain: 0.26 }); tone(G5, 0.16, 0.28, { gain: 0.26 }); },
  roundLose: () => { tone(G5 / 1.5, 0, 0.16, { gain: 0.22, type: 'triangle' }); tone(F4, 0.12, 0.3, { gain: 0.22, type: 'triangle' }); },
  roundTie: () => { tone(A4, 0, 0.14, { gain: 0.2, type: 'triangle' }); tone(A4, 0.14, 0.18, { gain: 0.18, type: 'triangle' }); },
  win: () => { [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.09, i === 3 ? 0.5 : 0.16, { gain: 0.26 })); tone(C6 * 1.5, 0.3, 0.6, { gain: 0.08 }); },
  lose: () => { tone(E5 / 1.5, 0, 0.22, { gain: 0.22, type: 'triangle' }); tone(C5 / 1.5, 0.18, 0.22, { gain: 0.2, type: 'triangle' }); tone(A4 / 1.5, 0.36, 0.45, { gain: 0.18, type: 'triangle' }); },
  draw: () => { tone(C5, 0, 0.18, { gain: 0.2 }); tone(C5, 0.2, 0.3, { gain: 0.18 }); },
  // Chess: a wooden piece set down; captures are a sharper double knock; check adds a small ping.
  chessMove: () => { noise(0, 0.07, { freq: 1100, q: 2.5, gain: 0.7 }); tone(180, 0, 0.08, { gain: 0.3, slideTo: 120 }); },
  chessCapture: () => { noise(0, 0.05, { freq: 1500, q: 2.5, gain: 0.7 }); noise(0.05, 0.08, { freq: 900, q: 2.5, gain: 0.75 }); tone(150, 0.05, 0.1, { gain: 0.3, slideTo: 100 }); },
  chessCheck: () => { tone(1320, 0.03, 0.18, { gain: 0.14 }); },
  // Golf: club on ball, a tap off the wall, and the ball dropping into the cup.
  putt: () => { noise(0, 0.04, { freq: 2500, q: 3, gain: 0.55 }); tone(520, 0, 0.06, { gain: 0.18, slideTo: 300 }); },
  bounce: () => { noise(0, 0.03, { freq: 1800, q: 4, gain: 0.35 }); },
  hole: () => { [0, 0.07, 0.13].forEach((at, i) => tone(900 - i * 180, at, 0.07, { gain: 0.22, slideTo: 500 - i * 80 })); tone(G5, 0.22, 0.35, { gain: 0.22 }); tone(C6, 0.3, 0.45, { gain: 0.16 }); },
  cut: () => { noise(0, 0.16, { freq: 4000, sweepTo: 900, q: 0.8, gain: 0.35 }); },
  cubeTurn: () => { noise(0, 0.09, { freq: 700, sweepTo: 1600, q: 1.5, gain: 0.35 }); },
  pickUp: () => { tone(600, 0, 0.05, { gain: 0.12, slideTo: 760 }); },
  drop: () => { tone(560, 0, 0.06, { gain: 0.12, slideTo: 420 }); },
};

/** Play a sound (silently does nothing if muted, unsupported or blocked). */
export function play(name: SoundName) {
  if (muted) return;
  try {
    SOUNDS[name]();
  } catch {
    /* never break the game for a sound */
  }
}

/**
 * One soft click for every button press in the app (enabled buttons only). Game screens add their own
 * sounds on top for game events. Also unlocks audio on the first interaction (browser autoplay rules).
 */
export function installButtonSounds() {
  if (typeof document === 'undefined') return () => {};
  const onDown = (e: PointerEvent) => {
    audio();
    const el = (e.target as Element | null)?.closest('button, [role="button"], a.btn');
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[data-no-tap-sound]')) return;
    play('tap');
  };
  document.addEventListener('pointerdown', onDown, { capture: true });
  return () => document.removeEventListener('pointerdown', onDown, { capture: true });
}
