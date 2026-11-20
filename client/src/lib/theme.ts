/** Palette tokens for inline styles; the values live in index.css (@theme). */
export const C = {
  me: 'var(--color-me)',
  foe: 'var(--color-foe)',
  good: 'var(--color-good)',
  bad: 'var(--color-bad)',
  gold: 'var(--color-gold)',
  line: 'var(--color-line)',
  boardDark: 'var(--color-board-dark)',
  boardLight: 'var(--color-board-light)',
} as const;

/** `color` at `pct`% opacity (works with CSS variables). */
export const alpha = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Main action gradient (amber → orange → coral). */
export const FIRE = 'bg-gradient-to-br from-fire-1 via-fire-2 to-fire-3';
