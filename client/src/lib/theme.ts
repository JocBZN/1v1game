/** Palette tokens for inline styles; the values live in index.css (@theme). */
export const C = {
  red: 'var(--color-red)',
  orange: 'var(--color-orange)',
  cyan: 'var(--color-cyan)',
  cream: 'var(--color-cream)',
  text: 'var(--color-text)',
  me: 'var(--color-me)',
  foe: 'var(--color-foe)',
  good: 'var(--color-good)',
  bad: 'var(--color-bad)',
  warn: 'var(--color-warn)',
  line: 'var(--color-line)',
  bg: 'var(--color-bg)',
  boardDark: 'var(--color-board-dark)',
  boardLight: 'var(--color-board-light)',
} as const;

/** `color` at `pct`% opacity (works with CSS variables). */
export const alpha = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Raw hex values (for canvas / three.js, which can't read CSS variables). */
export const HEX = {
  red: '#ff6973',
  orange: '#ffb0a3',
  cream: '#ffeecc',
  cyan: '#00b9be',
  text: '#46425e',
} as const;
