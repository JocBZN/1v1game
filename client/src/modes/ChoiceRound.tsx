import { useEffect, useState, type ReactNode } from 'react';
import type { CurrentItem, Feedback } from '../state/duel';
import { SecondsLeft, TimerBar } from '../components/ui';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Shared multiple-choice UI: per-question timer, 4 options, and clear right/wrong feedback that only
 * arrives from the server after answering.
 */
export function ChoiceRound({
  item, feedback, onAnswer, header, layout = 'list', accent,
}: {
  item: CurrentItem<{ options: string[]; index: number; total: number }> | null;
  feedback: Feedback | null;
  onAnswer: (answer: unknown) => void;
  header: ReactNode;
  layout?: 'list' | 'grid';
  accent: string;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => setChosen(null), [item?.item, item?.round]);

  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = feedback && feedback.item === item.item && feedback.round === item.round ? feedback : null;
  const correctIndex = fb ? (fb.correctIndex as number) : null;
  const locked = chosen !== null || !!fb;

  return (
    <div key={`${item.round}-${item.item}`} className="flex flex-1 flex-col animate-rise">
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted">
        <span>
          {item.data.index + 1} / {item.data.total}
        </span>
        {item.endsAt && !fb && <SecondsLeft endsAt={item.endsAt} className="text-base normal-case text-white" />}
        {fb && (
          <span className={`text-base ${fb.correct ? 'text-good' : 'text-bad'} animate-pop`}>
            {fb.timeout ? 'Timp expirat!' : fb.correct ? `+${fb.points}` : 'Greșit'}
          </span>
        )}
      </div>
      {item.endsAt && item.limitMs ? (
        fb ? <div className="h-2.5" /> : <TimerBar endsAt={item.endsAt} totalMs={item.limitMs} />
      ) : null}

      <div className="flex flex-1 flex-col justify-center py-4">{header}</div>

      <div className={layout === 'grid' ? 'grid grid-cols-2 gap-3 pb-2' : 'grid gap-2.5 pb-2'}>
        {item.data.options.map((opt, i) => {
          const isCorrect = correctIndex === i;
          const isChosen = chosen === i || (fb?.chosen as number | null) === i;
          let cls = 'bg-panel-2 border-line text-white';
          let anim = '';
          if (fb) {
            if (isCorrect) {
              cls = 'bg-good/20 border-good text-white';
              anim = isChosen ? 'animate-pop' : '';
            } else if (isChosen) {
              cls = 'bg-bad/20 border-bad text-white';
              anim = 'animate-shake';
            } else cls = 'bg-panel-2/50 border-line text-white/40';
          } else if (isChosen) cls = 'border-white/60 bg-panel-2 text-white';
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                setChosen(i);
                onAnswer(i);
              }}
              className={`btn-game flex min-h-14 items-center gap-3 border-2 px-3 py-3 text-left text-base leading-tight ${cls} ${anim} ${layout === 'grid' ? 'justify-center text-center' : ''}`}
              style={!fb && !isChosen ? { borderColor: undefined } : undefined}
            >
              {layout === 'list' && (
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black text-ink"
                  style={{ background: fb ? (isCorrect ? 'var(--color-good)' : isChosen ? 'var(--color-bad)' : 'var(--color-line)') : accent }}
                >
                  {fb && isCorrect ? '✓' : fb && isChosen ? '✗' : LETTERS[i]}
                </span>
              )}
              <span className="font-bold">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
