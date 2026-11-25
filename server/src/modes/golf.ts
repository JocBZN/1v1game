import { HOLE_R, pathDurationMs, powerForDistance, simulateShot, type Course, type Pt, type Rect } from '../golf/physics';
import { clamp } from '../rng';
import { isNum } from './sim';
import { botAccuracy, botSpeedFactor, sumScore, type GameMode, type ReplayEvent, type RoundContent } from './types';

export type GolfContent = RoundContent<Course>;

export const GOLF_HOLES = 3;
export const GOLF_STROKES = 3;
export const GOLF_ITEM_MS = 25_000;
const FEEDBACK_MS = 1_800;
const HOLED_POINTS: Record<number, number> = { 1: 1000, 2: 650, 3: 400 };

/** Not holed after the last stroke: up to 300 points for being close. */
export const nearPoints = (dist: number) => Math.round(Math.max(0, 300 * (1 - dist / 60)));

interface GolfState {
  pos: Pt;
  strokes: number;
}

function st(course: Course, itemState: Record<string, unknown>): GolfState {
  if (!itemState.golf) itemState.golf = { pos: [...course.start], strokes: 0 } satisfies GolfState;
  return itemState.golf as GolfState;
}

function overlaps(r: Rect, p: Pt, pad: number) {
  return p[0] > r.x - pad && p[0] < r.x + r.w + pad && p[1] > r.y - pad && p[1] < r.y + r.h + pad;
}

export function parseShot(x: unknown): { angle: number; power: number } | null {
  if (!x || typeof x !== 'object') return null;
  const { angle, power } = x as Record<string, unknown>;
  if (!isNum(angle) || !isNum(power) || power <= 0 || power > 1) return null;
  return { angle, power };
}

export const golfMode: GameMode<GolfContent> = {
  id: 'golf',
  name: 'One-shot golf',
  itemTimeLimit: GOLF_ITEM_MS,
  feedbackDelay: FEEDBACK_MS,
  timeLimit: GOLF_HOLES * (GOLF_ITEM_MS + FEEDBACK_MS) + 1_000,

  generateRound(rng) {
    const items = Array.from({ length: GOLF_HOLES }, (): Course => {
      const start: Pt = [rng.int(25, 75), rng.int(128, 138)];
      const hole: Pt = [rng.int(18, 82), rng.int(16, 30)];
      const walls: Rect[] = [];
      const count = rng.int(1, 2);
      for (let i = 0; i < 40 && walls.length < count; i++) {
        const w = rng.int(24, 46);
        const h = rng.int(5, 8);
        // the first one sits across the straight line, so a bank shot or a curve around it is needed
        const t = walls.length === 0 ? rng.int(35, 65) / 100 : rng() * 0.8 + 0.1;
        const cx = walls.length === 0 ? start[0] + (hole[0] - start[0]) * t + rng.int(-8, 8) : rng.int(10, 90);
        const cy = start[1] + (hole[1] - start[1]) * t;
        const r: Rect = { x: clamp(Math.round(cx - w / 2), 0, 100 - w), y: Math.round(cy - h / 2), w, h };
        if (overlaps(r, start, 8) || overlaps(r, hole, 10) || walls.some((o) => overlaps(o, [r.x + r.w / 2, r.y + r.h / 2], 14))) continue;
        walls.push(r);
      }
      return { w: 100, h: 150, start, hole, walls };
    });
    return { items };
  },

  publicItem(content, index) {
    return { course: content.items[index], pos: content.items[index].start, strokes: 0, maxStrokes: GOLF_STROKES, index, total: content.items.length };
  },

  publicItemState(content, index, itemState) {
    const s = st(content.items[index], itemState);
    return { course: content.items[index], pos: s.pos, strokes: s.strokes, maxStrokes: GOLF_STROKES, index, total: content.items.length };
  },

  validateAnswer(content, index, answer, ctx) {
    const course = content.items[index];
    const s = st(course, ctx.itemState);
    const shot = parseShot(answer);
    if (!shot) return { correct: false, points: 0, itemDone: false, feedback: { rejected: true } };
    const res = simulateShot(course, s.pos, shot);
    s.pos = res.end;
    s.strokes++;
    const base = { path: res.path, end: res.end, holed: res.holed, strokes: s.strokes, animMs: pathDurationMs(res.path) };
    if (res.holed) return { correct: true, points: HOLED_POINTS[s.strokes], itemDone: true, feedback: base };
    if (s.strokes >= GOLF_STROKES) {
      const dist = Math.hypot(res.end[0] - course.hole[0], res.end[1] - course.hole[1]) - HOLE_R;
      return { correct: false, points: nearPoints(dist), itemDone: true, feedback: base };
    }
    return { correct: false, points: 0, itemDone: false, feedback: base };
  },

  timeoutFeedback() {
    return {};
  },

  scoreRound: sumScore,

  /** Bot: aims straight at the hole with rating-based noise, using the real physics (walls included). */
  simulateBot(content, rating, rng) {
    const events: ReplayEvent[] = [];
    const speed = botSpeedFactor(rating);
    const noise = 1.15 - botAccuracy(rating); // ~0.5 at 1500
    let t = 0;
    content.items.forEach((course, i) => {
      let pos: Pt = [...course.start];
      let itemT = 0;
      for (let stroke = 1; stroke <= GOLF_STROKES; stroke++) {
        itemT += clamp(rng.normal(4_000 * speed, 1_200), 1_500, 8_000);
        const dx = course.hole[0] - pos[0];
        const dy = course.hole[1] - pos[1];
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) + rng.normal(0, 0.09 * noise);
        const power = clamp(powerForDistance(dist + 4) * (1 + rng.normal(0, 0.22 * noise)), 0.05, 1);
        const res = simulateShot(course, pos, { angle, power });
        itemT += pathDurationMs(res.path);
        if (itemT > GOLF_ITEM_MS - 200) break;
        pos = res.end;
        const last = res.holed || stroke === GOLF_STROKES;
        if (last) {
          const pts = res.holed ? HOLED_POINTS[stroke] : nearPoints(Math.hypot(pos[0] - course.hole[0], pos[1] - course.hole[1]) - HOLE_R);
          events.push({ t: Math.round(t + itemT), item: i, points: pts, correct: res.holed, done: true });
          break;
        }
      }
      t += Math.min(itemT, GOLF_ITEM_MS) + FEEDBACK_MS;
    });
    return { events, durationMs: Math.min(Math.round(t), this.timeLimit) };
  },
};
