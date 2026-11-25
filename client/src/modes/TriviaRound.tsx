import { ChoiceRound } from './ChoiceRound';
import { WaitingNote } from './ItemHeader';
import type { ModeProps } from './types';

interface TriviaItem {
  q: string;
  options: string[];
  category: string;
  difficulty: number;
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
              <span className="flex gap-0.5" title={`Difficulty ${item.data.difficulty}/3`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= item.data.difficulty ? 'bg-orange-strong' : 'bg-orange-strong/25'}`} />
                ))}
              </span>
            </div>
            <h2 className="text-2xl font-semibold leading-snug tracking-tight">{item.data.q}</h2>
          </div>
        )
      }
    />
  );
}
