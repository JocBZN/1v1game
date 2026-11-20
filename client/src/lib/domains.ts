export type DomainId = 'trivia' | 'chess' | 'math' | 'flags' | 'cube';

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
    id: 'trivia', name: 'Trivia', short: 'Trivia', emoji: '🧠',
    gradient: 'from-[#c4a3ff] to-[#7c5cff]', color: '#b18cff', tagline: '5 questions · 10 seconds each',
  },
  chess: {
    id: 'chess', name: 'Chess puzzles', short: 'Chess', emoji: '♞',
    gradient: 'from-[#5ff0b4] to-[#13a88e]', color: '#3ddc97', tagline: '90 seconds · one mistake = puzzle lost',
  },
  math: {
    id: 'math', name: 'Mental math', short: 'Math', emoji: '🧮',
    gradient: 'from-[#ffd166] to-[#ff8a3d]', color: '#ffb547', tagline: '60 seconds · as fast as you can',
  },
  flags: {
    id: 'flags', name: 'Flags', short: 'Flags', emoji: '🚩',
    gradient: 'from-[#7fdcff] to-[#3a7bff]', color: '#5cc8ff', tagline: '8 flags · 6 seconds each',
  },
  cube: {
    id: 'cube', name: 'Rubik’s Cube', short: 'Cube', emoji: '🧊',
    gradient: 'from-[#ff8fa3] to-[#ff4d6d]', color: '#ff6b8b', tagline: '5 minutes · solve it for real',
  },
};

export const DOMAIN_LIST: DomainMeta[] = [DOMAINS.trivia, DOMAINS.chess, DOMAINS.math, DOMAINS.flags, DOMAINS.cube];
