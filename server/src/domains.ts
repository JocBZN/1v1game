export const DOMAIN_IDS = ['trivia', 'chess', 'flags', 'cube', 'split', 'color', 'golf', 'timeline'] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

/** Rating "tracks": one per domain plus the overall one. */
export type RatingTrack = DomainId | 'general';
export const RATING_TRACKS: RatingTrack[] = ['general', ...DOMAIN_IDS];

export const DOMAIN_NAMES: Record<DomainId, string> = {
  trivia: 'Trivia',
  chess: 'Chess puzzles',
  flags: 'Flags',
  cube: 'Rubik’s Cube',
  split: 'Split the shape',
  color: 'Guess the color',
  golf: 'One-shot golf',
  timeline: 'Timeline',
};

export function isDomain(x: unknown): x is DomainId {
  return typeof x === 'string' && (DOMAIN_IDS as readonly string[]).includes(x);
}

export function isRatingTrack(x: unknown): x is RatingTrack {
  return x === 'general' || isDomain(x);
}
