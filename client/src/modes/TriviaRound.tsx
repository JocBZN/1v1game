import { ChoiceRound } from './ChoiceRound';
import { WaitingNote } from './MathRound';
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
      accent="#c084fc"
      header={
        item && (
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">
              {item.data.category}
              <span className="tracking-tighter" title={`Dificultate ${item.data.difficulty}/3`}>
                <span className="text-amber-300">{'★'.repeat(item.data.difficulty)}</span>
                <span className="text-violet-300/30">{'★'.repeat(3 - item.data.difficulty)}</span>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold leading-snug">{item.data.q}</h2>
          </div>
        )
      }
    />
  );
}
