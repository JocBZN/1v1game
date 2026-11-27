import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { League } from '../lib/api';
import type { DomainId } from '../lib/domains';
import { getSocket } from '../lib/socket';

export interface PlayerInfo {
  name: string;
  avatar?: string | null;
  rating: number;
  league: League['id'];
  async: boolean;
}

export interface Found {
  duelId: string;
  you: PlayerInfo;
  opponent: PlayerInfo;
  rounds: number;
  domains: DomainId[];
}

export interface CurrentItem<T = any> {
  round: number;
  item: number;
  data: T;
  /** Local timestamp when this item's own timer expires (null = only the round timer). */
  endsAt: number | null;
  limitMs: number | null;
}

export interface FeedbackData {
  round: number;
  item: number;
  correct: boolean;
  points: number;
  score: number;
  itemDone: boolean;
  timeout?: boolean;
  [k: string]: unknown;
}

export type Feedback = FeedbackData & { seq: number };

export interface RoundEnd {
  index: number;
  domain: DomainId;
  you: number;
  opponent: number;
  winner: 'you' | 'opponent' | 'tie';
  roundWins: [number, number];
  last: boolean;
  endsAt: number;
}

export interface RatingChange {
  before: number;
  after: number;
}

export interface DuelResult {
  duelId: string;
  result: 'win' | 'loss' | 'draw';
  forfeit: 'you' | 'opponent' | null;
  rounds: { domain: DomainId; you: number; opponent: number; winner: 'you' | 'opponent' | 'tie' }[];
  roundWins: [number, number];
  totals: [number, number];
  opponent: PlayerInfo;
  ratingChanges?: Partial<Record<'general' | DomainId, RatingChange>>;
  /** why the overall rating moved as much as it did */
  ratingFactors?: { streak: number; streakX: number; marginX: number; recordX: number; total: number };
  league?: { before: League['id']; after: League['id'] };
  /** Played in a private room: no rating change. */
  friendly?: boolean;
  /** Practice duel against a bot on one chosen game ("Select game"). */
  practice?: DomainId;
}

export interface RoomMember {
  name: string;
  ready: boolean;
  online: boolean;
}

export interface RoomState {
  code: string;
  you: 'host' | 'guest';
  host: RoomMember;
  guest: RoomMember | null;
  inDuel: boolean;
  duels: number;
  /** Your wins, their wins in this room. */
  score: [number, number];
}

export type RoomError = 'not_found' | 'full' | 'busy';

/** /c/K7QX2 → "K7QX2" (the app is opened from a friend's link). */
function codeFromPath(): string | null {
  const m = location.pathname.match(/^\/c\/([A-Za-z0-9]{5})\/?$/);
  return m ? m[1].toUpperCase() : null;
}

export type Phase = 'idle' | 'searching' | 'found' | 'intro' | 'playing' | 'roundEnd' | 'result';

export interface DuelState {
  phase: Phase;
  searchSince: number | null;
  found: Found | null;
  roundIndex: number;
  domain: DomainId | null;
  roundWins: [number, number];
  introEndsAt: number;
  round: { index: number; domain: DomainId; timeLimit: number; endsAt: number; itemCount: number } | null;
  item: CurrentItem | null;
  feedback: Feedback | null;
  scores: { you: number; opponent: number; opponentProgress: number; opponentFinished: boolean; itemCount: number };
  waiting: boolean;
  roundEnd: RoundEnd | null;
  result: DuelResult | null;
  opponentConnected: boolean;
  connected: boolean;
  replaced: boolean;
}

const initial: DuelState = {
  phase: 'idle',
  searchSince: null,
  found: null,
  roundIndex: -1,
  domain: null,
  roundWins: [0, 0],
  introEndsAt: 0,
  round: null,
  item: null,
  feedback: null,
  scores: { you: 0, opponent: 0, opponentProgress: 0, opponentFinished: false, itemCount: 0 },
  waiting: false,
  roundEnd: null,
  result: null,
  opponentConnected: true,
  connected: false,
  replaced: false,
};

type Action =
  | { type: 'connected'; value: boolean }
  | { type: 'replaced' }
  | { type: 'queue:joined' }
  | { type: 'queue:left' }
  | { type: 'duel:found'; data: Found }
  | { type: 'round:intro'; data: { index: number; domain: DomainId; roundWins: [number, number]; durationMs: number } }
  | { type: 'round:start'; data: { index: number; domain: DomainId; timeLimit: number; remainingMs: number; itemCount: number } }
  | { type: 'round:item'; data: { round: number; item: number; data: unknown; itemTimeLimit: number | null } }
  | { type: 'round:feedback'; data: FeedbackData }
  | { type: 'round:scores'; data: DuelState['scores'] & { round: number } }
  | { type: 'round:wait' }
  | { type: 'round:end'; data: Omit<RoundEnd, 'endsAt'> & { durationMs: number } }
  | { type: 'duel:end'; data: DuelResult }
  | { type: 'opponent'; connected: boolean }
  | { type: 'resume'; data: any }
  | { type: 'reset' };

