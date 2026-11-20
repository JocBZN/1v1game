import type { DomainId, RatingTrack } from '../domains';
import { DOMAIN_IDS } from '../domains';
import { leagueFor } from '../leagues';
import { getMode } from '../modes';
import type { GameMode, ReplayEvent, RoundContent } from '../modes/types';
import { countRoundWins, duelWinner, isDuelOver, roundWinner, type RoundOutcome } from './logic';

export const INTRO_MS = 3600;
export const ROUND_RESULT_MS = 3800;
export const DISCONNECT_FORFEIT_MS = 15_000;

export type Slot = 0 | 1;
export type SlotKind = 'human' | 'ghost' | 'bot';

export interface RatingSnap {
  rating: number;
  rd: number;
  vol: number;
}

export interface SlotInit {
  kind: SlotKind;
  userId: number | null;
  name: string;
  /** Snapshot at duel start (humans) or fixed rating (ghost/bot). */
  ratings: Record<RatingTrack, RatingSnap>;
}

/** Pre-scripted play for a non-human slot (a ghost recording or a simulated bot). */
export interface Script {
  events: ReplayEvent[];
  durationMs: number;
}

export interface RoundPlan {
  domain: DomainId;
  content: RoundContent;
  scripts: [Script | null, Script | null];
}

export interface RoundSummary {
  domain: DomainId;
  scores: [number, number];
  winner: RoundOutcome;
}

export interface DuelSummary {
  rounds: RoundSummary[];
  roundWins: [number, number];
  totals: [number, number];
  winner: RoundOutcome;
  forfeitSlot: Slot | null;
}

export interface RoundRecording {
  domain: DomainId;
  content: RoundContent;
  events: ReplayEvent[];
  score: number;
  durationMs: number;
}

export interface DuelHooks {
  emit(userId: number, event: string, data: unknown): void;
  /** Called at the end of each completed round for each human who actually played it. */
  onRoundRecorded(slot: Slot, rec: RoundRecording): void;
  /** Persist results / ratings; returns the per-slot payload added to `duel:end`. */
  onFinish(summary: DuelSummary): [unknown, unknown];
  /** Duel object can be dropped. */
  onClosed(): void;
}

interface PlayerRound {
  index: number;
  itemStart: number;
  itemState: Record<string, unknown>;
  results: { points: number }[];
  events: ReplayEvent[];
  score: number;
  finished: boolean;
  finishedAt: number | null;
  /** Between items (feedback is being shown). */
  pending: boolean;
  wasDisconnected: boolean;
}

interface RoundState {
  index: number;
  plan: RoundPlan;
  mode: GameMode;
  startedAt: number;
  deadline: number;
  players: [PlayerRound, PlayerRound];
  ended: boolean;
}

type Phase = 'intro' | 'playing' | 'result' | 'ended';

const newPlayerRound = (): PlayerRound => ({
  index: -1, itemStart: 0, itemState: {}, results: [], events: [], score: 0,
  finished: false, finishedAt: null, pending: false, wasDisconnected: false,
});

export class Duel {
  readonly slots: [SlotInit & { connected: boolean }, SlotInit & { connected: boolean }];
  phase: Phase = 'intro';
  roundIndex = -1;
  round: RoundState | null = null;
  readonly outcomes: RoundOutcome[] = [];
  readonly summaries: RoundSummary[] = [];
  private phaseEndsAt = 0;
  private timers = new Set<NodeJS.Timeout>();
  private disconnectTimers: [NodeJS.Timeout | null, NodeJS.Timeout | null] = [null, null];
  private now: () => number;

  constructor(
    readonly id: string,
    slots: [SlotInit, SlotInit],
    readonly plans: RoundPlan[],
    private hooks: DuelHooks,
    opts: { now?: () => number } = {},
  ) {
    this.slots = [
      { ...slots[0], connected: true },
      { ...slots[1], connected: true },
    ];
    this.now = opts.now ?? Date.now;
  }

  // ------------------------------------------------------------------ helpers

