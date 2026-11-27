import { HOLE_R, pathDurationMs, simulateShot, type Course, type Pt } from '../golf/physics';
import { bestShot, distanceField, generateRoundCourses } from '../golf/levels';
import { clamp } from '../rng';
import { isNum } from './sim';
import { botAccuracy, botSpeedFactor, sumScore, type GameMode, type ReplayEvent, type RoundContent } from './types';

export type GolfContent = RoundContent<Course>;

export const GOLF_HOLES = 3;
export const GOLF_STROKES = 3;
export const GOLF_ITEM_MS = 25_000;
const FEEDBACK_MS = 1_800;
/** After the ball stops: time for the win effect (holed) or to see where it ended. */
const AFTER_HOLED_MS = 1_200;
const AFTER_MISS_MS = 1_400;
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
  // Extra room for long final rolls, which delay the next hole (see nextDelayMs).
  timeLimit: GOLF_HOLES * (GOLF_ITEM_MS + FEEDBACK_MS) + 6_000,

  generateRound(rng) {
    return { items: generateRoundCourses(rng) };
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
    if (res.holed) return { correct: true, points: HOLED_POINTS[s.strokes], itemDone: true, feedback: base, nextDelayMs: base.animMs + AFTER_HOLED_MS };
    if (s.strokes >= GOLF_STROKES) {
      const dist = Math.hypot(res.end[0] - course.hole[0], res.end[1] - course.hole[1]) - HOLE_R;
      return { correct: false, points: nearPoints(dist), itemDone: true, feedback: base, nextDelayMs: base.animMs + AFTER_MISS_MS };
    }
    return { correct: false, points: 0, itemDone: false, feedback: base };
  },

  timeoutFeedback() {
    return {};
  },

  scoreRound: sumScore,

  /** Bot: plans each shot with the solver (around walls, through gaps) and adds rating-based noise. */
  simulateBot(content, rating, rng) {
    const events: ReplayEvent[] = [];
    const speed = botSpeedFactor(rating);
    const noise = 1.15 - botAccuracy(rating); // ~0.5 at 1500
    let t = 0;
    content.items.forEach((course, i) => {
      let pos: Pt = [...course.start];
      let itemT = 0;
      const field = distanceField(course);
      for (let stroke = 1; stroke <= GOLF_STROKES; stroke++) {
        itemT += clamp(rng.normal(4_000 * speed, 1_200), 1_500, 8_000);
        // Plan the best shot around the walls, then miss it a little, more so for weaker bots.
        const plan = bestShot(course, pos, field, 28, 5, 16).shot;
        const angle = plan.angle + rng.normal(0, 0.06 * noise);
        const power = clamp(plan.power * (1 + rng.normal(0, 0.16 * noise)), 0.05, 1);
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
