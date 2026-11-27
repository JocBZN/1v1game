import { Suspense, useEffect, useRef, useState } from 'react';
import { DOMAINS } from '../lib/domains';
import { MODE_COMPONENTS } from '../modes/registry';
import { useDuel } from '../state/duel';
import { AsyncTag, Avatar, SecondsLeft, TopicIcon, useAnimatedNumber, useNow } from '../components/ui';
import { FloatingShapes, VsBubble } from '../components/Fun';

function LiveScore({ name, avatar, score, side, async: isAsync, sub }: { name: string; avatar?: string | null; score: number; side: 'me' | 'foe'; async?: boolean; sub?: string }) {
  const shown = useAnimatedNumber(score);
  const prev = useRef(score);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (score > prev.current) setBump((b) => b + 1);
    prev.current = score;
  }, [score]);
  const color = side === 'me' ? 'text-me' : 'text-red';
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-3xl p-2.5 ${side === 'foe' ? 'flex-row-reverse bg-slate pr-2.5 text-right text-cream' : 'bg-surface/90 shadow-[0_10px_30px_-18px_rgb(70_66_94/0.5)]'}`}
    >
      <Avatar name={name} icon={avatar} size={34} ring={side === 'me' ? 'var(--color-teal)' : 'var(--color-red)'} />
      <div className="min-w-0">
        <div className={`truncate text-xs font-medium ${side === 'foe' ? 'opacity-70' : 'text-muted'}`}>{name}</div>
        <div key={bump} className={`font-display text-3xl font-bold tabular-nums leading-tight tracking-tight ${color} ${bump ? 'animate-score' : ''}`}>{shown}</div>
        {(sub || isAsync) && (
          <div className={`flex items-center gap-1 text-[10px] font-medium ${side === 'foe' ? 'justify-end opacity-70' : 'text-muted'}`}>
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
    <div className="relative h-full w-full">
    <FloatingShapes calm />
    <div className="relative mx-auto flex h-full w-full max-w-md flex-col px-4 pt-3 safe-bottom lg:max-w-2xl">
      {/* Live scoreboard */}
      <div>
        <div className="flex items-center gap-2">
          <LiveScore name={found.you.name} avatar={found.you.avatar} score={scores.you} side="me" />
          <div className="relative z-10 shrink-0"><VsBubble size={46} still>
            <span className="mt-0.5 text-[11px] tabular-nums opacity-90">{state.roundWins[0]}:{state.roundWins[1]}</span>
          </VsBubble></div>
          <LiveScore name={found.opponent.name} avatar={found.opponent.avatar} score={scores.opponent} side="foe" async={found.opponent.async} sub={oppSub} />
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3" style={{ background: meta.soft }} title={meta.name}>
          <TopicIcon domain={round.domain} size={26} solid />
          <span className="hidden text-xs font-bold sm:inline" style={{ color: meta.color }}>{meta.name} · round {round.index + 1}/3</span>
          <RoundBar endsAt={round.endsAt} totalMs={round.timeLimit} color={meta.base} />
          <SecondsLeft endsAt={round.endsAt} className="w-9 text-right text-xs font-bold" />
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
    </div>
  );
}

/** Round timer in the game's colour; turns coral in the last 20 %. */
function RoundBar({ endsAt, totalMs, color }: { endsAt: number; totalMs: number; color: string }) {
  const now = useNow();
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, (endsAt - now) / totalMs)) : 0;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/60">
      <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${pct * 100}%`, background: pct < 0.2 ? '#ff6973' : color }} />
    </div>
  );
}
