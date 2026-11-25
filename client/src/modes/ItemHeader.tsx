import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import type { CurrentItem, Feedback } from '../state/duel';
import { SecondsLeft, TimerBar } from '../components/ui';
import { cn } from '../lib/cn';

/** "2 / 5", the item timer, and the server's verdict once it arrives. */
export function ItemHeader({ item, fb, result, hideTimer }: {
  item: CurrentItem<{ index: number; total: number }>;
  fb: Feedback | null;
  /** what to show once the item is scored (defaults to +points) */
  result?: ReactNode;
  hideTimer?: boolean;
}) {
  const showTimer = !fb?.itemDone && !hideTimer;
  return (
    <>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="label">{item.data.index + 1} / {item.data.total}</span>
        {item.endsAt && showTimer && <SecondsLeft endsAt={item.endsAt} className="text-sm font-bold" />}
        {fb?.itemDone && (
          <motion.span
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn('flex items-center gap-1 text-sm font-bold', fb.points > 0 ? 'text-teal' : 'text-red')}
          >
            {fb.timeout ? <><Clock size={14} strokeWidth={2.4} /> Time’s up</> : result ?? `+${fb.points}`}
          </motion.span>
        )}
      </div>
      {item.endsAt && item.limitMs && showTimer ? <TimerBar endsAt={item.endsAt} totalMs={item.limitMs} /> : <div className="h-1.5" />}
    </>
  );
}

/** Feedback for the current item only. */
export const currentFeedback = (item: CurrentItem | null, feedback: Feedback | null) =>
  item && feedback && feedback.item === item.item && feedback.round === item.round ? feedback : null;

export function WaitingNote() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-teal" />
      <div className="mt-5 text-lg font-semibold">Round finished</div>
      <div className="mt-1 text-sm text-muted">Waiting for your opponent…</div>
    </div>
  );
}
