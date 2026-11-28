import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';
import { SecondsLeft, TimerBar } from '../components/ui';

type Input = { kind: 'log'; min: number; max: number; prefix?: string } | { kind: 'year'; min: number; max: number };
interface EstimateData {
  q: string;
  unit: string;
  input: Input;
  seconds: number;
  index: number;
  total: number;
  /** photo year game: the picture to date */
  img?: string;
  /** the next item's picture, loaded ahead */
  next?: string | null;
}

const GRACE_MS = 700;
const WORDS: [number, string][] = [[1e15, 'quadrillion'], [1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];

/** 2_500_000 → "2.5 million", 1234 → "1,234", 0.4 → "0.40". */
export function formatBig(n: number): string {
  if (n >= 1e18) return n.toExponential(1).replace('e+', ' × 10^');
  for (const [v, w] of WORDS) if (n >= v * 10 || (v >= 1e6 && n >= v)) return `${+(n / v).toPrecision(3)} ${w}`;
  if (n >= 100) return Math.round(n).toLocaleString('en-US');
  return n >= 1 ? `${+n.toPrecision(3)}` : n.toFixed(2);
}

/** "2.5m", "3k", "1.2 billion", "1e6", "1,200" → number. */
function parseBig(s: string): number | null {
  const t = s.trim().toLowerCase().replace(/[,$\s]/g, '');
  const m = t.match(/^(\d*\.?\d+(?:e\d+)?)(k|thousand|m|mil|million|b|bn|billion|t|trillion)?$/);
  if (!m) return null;
  const mult: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mil: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 };
  const n = parseFloat(m[1]) * (m[2] ? mult[m[2]] : 1);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Year slider: 0..1000. For ranges reaching into antiquity it is cubic, so recent years get most of
 * the travel (BC years are negative); a modern-only range (e.g. photos, 1830 onwards) is linear.
 */
const YEAR_STEPS = 1000;
const noZero = (y: number) => (y === 0 ? 1 : y);
const linear = (min: number) => min >= 1000;
function yearAt(pos: number, min: number, max: number) {
  if (linear(min)) return Math.round(min + ((max - min) * pos) / YEAR_STEPS);
  return noZero(Math.round(max - (max - min) * (1 - pos / YEAR_STEPS) ** 3));
}
function posOf(year: number, min: number, max: number) {
  if (linear(min)) return Math.round(((Math.max(min, Math.min(max, year)) - min) / (max - min)) * YEAR_STEPS);
  const f = 1 - Math.cbrt(Math.max(0, Math.min(1, (max - year) / (max - min))));
  return Math.round(f * YEAR_STEPS);
}
export const formatYear = (y: number) => (y < 0 ? `${-y} BC` : String(y));
/** "44 BC", "44bc", "-44", "1066", "79 AD" → year (negative for BC), or null. */
function parseYear(raw: string): number | null {
  const m = raw.trim().toLowerCase().match(/^(-?)\s*(\d{1,4})\s*(bc|bce|î\.?hr\.?|ad|ce|d\.?hr\.?)?$/);
  if (!m) return null;
  const n = Number(m[2]);
  if (!n) return null;
  return m[1] === '-' || (m[3] && /^(bc|bce|î)/.test(m[3])) ? -n : n;
}

export function EstimateRound({ item, feedback, onAnswer, waiting }: ModeProps<EstimateData>) {
  const input = item?.data.input;
  const start = (inp?: Input) => (!inp ? 0 : inp.kind === 'year' ? yearAt(YEAR_STEPS / 2, inp.min, inp.max) : Math.sqrt(inp.min * inp.max));
  const [value, setValue] = useState(() => start(input));
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  /** No number is shown (or sent) until the player moves the slider or types. */
  const [touched, setTouched] = useState(false);
  /** BC pressed before any year was chosen: applies to the next typed year. */
  const [bcPending, setBcPending] = useState(false);
  const touchedRef = useRef(false);
  const touch = () => {
    touchedRef.current = true;
    setTouched(true);
  };
  const valueRef = useRef(value);
  valueRef.current = value;
  const sentRef = useRef(false);

  useEffect(() => {
    const v = start(item?.data.input);
    setValue(v);
    setText(item?.data.input.kind === 'log' ? '' : '');
    setSent(false);
    sentRef.current = false;
    setTouched(false);
    setBcPending(false);
    touchedRef.current = false;
    if (!item?.endsAt) return;
    const t = setTimeout(() => submit(), Math.max(0, item.endsAt - GRACE_MS - performance.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.round, item?.item]);

  function submit() {
    if (sentRef.current) return;
    sentRef.current = true;
    setSent(true);
    // Nothing chosen when time ran out: send no number (0 points) rather than the slider's start.
    onAnswer(touchedRef.current ? valueRef.current : null);
  }

  usePreload(item?.data.next);
  if (waiting) return <WaitingNote />;
  if (!item || !input) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const locked = sent || !!fb;
  const shownEnd = item.endsAt ? item.endsAt - GRACE_MS : null;
  const prefix = input.kind === 'log' ? input.prefix ?? '' : '';
  const unit = item.data.unit && item.data.unit !== '$' ? ` ${item.data.unit}` : '';
  const show = (n: number) => (input.kind === 'year' ? formatYear(Math.round(n)) : `${prefix}${formatBig(n)}${unit}`);

  const answer = typeof fb?.answer === 'number' ? (fb.answer as number) : null;
  const guess = typeof fb?.guess === 'number' ? (fb.guess as number) : null;
  let off = '';
  if (answer !== null && guess !== null) {
    if (input.kind === 'year') off = guess === answer ? 'Exact year' : `${Math.abs(guess - answer)} year${Math.abs(guess - answer) === 1 ? '' : 's'} off`;
    else {
      const r = Math.max(guess / answer, answer / guess);
      off = r < 1.05 ? 'Spot on' : `${r < 10 ? r.toFixed(1) : Math.round(r)}× ${guess > answer ? 'too high' : 'too low'}`;
    }
  }

  const bcOn = touched ? value < 0 : bcPending;
  const logMin = input.kind === 'log' ? Math.log10(input.min) : 0;
  const logMax = input.kind === 'log' ? Math.log10(input.max) : 0;

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader item={item} fb={fb} hideTimer />
      {!fb && shownEnd && (
        <div className="-mt-1.5">
          <div className="mb-1 flex justify-end"><SecondsLeft endsAt={shownEnd} className="text-sm font-bold" /></div>
          <TimerBar endsAt={shownEnd} totalMs={item.data.seconds * 1000} />
        </div>
      )}

      {item.data.img ? (
        <>
          <Photo src={item.data.img} />
          <h2 className="mt-2 text-center text-base font-semibold tracking-tight">{item.data.q}</h2>
        </>
      ) : (
        <h2 className="mt-6 text-center text-2xl font-semibold leading-snug tracking-tight">{item.data.q}</h2>
      )}

      <div className={`${item.data.img ? 'mt-2' : 'mt-8'} text-center`}>
        <div className={`font-display ${item.data.img ? 'text-3xl' : 'text-4xl'} font-bold tabular-nums tracking-tight`}>
          {fb && guess !== null ? show(guess) : touched && !fb ? show(value) : <span className="text-muted/50">?</span>}
        </div>
        {!touched && !fb && !item.data.img && <div className="mt-1 text-sm text-muted">Move the slider or type your answer</div>}
        {answer !== null && (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
            <div className="label">Answer</div>
            <div className="font-display text-2xl font-bold text-teal">{show(answer)}</div>
            {off && <div className="mt-0.5 text-sm font-semibold text-muted">{off}</div>}
            {typeof fb?.note === 'string' && <div className="mt-1 text-xs text-muted">{fb.note as string}</div>}
            {isCredit(fb?.credit) && (
              <a href={fb.credit.url} target="_blank" rel="noopener" className="mt-1 block text-[11px] text-muted/80 underline-offset-2 hover:underline">
                Photo: {fb.credit.text} · Wikimedia Commons
              </a>
            )}
          </div>
        )}
      </div>

      {!fb && (
        <div className={item.data.img ? 'mt-3' : 'mt-8'}>
          {input.kind === 'year' ? (
            <>
              <div className="flex items-center gap-3">
                <button className="btn btn-secondary h-11 w-11 p-0" disabled={locked} onClick={() => { touch(); setValue((v) => Math.max(input.min, noZero(v - 1 === 0 ? -1 : v - 1))); setText(''); }} aria-label="One year earlier"><Minus size={18} /></button>
                <input
                  type="range" min={0} max={YEAR_STEPS} step={1} value={posOf(value, input.min, input.max)} disabled={locked}
                  onChange={(e) => { touch(); setValue(yearAt(Number(e.target.value), input.min, input.max)); setText(''); }}
                  className="color-slider h-3 flex-1 cursor-pointer appearance-none rounded-full bg-sunken"
                />
                <button className="btn btn-secondary h-11 w-11 p-0" disabled={locked} onClick={() => { touch(); setValue((v) => Math.min(input.max, v + 1 === 0 ? 1 : v + 1)); setText(''); }} aria-label="One year later"><Plus size={18} /></button>
              </div>
              <div className={`${item.data.img ? 'mt-0' : 'mt-1'} flex justify-between text-[11px] text-muted`}><span>{formatYear(input.min)}</span><span>{formatYear(input.max)}</span></div>
              <div className={`${item.data.img ? 'mt-2' : 'mt-4'} flex gap-2`}>
                <input
                  inputMode="numeric" placeholder={input.min > 0 ? 'or type it: 1975…' : 'or type it: 1066, 44 BC…'} value={text} disabled={locked}
                  onChange={(e) => {
                    setText(e.target.value);
                    const y = parseYear(e.target.value);
                    if (y !== null) touch();
                    if (y !== null) setValue(Math.max(input.min, Math.min(input.max, bcOn && !/[a-z-]/i.test(e.target.value) ? -y : y)));
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-center text-base font-medium outline-none placeholder:text-muted/60 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
                />
                {input.min < 0 && <button
                  type="button"
                  disabled={locked}
                  aria-pressed={bcOn}
                  onClick={() => {
                    if (!touched) return setBcPending((b) => !b);
                    setValue((v) => Math.max(input.min, Math.min(input.max, -v)));
                  }}
                  className={`shrink-0 rounded-2xl border px-4 text-sm font-bold transition ${bcOn ? 'border-teal bg-teal text-cream' : 'border-line bg-surface text-muted'}`}
                  title="Before Christ"
                >
                  BC
                </button>}
              </div>
            </>
          ) : (
            <>
              <input
                type="range" min={logMin} max={logMax} step={0.01} value={Math.log10(value)} disabled={locked}
                onChange={(e) => {
                  touch();
                  setValue(+(10 ** Number(e.target.value)).toPrecision(2));
                  setText('');
                }}
                className="color-slider h-3 w-full cursor-pointer appearance-none rounded-full bg-sunken"
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{prefix}{formatBig(input.min)}</span><span>{prefix}{formatBig(input.max)}</span></div>
              <input
                inputMode="decimal" placeholder="or type it: 2.5m, 40k, 3 billion…" value={text} disabled={locked}
                onChange={(e) => {
                  setText(e.target.value);
                  const n = parseBig(e.target.value);
                  if (n !== null) {
                    touch();
                    setValue(n);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="mt-4 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-center text-base font-medium outline-none placeholder:text-muted/60 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
              />
            </>
          )}
        </div>
      )}

      <button onClick={submit} disabled={locked || !touched} className={`btn btn-primary mt-auto w-full ${item.data.img ? 'mt-3 py-3' : 'py-3.5'}`}>
        {fb ? `+${fb.points}` : sent ? 'Checking…' : 'Lock in'}
      </button>
    </div>
  );
}

export const isCredit = (x: unknown): x is { text: string; url: string } =>
  !!x && typeof x === 'object' && typeof (x as { text?: unknown }).text === 'string' && typeof (x as { url?: unknown }).url === 'string';

/** The photo to date: fits the screen whatever its shape; a soft placeholder while it loads. */
export function Photo({ src, className = 'h-[27vh] min-h-40 sm:h-[38vh]' }: { src: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);
  return (
    <div className={`relative mt-3 flex items-center justify-center overflow-hidden rounded-2xl bg-sunken ${className}`}>
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-sunken" />}
      {failed ? (
        <span className="text-sm text-muted">The photo didn’t load. Take your best guess.</span>
      ) : (
        <img
          key={src}
          src={src}
          alt="A photo to date"
          referrerPolicy="no-referrer"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`max-h-full max-w-full select-none object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}

/** Start downloading a picture before it is shown (the next item's photo). */
export function usePreload(src: string | null | undefined) {
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }, [src]);
}
