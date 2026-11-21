import { Suspense, useEffect, useRef, useState } from 'react';
import { DOMAINS } from '../lib/domains';
import { MODE_COMPONENTS } from '../modes/registry';
import { useDuel } from '../state/duel';
import { AsyncTag, Avatar, SecondsLeft, TimerBar, useAnimatedNumber } from '../components/ui';

function LiveScore({ name, score, side, async: isAsync, sub }: { name: string; score: number; side: 'me' | 'foe'; async?: boolean; sub?: string }) {
  const shown = useAnimatedNumber(score);
  const prev = useRef(score);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (score > prev.current) setBump((b) => b + 1);
    prev.current = score;
  }, [score]);
  const color = side === 'me' ? 'text-me' : 'text-foe';
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${side === 'foe' ? 'flex-row-reverse text-right' : ''}`}>
      <Avatar name={name} size={32} ring={side === 'me' ? 'var(--color-cyan)' : 'var(--color-red)'} />
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-muted">{name}</div>
        <div key={bump} className={`text-2xl font-bold tabular-nums leading-tight tracking-tight ${color} ${bump ? 'animate-score' : ''}`}>{shown}</div>
        {(sub || isAsync) && (
          <div className={`flex items-center gap-1 text-[10px] font-medium text-muted ${side === 'foe' ? 'justify-end' : ''}`}>
            {isAsync && <AsyncTag />}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export function RoundScreen() {
  const { state, answer, forfeit } = useDuel();
  const { found, round, item, feedback, scores, waiting } = state;
  const [confirmQuit, setConfirmQuit] = useState(false);
  if (!found || !round) return null;
  const meta = DOMAINS[round.domain];
  const Mode = MODE_COMPONENTS[round.domain];

  const oppSub = scores.opponentFinished
    ? 'finished'
    : scores.itemCount > 1 && scores.itemCount <= 20
      ? `${Math.min(scores.opponentProgress + 1, scores.itemCount)}/${scores.itemCount}`
      : undefined;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pt-3 safe-bottom">
      {/* Live scoreboard */}
      <div className="card rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <LiveScore name={found.you.name} score={scores.you} side="me" />
          <div className="flex flex-col items-center px-1">
            <div className="label text-[10px]">R{round.index + 1}</div>
            <div className="text-sm font-semibold tabular-nums">
              <span className="text-me">{state.roundWins[0]}</span>
              <span className="text-line-strong">:</span>
              <span className="text-foe">{state.roundWins[1]}</span>
            </div>
          </div>
          <LiveScore name={found.opponent.name} score={scores.opponent} side="foe" async={found.opponent.async} sub={oppSub} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm">{meta.emoji}</span>
          <TimerBar endsAt={round.endsAt} totalMs={round.timeLimit} />
          <SecondsLeft endsAt={round.endsAt} className="w-9 text-right text-xs font-semibold" />
        </div>
      </div>

      {!state.opponentConnected && (
        <div className="mt-2 rounded-xl bg-orange-soft px-3 py-2 text-center text-xs font-medium text-orange-strong">
          Your opponent disconnected… if they’re not back in 15s, you win.
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        {Mode ? (
          <Suspense fallback={<div className="m-auto text-muted">Loading…</div>}>
            <Mode item={item} feedback={feedback} onAnswer={answer} waiting={waiting} />
          </Suspense>
        ) : (
          <div className="m-auto text-muted">Unknown mode.</div>
        )}
      </div>

      <div className="flex justify-center pb-1">
        {confirmQuit ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted">Forfeit the duel?</span>
            <button className="font-semibold text-red" onClick={forfeit}>Yes</button>
            <button className="font-semibold text-muted" onClick={() => setConfirmQuit(false)}>No</button>
          </div>
        ) : (
          <button className="text-xs text-muted/70 hover:text-text" onClick={() => setConfirmQuit(true)}>Forfeit</button>
        )}
      </div>
    </div>
  );
}
