import { describe, expect, it } from 'vitest';
import { expectedScore, rate } from '../src/rating';
import { leagueFor } from '../src/leagues';

describe('Glicko-2', () => {
  it("matches the worked example from Glickman's paper", () => {
    // Player 1500/200/0.06 vs 1400/30 (win), 1550/100 (loss), 1700/300 (loss), tau 0.5
    const r = rate({ rating: 1500, rd: 200, vol: 0.06 }, [
      { opponent: { rating: 1400, rd: 30, vol: 0.06 }, score: 1 },
      { opponent: { rating: 1550, rd: 100, vol: 0.06 }, score: 0 },
      { opponent: { rating: 1700, rd: 300, vol: 0.06 }, score: 0 },
    ]);
    expect(r.rating).toBeCloseTo(1464.06, 1);
    expect(r.rd).toBeCloseTo(151.52, 1);
    expect(r.vol).toBeCloseTo(0.05999, 4);
  });

  it('winner goes up, loser goes down, symmetric for equal players', () => {
    const a = { rating: 1500, rd: 120, vol: 0.06 };
    const b = { rating: 1500, rd: 120, vol: 0.06 };
    const wa = rate(a, [{ opponent: b, score: 1 }]);
    const lb = rate(b, [{ opponent: a, score: 0 }]);
    expect(wa.rating).toBeGreaterThan(1500);
    expect(lb.rating).toBeLessThan(1500);
    expect(wa.rating - 1500).toBeCloseTo(1500 - lb.rating, 6);
    expect(wa.rd).toBeLessThan(120);
  });

  it('a draw between equals changes nothing but RD', () => {
    const p = { rating: 1600, rd: 80, vol: 0.06 };
    const r = rate(p, [{ opponent: { ...p }, score: 0.5 }]);
    expect(r.rating).toBeCloseTo(1600, 6);
  });

  it('beating a stronger opponent gains more than beating a weaker one', () => {
    const me = { rating: 1500, rd: 100, vol: 0.06 };
    const up = rate(me, [{ opponent: { rating: 1800, rd: 100, vol: 0.06 }, score: 1 }]).rating - 1500;
    const down = rate(me, [{ opponent: { rating: 1200, rd: 100, vol: 0.06 }, score: 1 }]).rating - 1500;
    expect(up).toBeGreaterThan(down);
    expect(expectedScore(me, { rating: 1800, rd: 100, vol: 0.06 })).toBeLessThan(0.5);
  });

  it('uncertain (new) players move more than established ones', () => {
    const opp = { rating: 1500, rd: 100, vol: 0.06 };
    const fresh = rate({ rating: 1500, rd: 350, vol: 0.06 }, [{ opponent: opp, score: 1 }]).rating - 1500;
    const vet = rate({ rating: 1500, rd: 60, vol: 0.06 }, [{ opponent: opp, score: 1 }]).rating - 1500;
    expect(fresh).toBeGreaterThan(vet);
  });

  it('no games → unchanged', () => {
    expect(rate({ rating: 1500, rd: 100, vol: 0.06 }, [])).toEqual({ rating: 1500, rd: 100, vol: 0.06 });
  });
});

describe('leagues', () => {
  it('maps rating to the right league', () => {
    expect(leagueFor(1100).name).toBe('Bronz');
    expect(leagueFor(1299).name).toBe('Bronz');
    expect(leagueFor(1300).name).toBe('Argint');
    expect(leagueFor(1499).name).toBe('Argint');
    expect(leagueFor(1500).name).toBe('Aur');
    expect(leagueFor(1700).name).toBe('Platină');
    expect(leagueFor(1900).name).toBe('Diamant');
    expect(leagueFor(2099).name).toBe('Diamant');
    expect(leagueFor(2100).name).toBe('Legendă');
  });
});
