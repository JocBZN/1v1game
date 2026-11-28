/**
 * "Pin the country": a country name is shown, the player drops a pin on a globe without borders.
 * Inside the country = full points; outside, points fall with the distance to its nearest border.
 * Geometry: Natural Earth 1:50m countries (world-atlas package), loaded once on the server.
 */
import { createRequire } from 'node:module';
import { geoArea, geoCentroid, geoContains, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import type { Topology } from 'topojson-specification';
import { loadCountries } from './flags';
import { isNum, simulateItemBot } from './sim';
import { sumScore, type GameMode, type RoundContent } from './types';

export const GLOBE_ITEMS = 5;
export const GLOBE_ITEM_MS = 20_000;
const FEEDBACK_MS = 2_600;
const EARTH_KM = 6371;
/** Distance from the border at which a pin stops scoring. */
export const GLOBE_ZERO_KM = 1500;

/** Points: 1000 inside the country, then linear down to 0 at 1,500 km from its border. */
export function globePoints(distanceKm: number, inside: boolean): number {
  if (inside) return 1000;
  return Math.round(1000 * Math.max(0, 1 - distanceKm / GLOBE_ZERO_KM));
}

/** Natural Earth's short names → the names used in the flags game. */
const ALIASES: Record<string, string> = {
  'United States of America': 'United States', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Dem. Rep. Congo': 'DR Congo',
  Congo: 'Republic of the Congo', 'Central African Rep.': 'Central African Republic', 'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea', 'S. Sudan': 'South Sudan', 'Solomon Is.': 'Solomon Islands', 'Marshall Is.': 'Marshall Islands',
  'St. Vin. and Gren.': 'Saint Vincent and the Grenadines', 'St. Kitts and Nevis': 'Saint Kitts and Nevis', 'Antigua and Barb.': 'Antigua and Barbuda',
  eSwatini: 'Eswatini', 'Côte d\'Ivoire': 'Ivory Coast', 'Cabo Verde': 'Cape Verde', Macedonia: 'North Macedonia', Vatican: 'Vatican City',
  'São Tomé and Principe': 'São Tomé and Príncipe',
};

export interface GlobeCountry {
  name: string;
  feature: Feature<Polygon | MultiPolygon>;
  /** Steradians (for difficulty) */
  area: number;
}

let cache: GlobeCountry[] | null = null;
/** The 194 countries of the flags game that exist in the map data, with their shapes. */
export function globeCountries(): GlobeCountry[] {
  if (cache) return cache;
  const require = createRequire(import.meta.url);
  const topo = require('world-atlas/countries-50m.json') as Topology;
  const fc = feature(topo, topo.objects.countries) as unknown as { features: Feature<Polygon | MultiPolygon, { name: string }>[] };
  const wanted = new Set(loadCountries().map((c) => c.name));
  const out: GlobeCountry[] = [];
  for (const f of fc.features) {
    const name = ALIASES[f.properties.name] ?? f.properties.name;
    if (!wanted.has(name) || out.some((c) => c.name === name)) continue;
    out.push({ name, feature: f, area: geoArea(f) });
  }
  cache = out;
  return out;
}

const byName = (name: string) => globeCountries().find((c) => c.name === name);

function rings(f: Feature<Polygon | MultiPolygon>): Position[][] {
  return f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat();
}

/** Distance (km) from a point to the country's nearest border vertex, and that vertex. */
export function distanceToCountry(c: GlobeCountry, lon: number, lat: number): { km: number; inside: boolean; nearest: [number, number] } {
  const p: [number, number] = [lon, lat];
  if (geoContains(c.feature, p)) return { km: 0, inside: true, nearest: p };
  let best = Infinity;
  let nearest: [number, number] = p;
  for (const ring of rings(c.feature)) {
    for (const v of ring) {
      const d = geoDistance(p, v as [number, number]);
      if (d < best) {
        best = d;
        nearest = [v[0], v[1]];
      }
    }
  }
  return { km: best * EARTH_KM, inside: false, nearest };
}

/** A light outline of the country for the answer screen (every n-th point, rounded). */
function outline(c: GlobeCountry): Position[][] {
  return rings(c.feature)
    .filter((r) => r.length >= 4)
    .map((r) => {
      const step = Math.max(1, Math.floor(r.length / 120));
      const pts = r.filter((_, i) => i % step === 0).map((q) => [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100]);
      pts.push(pts[0]);
      return pts;
    });
}

export interface GlobeItem {
  name: string;
}
export type GlobeContent = RoundContent<GlobeItem>;

export function parsePin(x: unknown): { lon: number; lat: number } | null {
  if (!x || typeof x !== 'object') return null;
  const { lon, lat } = x as Record<string, unknown>;
  if (!isNum(lon) || !isNum(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lon, lat };
}

export const globeMode: GameMode<GlobeContent> = {
  id: 'globe',
  name: 'Pin the country',
  itemTimeLimit: GLOBE_ITEM_MS,
  feedbackDelay: FEEDBACK_MS,
  timeLimit: GLOBE_ITEMS * (GLOBE_ITEM_MS + FEEDBACK_MS) + 1_000,

  generateRound(rng) {
    // A mix of sizes: two big countries, two medium, one small (sorted by area into thirds).
    const all = [...globeCountries()].sort((a, b) => b.area - a.area);
    const third = Math.ceil(all.length / 3);
    const big = rng.shuffle(all.slice(0, third));
    const mid = rng.shuffle(all.slice(third, 2 * third));
    const small = rng.shuffle(all.slice(2 * third));
    const items = rng.shuffle([big[0], big[1], mid[0], mid[1], small[0]]).map((c) => ({ name: c.name }));
    return { items };
  },

  publicItem(content, index) {
    return { name: content.items[index].name, index, total: content.items.length, seconds: GLOBE_ITEM_MS / 1000 };
  },

  validateAnswer(content, index, answer) {
    const c = byName(content.items[index].name);
    const pin = parsePin(answer);
    const reveal = c ? { outline: outline(c), center: geoCentroid(c.feature) } : {};
    if (!c || !pin) return { correct: false, points: 0, itemDone: true, feedback: { ...reveal, km: null } };
    const r = distanceToCountry(c, pin.lon, pin.lat);
    const points = globePoints(r.km, r.inside);
    return {
      correct: points >= 750,
      points,
      itemDone: true,
      feedback: { ...reveal, km: Math.round(r.km), inside: r.inside, nearest: r.nearest, pin: [pin.lon, pin.lat] },
    };
  },

  timeoutFeedback(content, index) {
    const c = byName(content.items[index].name);
    return c ? { outline: outline(c), center: geoCentroid(c.feature), km: null } : { km: null };
  },

  scoreRound: sumScore,

  simulateBot(content, rating, rng) {
    return simulateItemBot({
      count: content.items.length, rating, rng, itemTimeLimit: GLOBE_ITEM_MS, feedbackDelay: FEEDBACK_MS,
      roundLimit: this.timeLimit, thinkMs: 9_000,
      // Good bots land inside; weaker ones miss by up to ~1,500 km.
      points: (_i, q) => (q > 0.82 ? 1000 : globePoints((1 - q) * 1800 * (0.6 + rng() * 0.8), false)),
    });
  },
};
