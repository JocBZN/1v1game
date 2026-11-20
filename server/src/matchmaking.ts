export interface QueueEntry {
  userId: number;
  rating: number;
  joinedAt: number;
}

export interface MatchmakerOptions {
  /** After this long with no live opponent the player gets a ghost/bot. */
  ghostAfterMs: number;
  tickMs: number;
  baseWindow: number;
  windowGrowthPerSec: number;
  now?: () => number;
}

export const DEFAULT_MM: MatchmakerOptions = {
  ghostAfterMs: Number(process.env.GHOST_AFTER_MS ?? 5000),
  tickMs: 200,
  baseWindow: 100,
  windowGrowthPerSec: 75,
};

/**
 * In-memory queue. Two queued players are matched when their general ratings are within a window
 * that widens the longer they wait; after `ghostAfterMs` a lone player is handed to the ghost path.
 */
export class Matchmaker {
  private queue = new Map<number, QueueEntry>();
  private timer: NodeJS.Timeout | null = null;
  private opts: MatchmakerOptions;
  private now: () => number;

  constructor(
    private onMatch: (a: QueueEntry, b: QueueEntry) => void,
    private onGhost: (a: QueueEntry) => void,
    opts: Partial<MatchmakerOptions> = {},
  ) {
    this.opts = { ...DEFAULT_MM, ...opts };
    this.now = opts.now ?? Date.now;
  }

  start() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), this.opts.tickMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  join(userId: number, rating: number): QueueEntry {
    const existing = this.queue.get(userId);
    if (existing) return existing;
    const entry = { userId, rating, joinedAt: this.now() };
    this.queue.set(userId, entry);
    // Try immediately so two waiting players meet without waiting for the next tick.
    this.tick();
    return entry;
  }

  leave(userId: number): boolean {
    return this.queue.delete(userId);
  }

  has(userId: number) {
    return this.queue.has(userId);
  }

  get size() {
    return this.queue.size;
  }

  window(e: QueueEntry, now = this.now()): number {
    return this.opts.baseWindow + this.opts.windowGrowthPerSec * ((now - e.joinedAt) / 1000);
  }

  tick() {
    const now = this.now();
    const waiting = [...this.queue.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    const matched = new Set<number>();

    for (const a of waiting) {
      if (matched.has(a.userId)) continue;
      let best: QueueEntry | null = null;
      let bestDiff = Infinity;
      for (const b of waiting) {
        if (b.userId === a.userId || matched.has(b.userId)) continue;
        const diff = Math.abs(a.rating - b.rating);
        if (diff <= Math.max(this.window(a, now), this.window(b, now)) && diff < bestDiff) {
          best = b;
          bestDiff = diff;
        }
      }
      if (best) {
        matched.add(a.userId);
        matched.add(best.userId);
        this.queue.delete(a.userId);
        this.queue.delete(best.userId);
        this.onMatch(a, best);
      }
    }

    for (const a of waiting) {
      if (matched.has(a.userId) || !this.queue.has(a.userId)) continue;
      if (now - a.joinedAt >= this.opts.ghostAfterMs) {
        this.queue.delete(a.userId);
        this.onGhost(a);
      }
    }
  }
}
