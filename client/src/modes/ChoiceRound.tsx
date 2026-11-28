import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, X } from 'lucide-react';
import type { CurrentItem, Feedback } from '../state/duel';
import { SecondsLeft, TimerBar } from '../components/ui';
import { cn } from '../lib/cn';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Shared multiple-choice UI: per-question timer, 4 options, and clear right/wrong feedback that only
 * arrives from the server after answering.
 */
export function ChoiceRound({
  item, feedback, onAnswer, header, layout = 'list', compact = false,
}: {
  item: CurrentItem<{ options: string[]; index: number; total: number }> | null;
  feedback: Feedback | null;
  onAnswer: (answer: unknown) => void;
  header: ReactNode;
  layout?: 'list' | 'grid';
  /** tighter spacing, for questions with a big picture */
  compact?: boolean;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => setChosen(null), [item?.item, item?.round]);

  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = feedback && feedback.item === item.item && feedback.round === item.round ? feedback : null;
  const correctIndex = fb ? (fb.correctIndex as number) : null;
  const locked = chosen !== null || !!fb;

  return (
    <motion.div
      key={`${item.round}-${item.item}`}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="label">
          {item.data.index + 1} / {item.data.total}
        </span>
        {item.endsAt && !fb && <SecondsLeft endsAt={item.endsAt} className="text-sm font-bold" />}
        {fb && (
          <motion.span
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn('flex items-center gap-1 text-sm font-bold', fb.correct ? 'text-cyan-strong' : 'text-red')}
          >
            {fb.timeout ? <><Clock size={14} strokeWidth={2.6} /> Time’s up</> : fb.correct ? `+${fb.points}` : <><X size={14} strokeWidth={3} /> Wrong</>}
          </motion.span>
        )}
      </div>
      {item.endsAt && item.limitMs ? (fb ? <div className="h-2" /> : <TimerBar endsAt={item.endsAt} totalMs={item.limitMs} />) : null}

      <div className={cn('flex flex-1 flex-col justify-center', compact ? 'py-2' : 'py-4')}>{header}</div>

      <div className={layout === 'grid' ? 'grid grid-cols-2 gap-2.5 pb-2' : cn('grid pb-2', compact ? 'gap-2' : 'gap-2.5')}>
        {item.data.options.map((opt, i) => {
          const isCorrect = correctIndex === i;
          const isChosen = chosen === i || (fb?.chosen as number | null) === i;
          let cls = 'border-line bg-surface hover:border-line-strong hover:bg-white';
          let badge = 'bg-sunken text-muted';
          let anim = '';
          if (fb) {
            if (isCorrect) {
              cls = 'border-teal bg-cyan-soft';
              badge = 'bg-cyan text-[#46425e]';
              anim = isChosen ? 'animate-pop' : '';
            } else if (isChosen) {
              cls = 'border-red bg-red-soft';
              badge = 'bg-red text-cream';
              anim = 'animate-shake';
            } else {
              cls = 'border-line bg-surface opacity-45';
            }
          } else if (isChosen) {
            cls = 'border-text bg-white';
            badge = 'bg-text text-cream';
          }
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 320, damping: 26 }}
              whileTap={locked ? undefined : { y: 3 }}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                setChosen(i);
                onAnswer(i);
              }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-3 text-left text-[15px] leading-tight transition-colors disabled:cursor-default',
                compact ? 'min-h-12 py-2' : 'min-h-14 py-3',
                cls, anim, layout === 'grid' && 'justify-center text-center',
              )}
            >
              {layout === 'list' && (
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold', badge)}>
                  {fb && isCorrect ? <Check size={16} strokeWidth={3} /> : fb && isChosen ? <X size={16} strokeWidth={3} /> : LETTERS[i]}
                </span>
              )}
              <span className="font-semibold">{opt}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
