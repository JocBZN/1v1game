import { useEffect, useState, type ReactNode } from 'react';
import type { CurrentItem, Feedback } from '../state/duel';
import { SecondsLeft, TimerBar } from '../components/ui';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Shared multiple-choice UI: per-question timer, 4 options, and clear right/wrong feedback that only
 * arrives from the server after answering.
 */
export function ChoiceRound({
  item, feedback, onAnswer, header, layout = 'list',
}: {
  item: CurrentItem<{ options: string[]; index: number; total: number }> | null;
  feedback: Feedback | null;
  onAnswer: (answer: unknown) => void;
  header: ReactNode;
  layout?: 'list' | 'grid';
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => setChosen(null), [item?.item, item?.round]);

  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = feedback && feedback.item === item.item && feedback.round === item.round ? feedback : null;
  const correctIndex = fb ? (fb.correctIndex as number) : null;
  const locked = chosen !== null || !!fb;

  return (
    <div key={`${item.round}-${item.item}`} className="flex flex-1 flex-col animate-rise">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="label">
          {item.data.index + 1} / {item.data.total}
        </span>
        {item.endsAt && !fb && <SecondsLeft endsAt={item.endsAt} className="text-sm font-semibold" />}
        {fb && (
          <span className={`text-sm font-semibold ${fb.correct ? 'text-cyan-strong' : 'text-red'} animate-pop`}>
            {fb.timeout ? 'Time’s up' : fb.correct ? `+${fb.points}` : 'Wrong'}
          </span>
        )}
      </div>
      {item.endsAt && item.limitMs ? (fb ? <div className="h-1.5" /> : <TimerBar endsAt={item.endsAt} totalMs={item.limitMs} />) : null}

      <div className="flex flex-1 flex-col justify-center py-4">{header}</div>

      <div className={layout === 'grid' ? 'grid grid-cols-2 gap-2.5 pb-2' : 'grid gap-2 pb-2'}>
        {item.data.options.map((opt, i) => {
          const isCorrect = correctIndex === i;
          const isChosen = chosen === i || (fb?.chosen as number | null) === i;
          let cls = 'border-line bg-surface hover:border-line-strong hover:bg-sunken';
          let badge = 'bg-sunken text-muted';
          let anim = '';
          if (fb) {
            if (isCorrect) {
              cls = 'border-cyan bg-cyan-soft';
              badge = 'bg-cyan text-text';
              anim = isChosen ? 'animate-pop' : '';
            } else if (isChosen) {
              cls = 'border-red bg-red-soft';
              badge = 'bg-red text-cream';
              anim = 'animate-shake';
            } else {
              cls = 'border-line bg-surface opacity-45';
            }
          } else if (isChosen) {
            cls = 'border-text bg-surface';
            badge = 'bg-text text-cream';
          }
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                setChosen(i);
                onAnswer(i);
              }}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-3 text-left text-[15px] leading-tight transition-colors disabled:cursor-default ${cls} ${anim} ${
                layout === 'grid' ? 'justify-center text-center' : ''
              }`}
            >
              {layout === 'list' && (
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badge}`}>
                  {fb && isCorrect ? '✓' : fb && isChosen ? '✕' : LETTERS[i]}
                </span>
              )}
              <span className="font-medium">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
