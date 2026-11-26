import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Duel, type SlotInit } from '../src/duel/Duel';
import { RATING_TRACKS } from '../src/domains';
import { colorMode } from '../src/modes/color';
import { createRng } from '../src/rng';

const ratings = Object.fromEntries(RATING_TRACKS.map((t) => [t, { rating: 1500, rd: 100, vol: 0.06 }])) as SlotInit['ratings'];

describe('bot plays out its round when the human finishes first', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps the bot’s scripted score but ends the round within seconds', () => {
    const content = colorMode.generateRound(createRng(1));
    // a slow bot: its answers come late in the round
    const events = content.items.map((_, i) => ({ t: 15_000 * (i + 1), item: i, points: 500, correct: false, done: true }));
    const sent: [string, any][] = [];
    const duel = new Duel(
      'd1',
      [{ kind: 'human', userId: 1, name: 'me', ratings }, { kind: 'bot', userId: null, name: 'bot', ratings }],
      [{ domain: 'color', content, scripts: [null, { events, durationMs: 70_000 }] }],
      { emit: (_u, e, d) => sent.push([e, d]), onRoundRecorded: () => {}, onFinish: () => [null, null], onClosed: () => {} },
      { now: () => Date.now() },
    );
    duel.start();
    vi.advanceTimersByTime(400 + 3600 + 10); // intro → round starts
    const t0 = Date.now();
    for (let i = 0; i < content.items.length; i++) {
      duel.answer(1, { round: 0, item: i, answer: content.items[i].rgb });
      vi.advanceTimersByTime(3_000); // feedback delay
    }
    vi.advanceTimersByTime(3_000);
    const end = sent.find(([e]) => e === 'round:end');
    expect(end).toBeTruthy();
    expect(end![1].opponent).toBe(500 * content.items.length); // same score as the script
    expect(Date.now() - t0).toBeLessThan(25_000); // not the bot's 60+ seconds
  });
});
