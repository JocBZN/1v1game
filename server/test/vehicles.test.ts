import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';
import { vehicleData, vehiclesMode, VEHICLE_ITEMS } from '../src/modes/vehicles';

describe('vehicles', () => {
  it('has 850+ vehicles with a Commons photo and a credit, plus documented prices', () => {
    const { items, prices } = vehicleData();
    expect(items.length).toBeGreaterThanOrEqual(850);
    expect(prices.length).toBeGreaterThanOrEqual(10);
    for (const r of [...items, ...prices]) {
      expect(r.img.startsWith('https://upload.wikimedia.org/wikipedia/commons/thumb/')).toBe(true);
      expect(r.c.length).toBeGreaterThan(1);
    }
    for (const kind of ['car', 'plane', 'moto', 'type'] as const) expect(items.filter((r) => r.k === kind).length).toBeGreaterThan(50);
  });

  it('builds rounds of 5 with 4 distinct options, the right one included, and at most one price', () => {
    for (let s = 0; s < 300; s++) {
      const { items } = vehiclesMode.generateRound(createRng(s));
      expect(items).toHaveLength(VEHICLE_ITEMS);
      expect(new Set(items.map((i) => i.img)).size).toBe(VEHICLE_ITEMS);
      expect(items.filter((i) => i.kind === 'price').length).toBeLessThanOrEqual(1);
      for (const it of items) {
        if (it.kind === 'price') continue;
        expect(it.options).toHaveLength(4);
        expect(new Set(it.options).size).toBe(4);
        expect(it.options[it.answer]).toBeDefined();
      }
    }
  });

  it('never sends the answer or the Commons file name before answering', () => {
    const content = vehiclesMode.generateRound(createRng(3));
    for (let i = 0; i < content.items.length; i++) {
      const pub = JSON.stringify(vehiclesMode.publicItem(content, i));
      expect(pub).not.toContain('wikimedia');
      expect(pub).not.toContain('"answer"');
      expect(pub).toMatch(/"img":"\/api\/photo\/[\w-]{16}"/);
    }
  });

  it('scores the right option and the price slider', () => {
    const content = vehiclesMode.generateRound(createRng(9));
    const i = content.items.findIndex((x) => x.kind === 'choice');
    const it = content.items[i];
    expect(vehiclesMode.validateAnswer(content, i, it.answer, { elapsedMs: 2000 } as never).points).toBeGreaterThan(0);
    expect(vehiclesMode.validateAnswer(content, i, (it.answer + 1) % 4, { elapsedMs: 2000 } as never).points).toBe(0);
    const price = { items: [{ ...it, kind: 'price' as const, price: 50_000, options: [], answer: -1 }] };
    expect(vehiclesMode.validateAnswer(price, 0, 50_000, { elapsedMs: 2000 } as never).points).toBe(1000);
    expect(vehiclesMode.validateAnswer(price, 0, 250_000, { elapsedMs: 2000 } as never).points).toBe(0);
  });
});
