export type DomainId = 'trivia' | 'chess' | 'math' | 'flags';

export interface DomainMeta {
  id: DomainId;
  name: string;
  short: string;
  emoji: string;
  /** Tailwind gradient classes */
  gradient: string;
  /** Solid accent (hex) */
  color: string;
  tagline: string;
}

export const DOMAINS: Record<DomainId, DomainMeta> = {
  trivia: {
    id: 'trivia', name: 'Cultură generală', short: 'Cultură', emoji: '🧠',
    gradient: 'from-violet-500 to-fuchsia-500', color: '#a855f7', tagline: '5 întrebări · 10 secunde fiecare',
  },
  chess: {
    id: 'chess', name: 'Puzzle șah', short: 'Șah', emoji: '♞',
    gradient: 'from-emerald-400 to-teal-600', color: '#10b981', tagline: '90 de secunde · o greșeală = puzzle pierdut',
  },
  math: {
    id: 'math', name: 'Calcul mental', short: 'Calcul', emoji: '🧮',
    gradient: 'from-amber-400 to-orange-500', color: '#f59e0b', tagline: '60 de secunde · cât de repede poți',
  },
  flags: {
    id: 'flags', name: 'Steaguri', short: 'Steaguri', emoji: '🚩',
    gradient: 'from-sky-400 to-blue-600', color: '#0ea5e9', tagline: '8 steaguri · 6 secunde fiecare',
  },
};

export const DOMAIN_LIST: DomainMeta[] = [DOMAINS.trivia, DOMAINS.chess, DOMAINS.math, DOMAINS.flags];