  private later(ms: number, fn: () => void) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, Math.max(0, ms));
    this.timers.add(t);
    return t;
  }

  private clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  private send(slot: Slot, event: string, data: unknown) {
    const s = this.slots[slot];
    if (s.kind === 'human' && s.userId !== null) this.hooks.emit(s.userId, event, data);
  }

  slotOf(userId: number): Slot | null {
    if (this.slots[0].kind === 'human' && this.slots[0].userId === userId) return 0;
    if (this.slots[1].kind === 'human' && this.slots[1].userId === userId) return 1;
    return null;
  }

  private publicPlayer(slot: Slot) {
    const s = this.slots[slot];
    const r = s.ratings.general.rating;
    return { name: s.name, rating: Math.round(r), league: leagueFor(r).id, async: s.kind !== 'human' };
  }

  private roundWinsFor(slot: Slot): [number, number] {
    const [a, b] = countRoundWins(this.outcomes);
    return slot === 0 ? [a, b] : [b, a];
  }

  foundPayload(slot: Slot) {
    return {
      duelId: this.id,
      you: this.publicPlayer(slot),
      opponent: this.publicPlayer((1 - slot) as Slot),
      rounds: this.plans.length,
      domains: DOMAIN_IDS,
    };
  }

  // ------------------------------------------------------------------ flow

  start() {
    for (const slot of [0, 1] as Slot[]) this.send(slot, 'duel:found', this.foundPayload(slot));
    this.later(400, () => this.intro(0));
  }

  private intro(i: number) {
    this.phase = 'intro';
    this.roundIndex = i;
    this.round = null;
    this.phaseEndsAt = this.now() + INTRO_MS;
    const plan = this.plans[i];
    for (const slot of [0, 1] as Slot[]) {
      this.send(slot, 'round:intro', { index: i, domain: plan.domain, roundWins: this.roundWinsFor(slot), durationMs: INTRO_MS });
    }
    this.later(INTRO_MS, () => this.beginRound(i));
  }

  private beginRound(i: number) {
    const plan = this.plans[i];
    const mode = getMode(plan.domain);
    const now = this.now();
    const round: RoundState = {
      index: i, plan, mode, startedAt: now, deadline: now + mode.timeLimit,
      players: [newPlayerRound(), newPlayerRound()], ended: false,
    };
    this.round = round;
    this.phase = 'playing';
    for (const slot of [0, 1] as Slot[]) {
      if (!this.slots[slot].connected) round.players[slot].wasDisconnected = true;
      this.send(slot, 'round:start', {
        index: i, domain: plan.domain, timeLimit: mode.timeLimit, remainingMs: mode.timeLimit,
        itemCount: plan.content.items.length,
      });
    }
    for (const slot of [0, 1] as Slot[]) {
      const script = plan.scripts[slot];
      if (this.slots[slot].kind === 'human') this.sendItem(slot, 0);
      else if (script) this.playScript(slot, script);
      else this.finishPlayer(slot);
    }
    this.emitScores();
    this.later(mode.timeLimit, () => this.endRound());
  }

  private sendItem(slot: Slot, index: number) {
    const round = this.round!;
    const pr = round.players[slot];
    pr.pending = false;
    if (index >= round.plan.content.items.length) return this.finishPlayer(slot);
    const now = this.now();
    if (now >= round.deadline) return;
    pr.index = index;
    pr.itemStart = now;
    pr.itemState = {};
    const remainingRound = round.deadline - now;
    const itemLimit = round.mode.itemTimeLimit ? Math.min(round.mode.itemTimeLimit, remainingRound) : null;
    this.send(slot, 'round:item', {
      round: round.index,
      item: index,
      data: round.mode.publicItem(round.plan.content, index),
      itemTimeLimit: itemLimit,
      roundRemainingMs: remainingRound,
    });
    if (itemLimit !== null) {
      this.later(itemLimit, () => this.itemTimeout(slot, round.index, index));
    }
  }

  private itemTimeout(slot: Slot, roundIdx: number, index: number) {
    const round = this.round;
    if (!round || round.ended || round.index !== roundIdx) return;
    const pr = round.players[slot];
    if (pr.finished || pr.pending || pr.index !== index) return;
    const t = this.now() - round.startedAt;
    pr.results.push({ points: 0 });
    pr.events.push({ t, item: index, points: 0, correct: false, done: true });
    this.send(slot, 'round:feedback', {
      round: round.index, item: index, correct: false, points: 0, score: pr.score, itemDone: true, timeout: true,
      ...round.mode.timeoutFeedback(round.plan.content, index),
    });
    this.advance(slot, index);
  }

  private advance(slot: Slot, index: number) {
    const round = this.round!;
    const pr = round.players[slot];
    pr.pending = true;
    const delay = round.mode.feedbackDelay;
    if (delay <= 0) this.sendItem(slot, index + 1);
    else this.later(delay, () => {
      if (this.round === round && !round.ended) this.sendItem(slot, index + 1);
    });
  }

  /** Handle `round:answer` from a human. Everything is checked here; the client is never trusted. */
  answer(userId: number, payload: unknown) {
    const slot = this.slotOf(userId);
    const round = this.round;
    if (slot === null || !round || round.ended || this.phase !== 'playing') return;
    const p = (payload ?? {}) as { round?: unknown; item?: unknown; answer?: unknown };
    const pr = round.players[slot];
    if (p.round !== round.index || p.item !== pr.index || pr.finished || pr.pending) return;

    const now = this.now();
    const elapsedMs = now - pr.itemStart;
    const itemLimit = round.mode.itemTimeLimit;
    if (now > round.deadline || (itemLimit !== undefined && elapsedMs > itemLimit)) {
      // Too late: not scored. The timeout handler (or round end) takes care of moving on.
      this.send(slot, 'round:late', { round: round.index, item: pr.index });
      return;
    }

    const result = round.mode.validateAnswer(round.plan.content, pr.index, p.answer, { elapsedMs, itemState: pr.itemState });
    if (result.points !== 0 || result.itemDone) pr.results.push({ points: result.points });
    pr.score = round.mode.scoreRound(pr.results);
    pr.events.push({ t: now - round.startedAt, item: pr.index, points: result.points, correct: result.correct, done: result.itemDone });

    this.send(slot, 'round:feedback', {
      round: round.index, item: pr.index, correct: result.correct, points: result.points,
      score: pr.score, itemDone: result.itemDone, ...(result.feedback ?? {}),
    });
    this.emitScores();
    if (result.itemDone) this.advance(slot, pr.index);
  }

  /** Replays a ghost recording / bot simulation with its original timing. */
  private playScript(slot: Slot, script: Script) {
    const round = this.round!;
    const pr = round.players[slot];
    pr.index = 0;
    for (const ev of script.events) {
      if (ev.t > round.mode.timeLimit) continue;
      this.later(ev.t, () => {
        if (this.round !== round || round.ended) return;
        if (ev.points !== 0 || ev.done) pr.results.push({ points: ev.points });
        pr.score = round.mode.scoreRound(pr.results);
        pr.events.push(ev);
        pr.index = ev.done ? ev.item + 1 : ev.item;
        this.emitScores();
      });
    }
    const end = Math.min(script.durationMs, round.mode.timeLimit);
    this.later(end, () => {
      if (this.round === round && !round.ended) this.finishPlayer(slot);
    });
  }

  private finishPlayer(slot: Slot) {
    const round = this.round!;
    const pr = round.players[slot];
    if (pr.finished) return;
    pr.finished = true;
    pr.finishedAt = this.now();
    this.send(slot, 'round:wait', { round: round.index });
    this.emitScores();
    if (round.players.every((p) => p.finished)) {
      // Short beat so the last feedback is visible before the round result.
      this.later(700, () => this.endRound());
    }
  }

  private emitScores() {
    const round = this.round;
    if (!round) return;
    const total = round.plan.content.items.length;
    for (const slot of [0, 1] as Slot[]) {
      const me = round.players[slot];
      const op = round.players[1 - slot];
      this.send(slot, 'round:scores', {
        round: round.index,
        you: me.score,
        opponent: op.score,
        opponentProgress: Math.min(op.finished ? total : Math.max(op.index, 0), total),
        opponentFinished: op.finished,
        itemCount: total,
      });
    }
  }

  private endRound() {
    const round = this.round;
    if (!round || round.ended) return;
    round.ended = true;
    this.clearTimers();
    for (const pr of round.players) if (!pr.finished) {
      pr.finished = true;
      pr.finishedAt = Math.min(this.now(), round.deadline);
    }

    const scores: [number, number] = [round.players[0].score, round.players[1].score];
    const winner = roundWinner(scores[0], scores[1]);
    this.outcomes.push(winner);
    this.summaries.push({ domain: round.plan.domain, scores, winner });

    for (const slot of [0, 1] as Slot[]) {
      const pr = round.players[slot];
      if (this.slots[slot].kind === 'human' && !pr.wasDisconnected && pr.events.length > 0) {
        try {
          this.hooks.onRoundRecorded(slot, {
            domain: round.plan.domain,
            content: round.plan.content,
            events: pr.events,
            score: pr.score,
            durationMs: (pr.finishedAt ?? round.deadline) - round.startedAt,
          });
        } catch (e) {
          console.error('[duel] recording failed', e);
        }
      }
    }

    this.phase = 'result';
    this.phaseEndsAt = this.now() + ROUND_RESULT_MS;
    const over = isDuelOver(this.outcomes);
    for (const slot of [0, 1] as Slot[]) {
      this.send(slot, 'round:end', {
        index: round.index,
        domain: round.plan.domain,
        you: scores[slot],
        opponent: scores[1 - slot],
        winner: winner === null ? 'tie' : winner === slot ? 'you' : 'opponent',
        roundWins: this.roundWinsFor(slot),
        last: over,
        durationMs: ROUND_RESULT_MS,
      });
    }

    if (over) this.later(ROUND_RESULT_MS, () => this.finish(null));
    else this.later(ROUND_RESULT_MS, () => this.intro(round.index + 1));
  }

  private finish(forfeitSlot: Slot | null) {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.clearTimers();
    for (const t of this.disconnectTimers) if (t) clearTimeout(t);

    const totals: [number, number] = [0, 0];
    for (const s of this.summaries) {
      totals[0] += s.scores[0];
      totals[1] += s.scores[1];
    }
    const summary: DuelSummary = {
      rounds: this.summaries,
      roundWins: countRoundWins(this.outcomes),
      totals,
      winner: duelWinner(this.outcomes, totals, forfeitSlot),
      forfeitSlot,
    };

    let extra: [unknown, unknown] = [null, null];
    try {
      extra = this.hooks.onFinish(summary);
    } catch (e) {
      console.error('[duel] onFinish failed', e);
    }

    for (const slot of [0, 1] as Slot[]) {
      const other = (1 - slot) as Slot;
      this.send(slot, 'duel:end', {
        duelId: this.id,
        result: summary.winner === null ? 'draw' : summary.winner === slot ? 'win' : 'loss',
        forfeit: forfeitSlot === null ? null : forfeitSlot === slot ? 'you' : 'opponent',
        rounds: summary.rounds.map((r) => ({
          domain: r.domain,
          you: r.scores[slot],
          opponent: r.scores[other],
          winner: r.winner === null ? 'tie' : r.winner === slot ? 'you' : 'opponent',
        })),
        roundWins: this.roundWinsFor(slot),
        totals: [totals[slot], totals[other]],
        opponent: this.publicPlayer(other),
        ...((extra[slot] as object) ?? {}),
      });
    }
    this.hooks.onClosed();
  }

  // ------------------------------------------------------------------ connection

  forfeit(userId: number) {
    const slot = this.slotOf(userId);
    if (slot === null || this.phase === 'ended') return;
    this.finish(slot);
  }

  disconnected(userId: number) {
    const slot = this.slotOf(userId);
    if (slot === null || this.phase === 'ended') return;
    this.slots[slot].connected = false;
    if (this.round && !this.round.ended) this.round.players[slot].wasDisconnected = true;
    this.send((1 - slot) as Slot, 'duel:opponent-status', { connected: false, graceMs: DISCONNECT_FORFEIT_MS });
    const prev = this.disconnectTimers[slot];
    if (prev) clearTimeout(prev);
    this.disconnectTimers[slot] = setTimeout(() => {
      this.disconnectTimers[slot] = null;
      if (!this.slots[slot].connected) this.finish(slot);
    }, DISCONNECT_FORFEIT_MS);
  }

  reconnected(userId: number) {
    const slot = this.slotOf(userId);
    if (slot === null || this.phase === 'ended') return;
    this.slots[slot].connected = true;
    const t = this.disconnectTimers[slot];
    if (t) clearTimeout(t);
    this.disconnectTimers[slot] = null;
    this.send((1 - slot) as Slot, 'duel:opponent-status', { connected: true });
    this.send(slot, 'duel:resume', this.resumeSnapshot(slot));
  }

  /** Full state for a client that reconnects mid-duel. */
  resumeSnapshot(slot: Slot) {
    const now = this.now();
    const round = this.round;
    const plan = this.plans[this.roundIndex];
    const base = {
      found: this.foundPayload(slot),
      phase: this.phase,
      roundIndex: this.roundIndex,
      domain: plan?.domain ?? null,
      roundWins: this.roundWinsFor(slot),
      phaseRemainingMs: Math.max(0, this.phaseEndsAt - now),
      lastRound: this.summaries.length > 0 ? (() => {
        const s = this.summaries[this.summaries.length - 1];
        return { you: s.scores[slot], opponent: s.scores[1 - slot], winner: s.winner === null ? 'tie' : s.winner === slot ? 'you' : 'opponent' };
      })() : null,
    };
    if (!round || round.ended || this.phase !== 'playing') return { ...base, round: null };
    const pr = round.players[slot];
    const op = round.players[1 - slot];
    const itemLimit = round.mode.itemTimeLimit;
    const item = !pr.finished && !pr.pending && pr.index >= 0
      ? {
          round: round.index,
          item: pr.index,
          data: round.mode.publicItemState
            ? round.mode.publicItemState(round.plan.content, pr.index, pr.itemState)
            : round.mode.publicItem(round.plan.content, pr.index),
          itemTimeLimit: itemLimit ? Math.max(0, Math.min(itemLimit - (now - pr.itemStart), round.deadline - now)) : null,
          roundRemainingMs: round.deadline - now,
        }
      : null;
    return {
      ...base,
      round: {
        index: round.index,
        domain: round.plan.domain,
        timeLimit: round.mode.timeLimit,
        remainingMs: Math.max(0, round.deadline - now),
        itemCount: round.plan.content.items.length,
        you: pr.score,
        opponent: op.score,
        finished: pr.finished,
      },
      item,
    };
  }
}
