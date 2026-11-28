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
