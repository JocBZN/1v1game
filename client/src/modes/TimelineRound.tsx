import { useEffect, useRef, useState } from 'react';
import { Reorder } from 'motion/react';
import { GripVertical } from 'lucide-react';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';
import { cn } from '../lib/cn';

interface TimelineData {
  labels: string[];
  index: number;
  total: number;
}

export function TimelineRound({ item, feedback, onAnswer, waiting }: ModeProps<TimelineData>) {
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3]);
  const [sent, setSent] = useState(false);
  const orderRef = useRef(order);
  orderRef.current = order;
  const sentRef = useRef(false);

  useEffect(() => {
    const n = item?.data.labels.length ?? 4;
    setOrder(Array.from({ length: n }, (_, i) => i));
    setSent(false);
    sentRef.current = false;
    if (!item?.endsAt) return;
    // Lock in the current order just before the buzzer, so a nearly-done answer still counts.
    const t = setTimeout(() => submit(), Math.max(0, item.endsAt - 400 - performance.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.round, item?.item]);

  function submit() {
    if (sentRef.current) return;
    sentRef.current = true;
    setSent(true);
    onAnswer(orderRef.current);
  }

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const fb = currentFeedback(item, feedback);
  const years = Array.isArray(fb?.years) ? (fb!.years as number[]) : null;
  const sorted = years ? [...years.keys()].sort((a, b) => years[a] - years[b]) : null;
  const locked = sent || !!fb;

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader item={item} fb={fb} />
      <p className="mt-4 text-center text-sm text-muted">Oldest at the top, newest at the bottom</p>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span>Oldest</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Reorder.Group axis="y" values={order} onReorder={locked ? () => {} : setOrder} className="my-2 grid gap-2.5">
        {order.map((idx, pos) => {
          const right = sorted ? sorted[pos] === idx : null;
          return (
            <Reorder.Item
              key={idx}
              value={idx}
              dragListener={!locked}
              className={cn(
                'flex min-h-16 touch-none select-none items-center gap-3 rounded-2xl border bg-surface px-3 py-3',
                locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                right === true && 'border-teal bg-cyan-soft',
                right === false && 'border-red bg-red-soft',
                right === null && 'border-line',
              )}
            >
              <GripVertical size={18} className="shrink-0 text-muted" />
              <span className="flex-1 text-[15px] font-semibold leading-tight">{item.data.labels[idx]}</span>
              {years && <span className="font-display text-lg font-bold tabular-nums">{years[idx]}</span>}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-line" />
        <span>Newest</span>
      </div>

      <button onClick={submit} disabled={locked} className="btn btn-primary mt-auto w-full py-3.5">
        {fb ? `+${fb.points}` : sent ? 'Checking…' : 'Lock in'}
      </button>
    </div>
  );
}
