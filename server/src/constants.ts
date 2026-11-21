export const DEFAULT_RATING = 1500;
export const DEFAULT_RD = 350;
export const DEFAULT_VOL = 0.06;

/**
 * Version of the game content (questions, flags, puzzles, texts). Ghosts only replay rounds recorded
 * with the current version, so a translation or data change never resurfaces stale rounds.
 * Bump it whenever recorded round content would look wrong or outdated today.
 *  1: Romanian-era content · 2: English + expanded questions/flags
 */
export const CONTENT_VERSION = 2;
