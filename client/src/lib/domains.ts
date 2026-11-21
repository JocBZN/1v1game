export type DomainId = 'trivia' | 'chess' | 'math' | 'flags' | 'cube';

export interface DomainMeta {
  id: DomainId;
  name: string;
  short: string;
  emoji: string;
  /** Accent for text on cream (hex) */
  color: string;
  /** Soft tint behind the emoji (hex) */
  soft: string;
  tagline: string;
}

const RED = { color: '#b8240f', soft: '#f9d6c9' };
const ORANGE = { color: '#b56500', soft: '#ffe0aa' };
const CYAN = { color: '#007f8f', soft: '#c8ecea' };

export const DOMAINS: Record<DomainId, DomainMeta> = {
  trivia: { id: 'trivia', name: 'Trivia', short: 'Trivia', emoji: '🧠', ...ORANGE, tagline: '5 questions · 10 seconds each' },
  chess: { id: 'chess', name: 'Chess puzzles', short: 'Chess', emoji: '♞', ...CYAN, tagline: '90 seconds · one mistake = puzzle lost' },
  math: { id: 'math', name: 'Mental math', short: 'Math', emoji: '🧮', ...RED, tagline: '60 seconds · as fast as you can' },
  flags: { id: 'flags', name: 'Flags', short: 'Flags', emoji: '🚩', ...CYAN, tagline: '8 flags · 6 seconds each' },
  cube: { id: 'cube', name: 'Rubik’s Cube', short: 'Cube', emoji: '🧊', ...ORANGE, tagline: '5 minutes · solve it for real' },
};

export const DOMAIN_LIST: DomainMeta[] = [DOMAINS.trivia, DOMAINS.chess, DOMAINS.math, DOMAINS.flags, DOMAINS.cube];
