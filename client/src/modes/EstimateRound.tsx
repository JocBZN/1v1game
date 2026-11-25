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

export function EstimateRound({ item, feedback, onAnswer, waiting }: ModeProps<EstimateData>) {
  const input = item?.data.input;
  const start = (inp?: Input) => (!inp ? 0 : inp.kind === 'year' ? 2003 : Math.sqrt(inp.min * inp.max));
  const [value, setValue] = useState(() => start(input));
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const sentRef = useRef(false);

  useEffect(() => {
    const v = start(item?.data.input);
    setValue(v);
    setText(item?.data.input.kind === 'log' ? '' : '');
    setSent(false);
    sentRef.current = false;
    if (!item?.endsAt) return;
    const t = setTimeout(() => submit(), Math.max(0, item.endsAt - GRACE_MS - performance.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.round, item?.item]);

  function submit() {
    if (sentRef.current) return;
    sentRef.current = true;
    setSent(true);
    onAnswer(valueRef.current);
  }

  if (waiting) return <WaitingNote />;
  if (!item || !input) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const locked = sent || !!fb;
  const shownEnd = item.endsAt ? item.endsAt - GRACE_MS : null;
  const prefix = input.kind === 'log' ? input.prefix ?? '' : '';
  const unit = item.data.unit && item.data.unit !== '$' ? ` ${item.data.unit}` : '';
  const show = (n: number) => (input.kind === 'year' ? String(Math.round(n)) : `${prefix}${formatBig(n)}${unit}`);

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

      <h2 className="mt-6 text-center text-2xl font-semibold leading-snug tracking-tight">{item.data.q}</h2>

      <div className="mt-8 text-center">
        <div className="font-display text-4xl font-bold tabular-nums tracking-tight">{show(fb && guess !== null ? guess : value)}</div>
        {answer !== null && (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
            <div className="label">Answer</div>
            <div className="font-display text-2xl font-bold text-teal">{show(answer)}</div>
            {off && <div className="mt-0.5 text-sm font-semibold text-muted">{off}</div>}
            {typeof fb?.note === 'string' && <div className="mt-1 text-xs text-muted">{fb.note as string}</div>}
          </div>
        )}
      </div>

      {!fb && (
        <div className="mt-8">
          {input.kind === 'year' ? (
            <div className="flex items-center gap-3">
              <button className="btn btn-secondary h-11 w-11 p-0" disabled={locked} onClick={() => setValue((v) => Math.max(input.min, v - 1))} aria-label="One year earlier"><Minus size={18} /></button>
              <input
                type="range" min={input.min} max={input.max} step={1} value={value} disabled={locked}
                onChange={(e) => setValue(Number(e.target.value))}
                className="color-slider h-3 flex-1 cursor-pointer appearance-none rounded-full bg-sunken"
              />
              <button className="btn btn-secondary h-11 w-11 p-0" disabled={locked} onClick={() => setValue((v) => Math.min(input.max, v + 1))} aria-label="One year later"><Plus size={18} /></button>
            </div>
          ) : (
            <>
              <input
                type="range" min={logMin} max={logMax} step={0.01} value={Math.log10(value)} disabled={locked}
                onChange={(e) => {
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
                  if (n !== null) setValue(n);
                }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="mt-4 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-center text-base font-medium outline-none placeholder:text-muted/60 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
              />
            </>
          )}
        </div>
      )}

      <button onClick={submit} disabled={locked} className="btn btn-primary mt-auto w-full py-3.5">
        {fb ? `+${fb.points}` : sent ? 'Checking…' : 'Lock in'}
      </button>
    </div>
  );
}
