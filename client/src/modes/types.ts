import type { CurrentItem, Feedback } from '../state/duel';

/**
 * Contract for a domain's round UI. The server sends one item at a time (`item`) and the verdict
 * for each answer (`feedback`); the component only renders and calls `onAnswer`.
 */
export interface ModeProps<ItemData = any> {
  item: CurrentItem<ItemData> | null;
  /** Latest feedback; check `feedback.item === item.item` before using it for the current item. */
  feedback: Feedback | null;
  onAnswer: (answer: unknown) => void;
  /** Player finished the round and is waiting for the opponent. */
  waiting: boolean;
}
