import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { dataFile } from '../src/paths';
import { photoMode } from '../src/modes/estimate';
import { photoQuestions } from '../src/modes/photos';
import { createRng } from '../src/rng';

describe('photo year', () => {
  const rows = JSON.parse(fs.readFileSync(dataFile('photos.json'), 'utf8')).photos as { y: number; img: string; t: string; c: string; u: string }[];

  it('has 1,000 photos with a year, a Commons thumbnail, a credit and a source page', () => {
    expect(rows.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(rows.map((r) => r.img)).size).toBe(rows.length);
    for (const r of rows) {
      expect(Number.isInteger(r.y) && r.y >= 1826 && r.y <= 2026).toBe(true);
      expect(r.img.startsWith('https://upload.wikimedia.org/wikipedia/commons/thumb/')).toBe(true);
      expect(r.u.startsWith('https://commons.wikimedia.org/wiki/File:')).toBe(true);
      expect(r.c.length).toBeGreaterThan(3);
    }
  });

  it('never sends the Commons file name before the answer', () => {
    const content = photoMode.generateRound(createRng(5));
    expect(content.items).toHaveLength(3);
    expect(photoMode.itemTimeLimit).toBe(60_000 + 700);
    const pub = JSON.stringify(photoMode.publicItem(content, 0));
    expect(pub).toMatch(/"img":"\/api\/photo\/[\w-]{16}"/);
    expect(pub).not.toContain('wikimedia');
    expect(pub).not.toContain(String(content.items[0].answer));
  });

  it('scores 1000 for the exact year and 0 from 20 years off', () => {
    const content = { items: photoQuestions().slice(0, 1) };
    const y = content.items[0].answer;
    expect(photoMode.validateAnswer(content, 0, y, { elapsedMs: 1000 } as never).points).toBe(1000);
    expect(photoMode.validateAnswer(content, 0, y + 10, { elapsedMs: 1000 } as never).points).toBe(500);
    expect(photoMode.validateAnswer(content, 0, y - 20, { elapsedMs: 1000 } as never).points).toBe(0);
  });
});
