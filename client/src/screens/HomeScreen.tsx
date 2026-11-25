import type { Route } from '../App';
import type { Me } from '../lib/api';
import { DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META, leagueProgress } from '../lib/leagues';
import { useInstallPrompt } from '../lib/pwa';
import { Avatar, LeagueBadge, Progress, Screen, TopicIcon } from '../components/ui';
import { SignupPrompt } from '../components/SignupPrompt';

export function HomeScreen({ me, onPlay, onNavigate, connected }: {
  me: Me;
  onPlay: () => void;
  onNavigate: (to: Route) => void;
  connected: boolean;
}) {
  const g = me.ratings.general;
  const league = LEAGUE_META[me.league.id];
  const prog = leagueProgress(g.rating);
  const { canInstall, install } = useInstallPrompt();
  const guest = me.user.guest;

  return (
    <Screen>
      <header className="flex items-center gap-3 animate-rise">
        <Avatar name={me.user.nickname} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{me.user.nickname}</div>
          <div className="text-xs text-muted">
            {g.wins}W · {g.losses}L{g.draws ? ` · ${g.draws}D` : ''}
          </div>
        </div>
        {guest ? (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onNavigate('login')} className="btn btn-ghost px-2 py-2 text-sm">Log in</button>
            <button onClick={() => onNavigate('signup')} className="btn btn-accent px-3.5 py-2 text-sm">Sign up</button>
          </div>
        ) : (
          <button onClick={() => onNavigate('profile')} className="btn btn-ghost px-2 py-1 text-xs">Account</button>
        )}
      </header>

      <section className="card mt-5 p-5 animate-rise" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between">
          <span className="label">Overall rating</span>
          <LeagueBadge league={me.league.id} />
        </div>
        <div className="mt-2 text-5xl font-bold tabular-nums tracking-tight">{g.rating}</div>
        {prog.next ? (
          <div className="mt-4">
            <Progress value={prog.pct} color={league.color} />
            <div className="mt-2 text-xs text-muted">
              {prog.toGo} to {LEAGUE_META[prog.next].emoji} {LEAGUE_META[prog.next].name}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-muted">You’re at the top. 👑</div>
        )}
      </section>

      {guest && (
        <div className="mt-3">
          <SignupPrompt
            compact
            where="home"
            title="You’re playing as a guest"
            text={g.games > 0 ? 'Create a free account to save your rating and get on the leaderboard.' : 'Play now. Create a free account anytime to save your progress and get on the leaderboard.'}
            onSignup={() => onNavigate('signup')}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <button
          onClick={onPlay}
          disabled={!connected}
          className="btn btn-primary h-40 w-40 rounded-full text-3xl tracking-tight ring-[10px] ring-red-soft"
        >
          Play
        </button>
        <p className="mt-6 text-sm text-muted">{connected ? '3 rounds · random topics' : 'Connecting…'}</p>
        {canInstall && (
          <button onClick={install} className="chip mt-3 border border-line text-text hover:bg-sunken">
            ⤓ Install the app
          </button>
        )}
        <div className="mt-4 flex gap-2">
          {DOMAIN_LIST.map((d) => (
            <span key={d.id} title={d.name}>
              <TopicIcon emoji={d.emoji} soft={d.soft} size={36} />
            </span>
          ))}
        </div>
      </div>

      <button onClick={() => onNavigate('friend')} disabled={!connected} className="btn btn-accent mb-3 w-full py-3.5">
        👥 Play with a friend
      </button>

      <nav className="grid grid-cols-2 gap-3 pb-2">
        <button onClick={() => onNavigate('leaderboard')} className="btn btn-secondary py-3.5">
          Leaderboard
        </button>
        <button onClick={() => onNavigate('profile')} className="btn btn-secondary py-3.5">
          Profile
        </button>
      </nav>
    </Screen>
  );
}
