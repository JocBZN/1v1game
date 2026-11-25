import { Box, Brain, Castle, Flag, History, LandPlot, Palette, Scissors, type LucideIcon } from 'lucide-react';

export type DomainId = 'trivia' | 'chess' | 'flags' | 'cube' | 'split' | 'color' | 'golf' | 'timeline';

export interface DomainMeta {
  id: DomainId;
  name: string;
  short: string;
  icon: LucideIcon;
  /** Accent for text on cream (hex) */
  color: string;
  /** Soft tint behind the icon (hex) */
  soft: string;
  /** Saturated base colour */
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
  flags: { id: 'flags', name: 'Flags', short: 'Flags', icon: Flag, ...SLATE, tagline: '8 flags · 6 seconds each' },
  cube: { id: 'cube', name: 'Rubik’s Cube', short: 'Cube', icon: Box, ...ORANGE, tagline: '3 minutes · make one face or a cross' },
  split: { id: 'split', name: 'Split the shape', short: 'Split', icon: Scissors, ...RED, tagline: '5 shapes · one cut as close to 50/50' },
  color: { id: 'color', name: 'Guess the color', short: 'Color', icon: Palette, ...CYAN, tagline: '4 colors · 15 seconds each' },
  golf: { id: 'golf', name: 'One-shot golf', short: 'Golf', icon: LandPlot, ...SLATE, tagline: '3 holes · up to 3 shots each' },
  timeline: { id: 'timeline', name: 'Timeline', short: 'Timeline', icon: History, ...RED, tagline: '3 rounds · put 4 events in order' },
};

export const DOMAIN_LIST: DomainMeta[] = [
  DOMAINS.trivia, DOMAINS.chess, DOMAINS.flags, DOMAINS.cube, DOMAINS.split, DOMAINS.color, DOMAINS.golf, DOMAINS.timeline,
];
