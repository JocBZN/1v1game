import { ChoiceRound } from './ChoiceRound';
import { WaitingNote } from './ItemHeader';
import { Stars } from '../components/ui';
import type { ModeProps } from './types';

interface TriviaItem {
  q: string;
  options: string[];
  category: string;
  difficulty: number;
  stars?: number;
  index: number;
  total: number;
}

export function TriviaRound({ item, feedback, onAnswer, waiting }: ModeProps<TriviaItem>) {
  if (waiting) return <WaitingNote />;
  return (
    <ChoiceRound
      item={item}
      feedback={feedback}
      onAnswer={onAnswer}
      header={
        item && (
          <div className="text-center">
            <div className="chip mb-4 bg-orange-soft text-orange-strong">
              {item.data.category}
              <Stars n={item.data.stars ?? item.data.difficulty + 1} size={12} />
            </div>
            <h2 className="text-2xl font-semibold leading-snug tracking-tight">{item.data.q}</h2>
          </div>
        )
      }
    />
  );
}
