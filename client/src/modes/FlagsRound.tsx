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
      accent="#5cc8ff"
      header={
        item && (
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold uppercase tracking-widest text-muted">Al cui e steagul?</div>
            <div className="flag mt-3 animate-pop text-[8.5rem] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{item.data.flag}</div>
          </div>
        )
      }
    />
  );
}
