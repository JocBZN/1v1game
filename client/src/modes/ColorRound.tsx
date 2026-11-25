import { useEffect, useRef, useState } from 'react';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';
import { SecondsLeft, TimerBar } from '../components/ui';

interface ColorData {
  rgb: [number, number, number];
  seconds: number;
  index: number;
  total: number;
}

const GRACE_MS = 700; // the server allows a little extra; the player sees the plain 15 s
const css = (c: readonly number[]) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
const hex = (c: readonly number[]) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

const CHANNELS = [
  { label: 'Red', track: (c: number[]) => `linear-gradient(90deg, ${css([0, c[1], c[2]])}, ${css([255, c[1], c[2]])})` },
  { label: 'Green', track: (c: number[]) => `linear-gradient(90deg, ${css([c[0], 0, c[2]])}, ${css([c[0], 255, c[2]])})` },
  { label: 'Blue', track: (c: number[]) => `linear-gradient(90deg, ${css([c[0], c[1], 0])}, ${css([c[0], c[1], 255])})` },
];

export function ColorRound({ item, feedback, onAnswer, waiting }: ModeProps<ColorData>) {
  const [rgb, setRgb] = useState<number[]>([128, 128, 128]);
  const [sent, setSent] = useState(false);
  const rgbRef = useRef(rgb);
  rgbRef.current = rgb;
  const sentRef = useRef(false);

  useEffect(() => {
    setRgb([128, 128, 128]);
    setSent(false);
    sentRef.current = false;
    if (!item?.endsAt) return;
    // Auto-submit whatever is set when the visible 15 s run out.
    const t = setTimeout(() => submit(), Math.max(0, item.endsAt - GRACE_MS - performance.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.round, item?.item]);

  function submit() {
    if (sentRef.current) return;
    sentRef.current = true;
    setSent(true);
    onAnswer(rgbRef.current.map((v) => Math.round(v)));
  }

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const target = item.data.rgb;
  const shownEnd = item.endsAt ? item.endsAt - GRACE_MS : null;
  const match = typeof fb?.match === 'number' ? (fb.match as number) : null;

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader item={item} fb={fb} hideTimer result={match !== null ? `${match}% match` : undefined} />
      {!fb && shownEnd && (
        <div className="-mt-1.5">
          <div className="mb-1 flex justify-end"><SecondsLeft endsAt={shownEnd} className="text-sm font-bold" /></div>
          <TimerBar endsAt={shownEnd} totalMs={item.data.seconds * 1000} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-line">
        <div className="flex h-36 items-end p-3" style={{ background: css(target) }}>
          <span className="rounded-md bg-white/85 px-2 py-0.5 text-xs font-semibold text-slate">Target{fb ? ` ${hex(target)}` : ''}</span>
        </div>
        <div className="flex h-36 items-end p-3" style={{ background: css(rgb) }}>
          <span className="rounded-md bg-white/85 px-2 py-0.5 text-xs font-semibold text-slate">You {hex(rgb.map(Math.round))}</span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {CHANNELS.map((ch, i) => (
          <label key={ch.label} className="block">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted">
              <span>{ch.label}</span>
              <span className="tabular-nums text-text">{Math.round(rgb[i])}</span>
            </div>
            <input
              type="range"
              min={0}
              max={255}
              value={rgb[i]}
              disabled={sent || !!fb}
              onChange={(e) => setRgb((c) => c.map((v, k) => (k === i ? Number(e.target.value) : v)))}
              className="color-slider h-3 w-full cursor-pointer appearance-none rounded-full"
              style={{ background: ch.track(rgb) }}
            />
          </label>
        ))}
      </div>

      <button onClick={submit} disabled={sent || !!fb} className="btn btn-primary mt-auto w-full py-3.5">
        {fb ? (match !== null ? `${match}% match · +${fb.points}` : 'Time’s up') : sent ? 'Checking…' : 'Lock in'}
      </button>
    </div>
  );
}
