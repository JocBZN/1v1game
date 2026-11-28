import { describe, expect, it } from 'vitest';
import { distanceToCountry, globeCountries, globeMode, globePoints, parsePin } from '../src/modes/globe';
import { createRng } from '../src/rng';

const country = (n: string) => globeCountries().find((c) => c.name === n)!;

describe('Pin the country', () => {
  it('knows (almost) every country of the flags game', () => {
    expect(globeCountries().length).toBeGreaterThanOrEqual(190);
    expect(country('Romania')).toBeTruthy();
    expect(country('United States')).toBeTruthy();
    expect(country('DR Congo')).toBeTruthy();
  });

  it('a pin inside the country is worth 1000; outside, points fall with distance to its border', () => {
    expect(distanceToCountry(country('Romania'), 26.1, 44.43).inside).toBe(true); // Bucharest
    expect(distanceToCountry(country('France'), 2.35, 48.86).inside).toBe(true); // Paris
    const budapest = distanceToCountry(country('Romania'), 19.04, 47.5);
    expect(budapest.inside).toBe(false);
    expect(budapest.km).toBeGreaterThan(120);
    expect(budapest.km).toBeLessThan(260);
    expect(globePoints(0, true)).toBe(1000);
    expect(globePoints(750, false)).toBe(500);
    expect(globePoints(1500, false)).toBe(0);
    expect(globePoints(5000, false)).toBe(0);
  });

  it('rounds have five different countries of mixed sizes and score server-side', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = globeMode.generateRound(createRng(seed));
      expect(r.items).toHaveLength(5);
      expect(new Set(r.items.map((i) => i.name)).size).toBe(5);
    }
    const r = { items: [{ name: 'Japan' }] };
    const hit = globeMode.validateAnswer(r, 0, { lon: 139.69, lat: 35.69 }, {} as never); // Tokyo
    expect(hit.points).toBe(1000);
    const miss = globeMode.validateAnswer(r, 0, { lon: 2.35, lat: 48.86 }, {} as never); // Paris
    expect(miss.points).toBe(0);
    expect((miss.feedback as { outline: unknown[] }).outline.length).toBeGreaterThan(0);
    expect(globeMode.validateAnswer(r, 0, { lon: 'x' }, {} as never).points).toBe(0);
    expect(parsePin({ lon: 200, lat: 0 })).toBeNull();
  });
});
