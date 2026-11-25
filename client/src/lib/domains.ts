import { Box, Brain, Calculator, Castle, Flag, type LucideIcon } from 'lucide-react';

export type DomainId = 'trivia' | 'chess' | 'math' | 'flags' | 'cube';

export interface DomainMeta {
  id: DomainId;
  name: string;
  short: string;
  icon: LucideIcon;
  /** Accent for text on cream (hex) */
  color: string;
  /** Soft tint behind the icon (hex) */
  soft: string;
  /** Saturated base colour (gradients, glows) */
  base: string;
  tagline: string;
}

const RED = { color: '#d94a55', soft: '#ffe1de', base: '#ff6973' };
const ORANGE = { color: '#c8705f', soft: '#ffe4dc', base: '#ffb0a3' };
const CYAN = { color: '#15788c', soft: '#d2f0ef', base: '#00b9be' };
const SLATE = { color: '#46425e', soft: '#e8e4ea', base: '#46425e' };

export const DOMAINS: Record<DomainId, DomainMeta> = {
  trivia: { id: 'trivia', name: 'Trivia', short: 'Trivia', icon: Brain, ...ORANGE, tagline: '5 questions · 10 seconds each' },
  chess: { id: 'chess', name: 'Chess puzzles', short: 'Chess', icon: Castle, ...CYAN, tagline: '90 seconds · one mistake = puzzle lost' },
  math: { id: 'math', name: 'Mental math', short: 'Math', icon: Calculator, ...RED, tagline: '60 seconds · as fast as you can' },
  flags: { id: 'flags', name: 'Flags', short: 'Flags', icon: Flag, ...SLATE, tagline: '8 flags · 6 seconds each' },
  cube: { id: 'cube', name: 'Rubik’s Cube', short: 'Cube', icon: Box, ...ORANGE, tagline: '5 minutes · solve it for real' },
};

export const DOMAIN_LIST: DomainMeta[] = [DOMAINS.trivia, DOMAINS.chess, DOMAINS.math, DOMAINS.flags, DOMAINS.cube];
