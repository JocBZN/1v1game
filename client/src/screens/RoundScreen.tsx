import { useEffect, useRef, useState } from 'react';
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
      <Avatar name={name} size={36} ring={side === 'me' ? 'var(--color-me)' : 'var(--color-foe)'} />
      <div className="min-w-0">
        <div className="truncate text-xs font-bold text-muted">{name}</div>
        <div key={bump} className={`text-2xl font-black tabular-nums leading-tight ${color} ${bump ? 'animate-score' : ''}`}>{shown}</div>
        {(sub || isAsync) && (
          <div className={`flex items-center gap-1 text-[10px] font-semibold text-muted ${side === 'foe' ? 'justify-end' : ''}`}>
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
    : scores.itemCount && scores.itemCount <= 20
      ? `${Math.min(scores.opponentProgress + 1, scores.itemCount)}/${scores.itemCount}`
      : undefined;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pt-3 safe-bottom">
      {/* Live scoreboard */}
      <div className="rounded-2xl border border-line bg-panel/80 p-3 shadow-xl">
        <div className="flex items-center gap-2">
          <LiveScore name={found.you.name} score={scores.you} side="me" />
          <div className="flex flex-col items-center px-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">R{round.index + 1}</div>
            <div className="text-sm font-black tabular-nums">
              <span className="text-me">{state.roundWins[0]}</span>
              <span className="text-muted">:</span>
              <span className="text-foe">{state.roundWins[1]}</span>
            </div>
          </div>
          <LiveScore name={found.opponent.name} score={scores.opponent} side="foe" async={found.opponent.async} sub={oppSub} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-base">{meta.emoji}</span>
          <TimerBar endsAt={round.endsAt} totalMs={round.timeLimit} />
          <SecondsLeft endsAt={round.endsAt} className="w-9 text-right text-xs font-bold" />
        </div>
      </div>

      {!state.opponentConnected && (
        <div className="mt-2 rounded-xl bg-gold/15 px-3 py-2 text-center text-xs font-semibold text-gold">
          Your opponent disconnected… if they’re not back in 15s, you win.
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        {Mode ? (
          <Mode item={item} feedback={feedback} onAnswer={answer} waiting={waiting} />
        ) : (
          <div className="m-auto text-muted">Unknown mode.</div>
        )}
      </div>

      <div className="flex justify-center pb-1">
        {confirmQuit ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted">Forfeit the duel?</span>
            <button className="font-bold text-bad" onClick={forfeit}>Yes</button>
            <button className="font-bold text-muted" onClick={() => setConfirmQuit(false)}>No</button>
          </div>
        ) : (
          <button className="text-xs text-muted/60 hover:text-muted" onClick={() => setConfirmQuit(true)}>Forfeit</button>
        )}
      </div>
    </div>
  );
}
