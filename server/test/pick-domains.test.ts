import { describe, expect, it } from 'vitest';
import { availableDomains, pickDomains } from '../src/modes';
import { createRng } from '../src/rng';

describe('pickDomains', () => {
  it('never picks a banned game and keeps three different games when it can', () => {
    const allowed = availableDomains().filter((d) => d !== 'chess' && d !== 'golf');
    for (let seed = 1; seed <= 50; seed++) {
      const picks = pickDomains(createRng(seed), 3, allowed);
      expect(picks).toHaveLength(3);
      expect(new Set(picks).size).toBe(3);
      expect(picks).not.toContain('chess');
      expect(picks).not.toContain('golf');
    }
  });

  it('one allowed game means every round is that game; two means one repeats', () => {
    expect(pickDomains(createRng(1), 3, ['flags'])).toEqual(['flags', 'flags', 'flags']);
    const two = pickDomains(createRng(2), 3, ['flags', 'trivia']);
    expect(new Set(two)).toEqual(new Set(['flags', 'trivia']));
  });
});

describe('Rubik’s Cube is private-room only', () => {
  it('never comes up in normal matches, rarely in rooms, always when it is the only game', async () => {
    const { friendDomains, CUBE_ROOM_CHANCE } = await import('../src/game');
    const { availableDomains: all } = await import('../src/modes');
    let withCube = 0;
    const N = 20_000;
    for (let seed = 1; seed <= N; seed++) if (friendDomains(createRng(seed), all()).includes('cube')) withCube++;
    expect(CUBE_ROOM_CHANCE).toBe(0.01);
    expect(withCube / N).toBeGreaterThan(0.005);
    expect(withCube / N).toBeLessThan(0.016);
    expect(friendDomains(createRng(3), ['cube'])).toEqual(['cube', 'cube', 'cube']);
    for (let seed = 1; seed <= 200; seed++) expect(friendDomains(createRng(seed), ['trivia', 'flags'])).not.toContain('cube');
  });
});

describe('Guess the color comes up half as often', () => {
  it('normal matches: about 13.6% of duels instead of 27%; still always when it is the only game', () => {
    const normal = availableDomains().filter((d) => d !== 'cube');
    let color = 0, trivia = 0;
    const N = 40_000;
    for (let seed = 1; seed <= N; seed++) {
      const p = pickDomains(createRng(seed), 3, normal);
      expect(new Set(p).size).toBe(3);
      if (p.includes('color')) color++;
      if (p.includes('trivia')) trivia++;
    }
    const usual = 3 / normal.length; // 27%
    expect(color / N).toBeGreaterThan(usual * 0.5 - 0.012);
    expect(color / N).toBeLessThan(usual * 0.5 + 0.012);
    expect(trivia / N).toBeGreaterThan(usual - 0.01); // the others don't lose anything
    expect(pickDomains(createRng(5), 3, ['color'])).toEqual(['color', 'color', 'color']);
  });
});
