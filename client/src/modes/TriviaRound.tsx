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
      accent="#b18cff"
      header={
        item && (
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#b18cff]/15 px-3 py-1 text-xs font-bold text-[#cdb4ff]">
              {item.data.category}
              <span className="tracking-tighter" title={`Dificultate ${item.data.difficulty}/3`}>
                <span className="text-gold">{'★'.repeat(item.data.difficulty)}</span>
                <span className="text-[#cdb4ff]/30">{'★'.repeat(3 - item.data.difficulty)}</span>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold leading-snug">{item.data.q}</h2>
          </div>
        )
      }
    />
  );
}
