import { DOMAINS, type DomainId } from '../lib/domains';
import { LEAGUE_META } from '../lib/leagues';
import type { DuelResult, Found, RatingChange } from '../state/duel';
import { AsyncTag, Avatar, Screen, useAnimatedNumber } from '../components/ui';

function Delta({ change, big }: { change: RatingChange; big?: boolean }) {
  const d = Math.round(change.after) - Math.round(change.before);
  const shown = useAnimatedNumber(Math.round(change.after), 1200);
  const color = d > 0 ? 'text-good' : d < 0 ? 'text-bad' : 'text-muted';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${big ? 'text-4xl' : 'text-xl'} font-black tabular-nums`}>{shown}</span>
      <span className={`${big ? 'text-xl' : 'text-sm'} font-black tabular-nums ${color}`}>
        {d > 0 ? `+${d}` : d === 0 ? '±0' : d}
      </span>
    </div>
  );
}

export function ResultScreen({ found, result, onAgain, onLeaderboard, onHome }: {
  found: Found | null;
  result: DuelResult;
  onAgain: () => void;
  onLeaderboard: () => void;
  onHome: () => void;
}) {
  const title = result.result === 'win' ? 'VICTORIE' : result.result === 'loss' ? 'ÎNFRÂNGERE' : 'EGALITATE';
  const grad = result.result === 'win' ? 'from-emerald-300 to-cyan-300' : result.result === 'loss' ? 'from-rose-400 to-pink-500' : 'from-amber-300 to-yellow-200';
  const emoji = result.result === 'win' ? '🏆' : result.result === 'loss' ? '💀' : '🤝';
  const general = result.ratingChanges?.general;
  const domainChanges = Object.entries(result.ratingChanges ?? {}).filter(([k]) => k !== 'general') as [DomainId, RatingChange][];
  const leagueUp = result.league && result.league.before !== result.league.after;

  return (
    <Screen className="pb-4">
      <div className="mt-4 text-center animate-pop">
        <div className="text-6xl">{emoji}</div>
        <h1 className={`mt-2 bg-gradient-to-r ${grad} bg-clip-text text-5xl font-black tracking-tight text-transparent`}>{title}</h1>
        {result.forfeit && (
          <p className="mt-1 text-sm text-muted">{result.forfeit === 'you' ? 'Ai abandonat duelul.' : 'Adversarul a abandonat.'}</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 animate-rise">
        <div className="flex items-center gap-2">
          <Avatar name={found?.you.name ?? 'Tu'} size={36} ring="#22d3ee" />
          <span className="text-4xl font-black text-me">{result.roundWins[0]}</span>
        </div>
        <span className="text-muted">–</span>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black text-foe">{result.roundWins[1]}</span>
          <Avatar name={result.opponent.name} size={36} ring="#f472b6" />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
        vs {result.opponent.name} {result.opponent.async && <AsyncTag />}
      </div>

      <div className="mt-5 space-y-2 animate-rise" style={{ animationDelay: '100ms' }}>
        {result.rounds.map((r, i) => {
          const m = DOMAINS[r.domain];
          const mark = r.winner === 'you' ? 'bg-good' : r.winner === 'opponent' ? 'bg-bad' : 'bg-gold';
          return (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-panel/70 px-3 py-2.5">
              <div className={`h-8 w-1.5 rounded-full ${mark}`} />
              <span className="text-xl">{m.emoji}</span>
              <span className="flex-1 truncate text-sm font-bold">{m.name}</span>
              <span className="font-black tabular-nums text-me">{r.you}</span>
              <span className="text-muted">–</span>
              <span className="font-black tabular-nums text-foe">{r.opponent}</span>
            </div>
          );
        })}
      </div>

      {general && (
        <div className="mt-5 rounded-3xl border border-line bg-panel/80 p-4 animate-rise" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">Rating general</span>
            {result.league && (
              <span className="text-sm font-bold" style={{ color: LEAGUE_META[result.league.after].color }}>
                {LEAGUE_META[result.league.after].emoji} {LEAGUE_META[result.league.after].name}
              </span>
            )}
          </div>
          <div className="mt-1">
            <Delta change={general} big />
          </div>
          {leagueUp && (
            <div className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-center text-sm font-bold animate-pop">
              {LEAGUE_META[result.league!.after].emoji} Ai ajuns în liga {LEAGUE_META[result.league!.after].name}!
            </div>
          )}
          {domainChanges.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-line pt-3">
              {domainChanges.map(([d, c]) => (
                <div key={d} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted">
                    {DOMAINS[d].emoji} {DOMAINS[d].name}
                  </span>
                  <Delta change={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto grid gap-3 pt-6">
        <button onClick={onAgain} className="btn-game bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 py-4 text-xl text-white">
          ⚔️ Încă un duel
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onLeaderboard} className="btn-game bg-panel-2 py-3 text-white">🏆 Clasament</button>
          <button onClick={onHome} className="btn-game bg-panel-2 py-3 text-white">🏠 Acasă</button>
        </div>
      </div>
    </Screen>
  );
}
