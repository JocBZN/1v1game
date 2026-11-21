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
            <div className="flag mt-3 animate-pop text-[8.5rem]">{item.data.flag}</div>
          </div>
        )
      }
    />
  );
}
