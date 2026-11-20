import type { Me } from '../lib/api';
import { DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META, leagueProgress } from '../lib/leagues';
import { Avatar, LeagueBadge, Screen } from '../components/ui';

export function HomeScreen({
  me, onPlay, onNavigate, onSwitchPlayer, connected,
}: {
  me: Me;
  onPlay: () => void;
  onNavigate: (to: 'leaderboard' | 'profile') => void;
  onSwitchPlayer: () => void;
  connected: boolean;
}) {
  const g = me.ratings.general;
  const league = LEAGUE_META[me.league.id];
  const prog = leagueProgress(g.rating);

  return (
    <Screen>
      <header className="flex items-center gap-3 animate-rise">
        <Avatar name={me.user.nickname} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold">{me.user.nickname}</div>
          <div className="text-xs text-muted">
            {g.wins}V · {g.losses}Î{g.draws ? ` · ${g.draws}E` : ''}
          </div>
        </div>
        <button onClick={onSwitchPlayer} className="rounded-xl px-2 py-1 text-xs font-semibold text-muted hover:text-white" title="Joacă în acest tab cu alt nickname">
          Alt jucător
        </button>
      </header>

      <section
        className="mt-6 overflow-hidden rounded-3xl border border-line bg-panel/70 p-5 animate-rise"
        style={{ animationDelay: '60ms', boxShadow: `0 0 60px -20px ${league.color}` }}
      >
        <div className="flex items-center justify-between">
          <LeagueBadge league={me.league.id} />
          <span className="text-xs font-bold uppercase tracking-widest text-muted">Rating general</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-6xl font-black tabular-nums" style={{ color: league.color }}>{g.rating}</span>
        </div>
        {prog.next ? (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full bg-gradient-to-r ${league.gradient}`} style={{ width: `${prog.pct * 100}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-muted">
              Încă {prog.toGo} până la {LEAGUE_META[prog.next].emoji} {LEAGUE_META[prog.next].name}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-muted">Ești în vârful piramidei. 👑</div>
        )}
      </section>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <button
          onClick={onPlay}
          disabled={!connected}
          className="btn-game h-44 w-44 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-pink-500 text-4xl text-white animate-glow disabled:opacity-50"
          style={{ textShadow: '0 3px 0 rgb(0 0 0 / 0.25)' }}
        >
          JOACĂ
        </button>
        <p className="mt-5 text-center text-sm text-muted">{connected ? '3 runde · domenii alese la întâmplare' : 'Se conectează la server…'}</p>
        <div className="mt-4 flex gap-2">
          {DOMAIN_LIST.map((d) => (
            <div key={d.id} className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} text-xl shadow-lg`} title={d.name}>
              {d.emoji}
            </div>
          ))}
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-3 pb-2">
        <button onClick={() => onNavigate('leaderboard')} className="btn-game bg-panel-2 py-4 text-base text-white">
          🏆 Clasament
        </button>
        <button onClick={() => onNavigate('profile')} className="btn-game bg-panel-2 py-4 text-base text-white">
          👤 Profil
        </button>
      </nav>
    </Screen>
  );
}
