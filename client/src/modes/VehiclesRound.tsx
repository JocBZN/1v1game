import { Stars } from '../components/ui';
import { ChoiceRound } from './ChoiceRound';
import { EstimateRound, Photo, isCredit } from './EstimateRound';
import { WaitingNote, currentFeedback } from './ItemHeader';
import type { ModeProps } from './types';

interface VehicleData {
  kind: 'choice' | 'price';
  q: string;
  img: string;
  options: string[];
  stars?: number;
  index: number;
  total: number;
}

/** A photo of a vehicle and either 4 names to choose from or (now and then) a price slider. */
export function VehiclesRound(props: ModeProps<VehicleData>) {
  const { item, feedback, onAnswer, waiting } = props;
  if (waiting) return <WaitingNote />;
  // Price questions use the estimate UI (photo + slider).
  if (item?.data.kind === 'price') return <EstimateRound {...(props as unknown as Parameters<typeof EstimateRound>[0])} />;
  const fb = item ? currentFeedback(item, feedback) : null;
  return (
    <ChoiceRound
      item={item}
      feedback={feedback}
      onAnswer={onAnswer}
      compact
      header={
        item && (
          <div className="-mt-2 flex flex-col">
            <div className="label flex items-center justify-center gap-2">{item.data.q} <Stars n={item.data.stars ?? 3} size={11} className="text-orange-strong" /></div>
            <Photo src={item.data.img} className="h-[24vh] min-h-36 sm:h-[34vh]" />
            <div className="mt-1 h-4 text-center">
              {fb && isCredit(fb.credit) && (
                <a href={fb.credit.url} target="_blank" rel="noopener" className="text-[11px] text-muted/80 underline-offset-2 hover:underline">
                  Photo: {fb.credit.text} · Wikimedia Commons
                </a>
              )}
            </div>
          </div>
        )
      }
    />
  );
}
