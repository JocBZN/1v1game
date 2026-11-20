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
    gradient: 'from-[#c4a3ff] to-[#7c5cff]', color: '#b18cff', tagline: '5 întrebări · 10 secunde fiecare',
  },
  chess: {
    id: 'chess', name: 'Puzzle șah', short: 'Șah', emoji: '♞',
    gradient: 'from-[#5ff0b4] to-[#13a88e]', color: '#3ddc97', tagline: '90 de secunde · o greșeală = puzzle pierdut',
  },
  math: {
    id: 'math', name: 'Calcul mental', short: 'Calcul', emoji: '🧮',
    gradient: 'from-[#ffd166] to-[#ff8a3d]', color: '#ffb547', tagline: '60 de secunde · cât de repede poți',
  },
  flags: {
    id: 'flags', name: 'Steaguri', short: 'Steaguri', emoji: '🚩',
    gradient: 'from-[#7fdcff] to-[#3a7bff]', color: '#5cc8ff', tagline: '8 steaguri · 6 secunde fiecare',
  },
};

export const DOMAIN_LIST: DomainMeta[] = [DOMAINS.trivia, DOMAINS.chess, DOMAINS.math, DOMAINS.flags];
