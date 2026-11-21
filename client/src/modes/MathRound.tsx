import { useEffect, useRef, useState } from 'react';
import type { ModeProps } from './types';

interface MathItem {
  prompt: string;
  tier: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'];

export function MathRound({ item, feedback, onAnswer, waiting }: ModeProps<MathItem>) {
  const [value, setValue] = useState('');
  const [flash, setFlash] = useState<{ ok: boolean; seq: number; text: string } | null>(null);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // New problem → clear the input.
  useEffect(() => {
    setValue('');
    inputRef.current?.focus({ preventScroll: true });
  }, [item?.item]);

  useEffect(() => {
    if (!feedback) return;
    setFlash({
      ok: feedback.correct,
      seq: feedback.seq,
      text: feedback.correct ? `+${feedback.points}` : `${feedback.points}  (=${feedback.correctAnswer as number})`,
    });
    setStreak((s) => (feedback.correct ? s + 1 : 0));
  }, [feedback?.seq]);

  function submit() {
    if (!item || value === '' || value === '-') return;
    onAnswer(Number(value));
    setValue('');
  }

  function press(k: string) {
    if (k === '⌫') setValue((v) => v.slice(0, -1));
    else if (k === '−') setValue((v) => (v.startsWith('-') ? v.slice(1) : '-' + v));
    else setValue((v) => (v.replace('-', '').length >= 6 ? v : v + k));
  }

  if (waiting) return <WaitingNote />;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex flex-1 flex-col items-center justify-center">
        {streak >= 3 && <div className="chip mb-3 bg-orange-soft text-orange-strong animate-pop">{streak} in a row</div>}
        <div key={item?.item} className="text-5xl font-bold tabular-nums tracking-tight animate-rise sm:text-6xl">
          {item?.data.prompt ?? '…'}
        </div>
        <div
          className={`mt-6 flex h-16 min-w-48 items-center justify-center rounded-2xl border bg-surface px-6 text-4xl font-semibold tabular-nums transition-colors ${
            flash && !flash.ok ? 'border-red' : 'border-line'
          }`}
        >
          {value || <span className="text-muted/40">?</span>}
        </div>
        {flash && (
          <div key={flash.seq} className={`float-up absolute bottom-2 text-xl font-semibold ${flash.ok ? 'text-cyan-strong' : 'text-red'}`}>
            {flash.text}
          </div>
        )}
        {/* Hidden input so a physical keyboard works on desktop */}
        <input
          ref={inputRef}
          inputMode="none"
          className="absolute h-0 w-0 opacity-0"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9-]/g, '').slice(0, 7))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          onBlur={() => setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0)}
          aria-label="Answer"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pb-2">
        {KEYS.map((k) => (
          <button
            key={k}
            onPointerDown={(e) => {
              e.preventDefault();
              press(k);
            }}
            className={`btn btn-secondary h-14 text-2xl font-medium ${k === '−' || k === '⌫' ? 'text-muted' : ''}`}
          >
            {k}
          </button>
        ))}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            submit();
          }}
          className="btn btn-primary col-span-3 h-14 text-lg"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function WaitingNote() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-cyan" />
      <div className="mt-5 text-lg font-semibold">Round finished</div>
      <div className="mt-1 text-sm text-muted">Waiting for your opponent…</div>
    </div>
  );
}
