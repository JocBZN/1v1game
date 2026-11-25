import { FlagImage } from '../components/Flag';
import { ChoiceRound } from './ChoiceRound';
import { WaitingNote } from './MathRound';
import type { ModeProps } from './types';

interface FlagItem {
  flag: string;
  options: string[];
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
            <div className="label">Whose flag is this?</div>
            <FlagImage key={item.item} flag={item.data.flag} className="mt-4 w-56 animate-pop" />
          </div>
        )
      }
    />
  );
}