let seq = 0;

function reducer(s: DuelState, a: Action): DuelState {
  const now = performance.now();
  switch (a.type) {
    case 'connected':
      return { ...s, connected: a.value };
    case 'replaced':
      return { ...s, replaced: true };
    case 'queue:joined':
      return { ...initial, connected: s.connected, phase: 'searching', searchSince: s.searchSince ?? Date.now() };
    case 'queue:left':
      return s.phase === 'searching' ? { ...s, phase: 'idle', searchSince: null } : s;
    case 'duel:found':
      return { ...initial, connected: s.connected, phase: 'found', found: a.data };
    case 'round:intro':
      return {
        ...s, phase: 'intro', roundIndex: a.data.index, domain: a.data.domain, roundWins: a.data.roundWins,
        introEndsAt: now + a.data.durationMs, round: null, item: null, feedback: null, waiting: false, roundEnd: null,
        scores: { ...initial.scores },
      };
    case 'round:start':
      return {
        ...s, phase: 'playing', roundIndex: a.data.index, domain: a.data.domain,
        round: { index: a.data.index, domain: a.data.domain, timeLimit: a.data.timeLimit, endsAt: now + a.data.remainingMs, itemCount: a.data.itemCount },
        item: null, feedback: null, waiting: false,
        scores: { ...initial.scores, itemCount: a.data.itemCount },
      };
    case 'round:item':
      return {
        ...s,
        item: {
          round: a.data.round, item: a.data.item, data: a.data.data,
          endsAt: a.data.itemTimeLimit != null ? now + a.data.itemTimeLimit : null,
          limitMs: a.data.itemTimeLimit,
        },
      };
    case 'round:feedback':
      return { ...s, feedback: { ...a.data, seq: ++seq }, scores: { ...s.scores, you: a.data.score } };
    case 'round:scores':
      if (s.round && a.data.round !== s.round.index) return s;
      return { ...s, scores: { you: a.data.you, opponent: a.data.opponent, opponentProgress: a.data.opponentProgress, opponentFinished: a.data.opponentFinished, itemCount: a.data.itemCount } };
    case 'round:wait':
      return { ...s, waiting: true };
    case 'round:end':
      return { ...s, phase: 'roundEnd', roundWins: a.data.roundWins, roundEnd: { ...a.data, endsAt: now + a.data.durationMs } };
    case 'duel:end':
      return { ...s, phase: 'result', result: a.data, searchSince: null };
    case 'opponent':
      return { ...s, opponentConnected: a.connected };
    case 'resume': {
      const d = a.data;
      const base: DuelState = {
        ...initial, connected: s.connected, found: d.found, roundIndex: d.roundIndex, domain: d.domain,
        roundWins: d.roundWins,
      };
      if (d.phase === 'intro') return { ...base, phase: 'intro', introEndsAt: now + d.phaseRemainingMs };
      if (d.phase === 'result' && d.lastRound) {
        return {
          ...base, phase: 'roundEnd',
          roundEnd: { index: d.roundIndex, domain: d.domain, ...d.lastRound, roundWins: d.roundWins, last: false, endsAt: now + d.phaseRemainingMs },
        };
      }
      if (d.phase === 'playing' && d.round) {
        const r = d.round;
        return {
          ...base, phase: 'playing',
          round: { index: r.index, domain: r.domain, timeLimit: r.timeLimit, endsAt: now + r.remainingMs, itemCount: r.itemCount },
          scores: { you: r.you, opponent: r.opponent, opponentProgress: 0, opponentFinished: false, itemCount: r.itemCount },
          waiting: r.finished,
          item: d.item
            ? { round: d.item.round, item: d.item.item, data: d.item.data, endsAt: d.item.itemTimeLimit != null ? now + d.item.itemTimeLimit : null, limitMs: d.item.itemTimeLimit }
            : null,
        };
      }
      return { ...base, phase: 'found' };
    }
    case 'reset':
      return { ...initial, connected: s.connected };
  }
}

