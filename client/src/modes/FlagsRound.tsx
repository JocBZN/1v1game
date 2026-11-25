import { FlagImage } from '../components/Flag';
import { Stars } from '../components/ui';
import { ChoiceRound } from './ChoiceRound';
import { WaitingNote } from './ItemHeader';
import type { ModeProps } from './types';

interface FlagItem {
  flag: string;
  options: string[];
  stars?: number;
  index: number;
  total: number;
}

export function FlagsRound({ item, feedback, onAnswer, waiting }: ModeProps<FlagItem>) {
  if (waiting) return <WaitingNote />;
  return (
    <ChoiceRound
      item={item}
      feedback={feedback}
      onAnswer={onAnswer}
      layout="grid"
      header={
        item && (
          <div className="flex flex-col items-center">
            <div className="label flex items-center gap-2">Whose flag is this? <Stars n={item.data.stars ?? 3} size={11} className="text-orange-strong" /></div>
            <FlagImage key={item.item} flag={item.data.flag} className="mt-4 w-56 animate-pop" />
          </div>
        )
      }
    />
  );
}
