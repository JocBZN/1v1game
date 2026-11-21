import { DOMAINS, type DomainId } from '../lib/domains';
import { LEAGUE_META, leagueRank } from '../lib/leagues';
import type { DuelResult, Found, RatingChange } from '../state/duel';
import { AsyncTag, Avatar, Screen, TopicIcon, useAnimatedNumber } from '../components/ui';

function Delta({ change, big }: { change: RatingChange; big?: boolean }) {
  const d = Math.round(change.after) - Math.round(change.before);
  const shown = useAnimatedNumber(Math.round(change.after), 1200);
  const color = d > 0 ? 'text-cyan-strong' : d < 0 ? 'text-red' : 'text-muted';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${big ? 'text-4xl' : 'text-lg'} font-bold tabular-nums tracking-tight`}>{shown}</span>
      <span className={`${big ? 'text-lg' : 'text-sm'} font-semibold tabular-nums ${color}`}>
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
  const title = result.result === 'win' ? 'Victory' : result.result === 'loss' ? 'Defeat' : 'Draw';
  const color = result.result === 'win' ? 'text-cyan-strong' : result.result === 'loss' ? 'text-red' : 'text-orange-strong';
  const general = result.ratingChanges?.general;
  const domainChanges = Object.entries(result.ratingChanges ?? {}).filter(([k]) => k !== 'general') as [DomainId, RatingChange][];
  const leagueUp = result.league && result.league.before !== result.league.after;

  return (
    <Screen className="pb-4">
      <div className="mt-6 text-center animate-pop">
        <h1 className={`text-6xl font-extrabold tracking-tighter ${color}`}>{title}</h1>
        {result.forfeit && (
          <p className="mt-2 text-sm text-muted">{result.forfeit === 'you' ? 'You forfeited the duel.' : 'Your opponent forfeited.'}</p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 animate-rise">
        <div className="flex items-center gap-2.5">
          <Avatar name={found?.you.name ?? 'You'} size={36} ring="var(--color-cyan)" />
          <span className="text-4xl font-bold tabular-nums text-me">{result.roundWins[0]}</span>
        </div>
        <span className="text-line-strong">–</span>
        <div className="flex items-center gap-2.5">
          <span className="text-4xl font-bold tabular-nums text-foe">{result.roundWins[1]}</span>
          <Avatar name={result.opponent.name} size={36} ring="var(--color-red)" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
        vs {result.opponent.name} {result.opponent.async && <AsyncTag />}
      </div>

      <div className="card mt-6 divide-y divide-line animate-rise" style={{ animationDelay: '100ms' }}>
        {result.rounds.map((r, i) => {
          const m = DOMAINS[r.domain];
          const mark = r.winner === 'you' ? 'bg-cyan' : r.winner === 'opponent' ? 'bg-red' : 'bg-orange';
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className={`h-2 w-2 rounded-full ${mark}`} />
              <TopicIcon emoji={m.emoji} soft={m.soft} size={28} />
              <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
              <span className="font-semibold tabular-nums text-me">{r.you}</span>
              <span className="text-line-strong">–</span>
              <span className="font-semibold tabular-nums text-foe">{r.opponent}</span>
            </div>
          );
        })}
      </div>

      {general && (
        <div className="card mt-3 p-4 animate-rise" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <span className="label">Overall rating</span>
            {result.league && (
              <span className="text-sm font-semibold" style={{ color: LEAGUE_META[result.league.after].color }}>
                {LEAGUE_META[result.league.after].emoji} {LEAGUE_META[result.league.after].name}
              </span>
            )}
          </div>
          <div className="mt-1">
            <Delta change={general} big />
          </div>
          {leagueUp && (
            <div className="mt-3 rounded-xl bg-orange-soft px-3 py-2 text-center text-sm font-semibold text-orange-strong animate-pop">
              {leagueRank(result.league!.after) > leagueRank(result.league!.before)
                ? `${LEAGUE_META[result.league!.after].emoji} Promoted to ${LEAGUE_META[result.league!.after].name}`
                : `Dropped to ${LEAGUE_META[result.league!.after].name}. You’ll be back.`}
            </div>
          )}
          {domainChanges.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-line pt-3">
              {domainChanges.map(([d, c]) => (
                <div key={d} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{DOMAINS[d].name}</span>
                  <Delta change={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto grid gap-3 pt-6">
        <button onClick={onAgain} className="btn btn-primary py-4 text-lg">
          Another duel
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onLeaderboard} className="btn btn-secondary py-3">Leaderboard</button>
          <button onClick={onHome} className="btn btn-secondary py-3">Home</button>
        </div>
      </div>
    </Screen>
  );
}