interface DuelApi {
  state: DuelState;
  room: RoomState | null;
  roomError: RoomError | null;
  /** True while joining from a /c/<code> link. */
  joining: boolean;
  createRoom(): void;
  /** Duel against a bot where every round is `domain`. */
  practice(domain: DomainId): void;
  joinRoom(code: string): void;
  rematch(): void;
  leaveRoom(): void;
  clearRoomError(): void;
  play(): void;
  cancel(): void;
  answer(answer: unknown): void;
  forfeit(): void;
  reset(): void;
}

const Ctx = createContext<DuelApi | null>(null);

export function DuelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomError, setRoomError] = useState<RoomError | null>(null);
  const pendingCode = useRef<string | null>(codeFromPath());
  const [joining, setJoining] = useState(pendingCode.current !== null);

  useEffect(() => {
    const s = getSocket();
    const on = <T,>(ev: string, fn: (d: T) => void) => {
      s.on(ev, fn);
      return () => void s.off(ev, fn);
    };
    const joinPending = () => {
      const code = pendingCode.current;
      if (!code) return;
      pendingCode.current = null;
      history.replaceState(null, '', '/' + location.hash);
      s.emit('room:join', { code });
    };
    const offs = [
      on('connect', () => {
        dispatch({ type: 'connected', value: true });
        joinPending();
      }),
      on<RoomState>('room:state', (r) => {
        setRoom(r);
        setRoomError(null);
        setJoining(false);
      }),
      on('room:closed', () => setRoom(null)),
      on<{ error: RoomError }>('room:error', (d) => {
        setRoomError(d.error);
        setJoining(false);
      }),
      on('disconnect', () => dispatch({ type: 'connected', value: false })),
      on('session:replaced', () => dispatch({ type: 'replaced' })),
      on('queue:joined', () => dispatch({ type: 'queue:joined' })),
      on('queue:left', () => dispatch({ type: 'queue:left' })),
      on<Found>('duel:found', (data) => dispatch({ type: 'duel:found', data })),
      on<any>('round:intro', (data) => dispatch({ type: 'round:intro', data })),
      on<any>('round:start', (data) => dispatch({ type: 'round:start', data })),
      on<any>('round:item', (data) => dispatch({ type: 'round:item', data })),
      on<any>('round:feedback', (data) => dispatch({ type: 'round:feedback', data })),
      on<any>('round:scores', (data) => dispatch({ type: 'round:scores', data })),
      on('round:wait', () => dispatch({ type: 'round:wait' })),
      on<any>('round:end', (data) => dispatch({ type: 'round:end', data })),
      on<DuelResult>('duel:end', (data) => dispatch({ type: 'duel:end', data })),
      on<{ connected: boolean }>('duel:opponent-status', (d) => dispatch({ type: 'opponent', connected: d.connected })),
      on<any>('duel:resume', (data) => dispatch({ type: 'resume', data })),
      // The server has no duel for us: drop a stale duel screen, or re-join the queue if we were searching.
      on('duel:none', () => {
        const phase = stateRef.current.phase;
        if (phase === 'searching') s.emit('queue:join');
        else if (phase === 'found' || phase === 'intro' || phase === 'playing' || phase === 'roundEnd') dispatch({ type: 'reset' });
      }),
    ];
    if (s.connected) {
      dispatch({ type: 'connected', value: true });
      joinPending();
    }
    return () => offs.forEach((off) => off());
  }, []);

  const api = useMemo<DuelApi>(() => ({
    state,
    room,
    roomError,
    joining,
    createRoom: () => {
      setRoomError(null);
      getSocket().emit('room:create');
    },
    joinRoom: (code) => {
      setRoomError(null);
      getSocket().emit('room:join', { code });
    },
    practice: (domain) => {
      getSocket().emit('practice:start', { domain });
    },
    rematch: () => {
      dispatch({ type: 'reset' });
      getSocket().emit('room:rematch');
    },
    leaveRoom: () => {
      getSocket().emit('room:leave');
      setRoom(null);
      dispatch({ type: 'reset' });
    },
    clearRoomError: () => setRoomError(null),
    play: () => {
      dispatch({ type: 'queue:joined' });
      getSocket().emit('queue:join');
    },
    cancel: () => {
      getSocket().emit('queue:leave');
      dispatch({ type: 'queue:left' });
    },
    answer: (answer) => {
      const st = stateRef.current;
      if (!st.item) return;
      getSocket().emit('round:answer', { round: st.item.round, item: st.item.item, answer });
    },
    forfeit: () => getSocket().emit('duel:forfeit'),
    reset: () => dispatch({ type: 'reset' }),
  }), [state, room, roomError, joining]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDuel(): DuelApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDuel outside DuelProvider');
  return v;
}
