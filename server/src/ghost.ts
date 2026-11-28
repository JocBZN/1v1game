import crypto from 'node:crypto';
import {
  getGhostCandidates, getGhostRecordings, getRecordingById, saveRecording, type RecordingRow,
} from './db';
import { RATING_TRACKS, type DomainId, type RatingTrack } from './domains';
import type { RatingSnap, RoundPlan, RoundRecording, SlotInit } from './duel/Duel';
import { RARER, availableDomains, getMode, pickDomains } from './modes';
import type { RoundContent } from './modes/types';
import type { Rng } from './rng';

export function contentKey(content: RoundContent): string {
  return crypto.createHash('sha1').update(JSON.stringify(content)).digest('hex');
}

/** Store a round a real human just played, so it can be replayed later as a ghost. */
export function recordRound(userId: number, ratings: Record<RatingTrack, RatingSnap>, rec: RoundRecording) {
  saveRecording({
    user_id: userId,
    domain: rec.domain,
    content_key: contentKey(rec.content),
    content: JSON.stringify(rec.content),
    events: JSON.stringify(rec.events),
    score: rec.score,
    duration_ms: Math.round(rec.durationMs),
    rating: ratings[rec.domain].rating,
    rd: ratings[rec.domain].rd,
    general_rating: ratings.general.rating,
    general_rd: ratings.general.rd,
    created_at: Date.now(),
  });
}

const BOT_NAMES = [
  'Andrew_92', 'QuizQueen', 'Vlad.Bolt', 'MiaR', 'TurboRadu', 'EllaPop', 'CostinX', 'Bianca07',
  'KingTudor', 'Ana.Maria', 'Sam_TheBrain', 'IrinaN', 'Matt_88', 'DariaZ', 'Paul.Wind', 'CalcChris',
  'Alexa_K', 'Bobby_Chess', 'Lara.M', 'SpeedySteve',
];

function uniformRatings(rating: number, rd: number): Record<RatingTrack, RatingSnap> {
  return Object.fromEntries(RATING_TRACKS.map((t) => [t, { rating, rd, vol: 0.06 }])) as Record<RatingTrack, RatingSnap>;
}

/** Pure bot opponent: rating close to the player's, accuracy/speed derived from it. */
export function buildBotDuel(myGeneral: number, rng: Rng, domains?: DomainId[]): { opponent: SlotInit; plans: RoundPlan[] } {
  const rating = Math.round(myGeneral + rng.int(-60, 60));
  const opponent: SlotInit = { kind: 'bot', userId: null, name: rng.pick(BOT_NAMES), ratings: uniformRatings(rating, 150) };
  const plans = (domains ?? pickDomains(rng)).map((domain) => {
    const mode = getMode(domain);
    const content = mode.generateRound(rng);
    return { domain, content, scripts: [null, mode.simulateBot(content, rating, rng)] as RoundPlan['scripts'] };
  });
  return { opponent, plans };
}

/**
 * Ghost opponent: a real player with a nearby rating whose recorded rounds are replayed with their
 * original timing. Domains the ghost has no (unseen) recordings for are played by a bot at the
 * ghost's rating. Returns null when there's nobody to replay.
 */
export function buildGhostDuel(viewerId: number, myGeneral: number, rng: Rng, banned: ReadonlySet<DomainId> = new Set()): { opponent: SlotInit; plans: RoundPlan[] } | null {
  const playable = availableDomains().filter((d) => !banned.has(d));
  const candidates = getGhostCandidates(viewerId)
    .map((c) => ({ ...c, snap: getRecordingById(c.last_id)! }))
    .filter((c) => c.snap)
    .sort((a, b) => Math.abs(a.snap.general_rating - myGeneral) - Math.abs(b.snap.general_rating - myGeneral));

  // Among the closest few, pick one that has something this viewer hasn't seen yet.
  for (const ghost of rng.shuffle(candidates.slice(0, 5))) {
    const unseen = new Map<DomainId, RecordingRow[]>();
    for (const d of playable) {
      const accepts = getMode(d).acceptsContent;
      const recs = getGhostRecordings(ghost.user_id, d, viewerId).filter((r) => !accepts || accepts(JSON.parse(r.content)));
      if (recs.length) unseen.set(d, recs);
    }
    if (unseen.size === 0) continue;

    // Prefer domains with recordings (still random), fill up with the others.
    const withRec = rng.shuffle([...unseen.keys()]);
    const others = rng.shuffle(playable.filter((d) => !unseen.has(d)));
    const domains = [...withRec, ...others].slice(0, 3);
    if (domains.length < 3) return null;
    // Same rule as pickDomains for rarer games (e.g. Guess the color comes up half as often).
    for (const [rare, factor] of Object.entries(RARER) as [DomainId, number][]) {
      const k = domains.indexOf(rare);
      const spare = playable.filter((d) => !domains.includes(d));
      if (k >= 0 && spare.length && !rng.chance(factor)) domains[k] = rng.pick(spare);
    }
    const ordered = rng.shuffle(domains);

    const general: RatingSnap = { rating: ghost.snap.general_rating, rd: ghost.snap.general_rd, vol: 0.06 };
    const ratings = uniformRatings(general.rating, general.rd);
    ratings.general = general;

    const plans: RoundPlan[] = ordered.map((domain) => {
      const recs = unseen.get(domain);
      if (recs) {
        // Closest-rated recording of this ghost in this domain (newest first on ties).
        const rec = [...recs].sort((a, b) => Math.abs(a.general_rating - myGeneral) - Math.abs(b.general_rating - myGeneral))[0];
        ratings[domain] = { rating: rec.rating, rd: rec.rd, vol: 0.06 };
        return {
          domain,
          content: JSON.parse(rec.content) as RoundContent,
          scripts: [null, { events: JSON.parse(rec.events), durationMs: rec.duration_ms }],
        };
      }
      const mode = getMode(domain);
      const content = mode.generateRound(rng);
      return { domain, content, scripts: [null, mode.simulateBot(content, general.rating, rng)] };
    });

    return {
      opponent: { kind: 'ghost', userId: ghost.user_id, name: ghost.nickname, ratings },
      plans,
    };
  }
  return null;
}
