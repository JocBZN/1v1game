import { motion } from 'motion/react';
import { Crown, Download, LogIn, Trophy, User, UserPlus, Users } from 'lucide-react';
import type { Route } from '../App';
import type { Me } from '../lib/api';
import { DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META, leagueProgress } from '../lib/leagues';
import { useInstallPrompt } from '../lib/pwa';
import { Avatar, LeagueIcon, Screen, TopicIcon, rise, useAnimatedNumber } from '../components/ui';
import { SignupPrompt } from '../components/SignupPrompt';

/** The Play button: a plain teal circle with one quiet ring. */
function PlayButton({ onPlay, disabled }: { onPlay: () => void; disabled: boolean }) {
  return (
    <motion.button
      onClick={onPlay}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className="flex h-40 w-40 items-center justify-center rounded-full bg-teal font-display text-4xl font-bold tracking-tight text-[#fff8e6] ring-8 ring-teal/10 transition-colors hover:bg-[#12697b] disabled:opacity-50"
    >
      Play
    </motion.button>
  );
}

export function HomeScreen({ me, onPlay, onNavigate, connected }: {
  me: Me;
  onPlay: () => void;
  onNavigate: (to: Route) => void;
  connected: boolean;
}) {
  const g = me.ratings.general;
  const league = LEAGUE_META[me.league.id];
  const prog = leagueProgress(g.rating);
  const rating = useAnimatedNumber(g.rating, 900);
  const { canInstall, install } = useInstallPrompt();
  const guest = me.user.guest;

  return (
    <Screen>
      <motion.header {...rise(0)} className="flex items-center gap-3">
        <Avatar name={me.user.nickname} size={42} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold leading-tight">{me.user.nickname}</div>
          <div className="text-xs font-medium text-muted">
            {g.wins}W · {g.losses}L{g.draws ? ` · ${g.draws}D` : ''}
          </div>
        </div>
        {guest ? (
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('login')} className="btn btn-secondary h-9 px-3 text-sm">
              <LogIn size={15} strokeWidth={2.5} /> Log in
            </button>
            <button onClick={() => onNavigate('signup')} className="btn btn-primary h-9 px-3 text-sm">
              <UserPlus size={15} strokeWidth={2.5} /> Sign up
            </button>
          </div>
        ) : (
          <button onClick={() => onNavigate('profile')} className="btn btn-secondary h-9 w-9 rounded-full p-0" aria-label="Account">
            <User size={17} strokeWidth={2.5} />
          </button>
        )}
      </motion.header>

      <motion.section {...rise(1)} className="mt-6 flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="label">Rating</div>
          <div className="font-display text-4xl font-bold tabular-nums tracking-tight">{rating}</div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted">
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: league.color }}>
            <LeagueIcon league={me.league.id} size={14} /> {league.name}
          </span>
          {prog.next ? (
            <span>{prog.toGo} to {LEAGUE_META[prog.next].name}</span>
          ) : (
            <span className="flex items-center gap-1"><Crown size={12} /> Top league</span>
          )}
        </div>
      </motion.section>

      {guest && (
        <motion.div {...rise(2)} className="mt-2">
          <SignupPrompt
            compact
            where="home"
            title="Playing as a guest"
            text={g.games > 0 ? 'Create a free account to save your rating and get on the leaderboard.' : 'Play now. Create a free account anytime to save your progress and get on the leaderboard.'}
            onSignup={() => onNavigate('signup')}
          />
        </motion.div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center py-7">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <PlayButton onPlay={onPlay} disabled={!connected} />
        </motion.div>
        <p className="mt-6 text-sm text-muted">{connected ? '3 rounds · random topics' : 'Connecting…'}</p>
        <div className="mt-3 flex gap-3 text-muted">
          {DOMAIN_LIST.map((d) => (
            <span key={d.id} title={d.name}>
              <TopicIcon domain={d.id} size={32} />
            </span>
          ))}
        </div>
        {canInstall && (
          <button onClick={install} className="btn btn-secondary mt-4 h-9 px-3 text-xs">
            <Download size={14} strokeWidth={2.5} /> Install the app
          </button>
        )}
      </div>

      <motion.div {...rise(3)} className="grid gap-3 pb-2">
        <button onClick={() => onNavigate('friend')} disabled={!connected} className="btn btn-secondary w-full py-3.5">
          <Users size={18} strokeWidth={2.5} /> Play with a friend
        </button>
        <nav className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate('leaderboard')} className="btn btn-secondary py-3.5">
            <Trophy size={17} strokeWidth={2} /> Leaderboard
          </button>
          <button onClick={() => onNavigate('profile')} className="btn btn-secondary py-3.5">
            <User size={17} strokeWidth={2} /> Profile
          </button>
        </nav>
      </motion.div>
    </Screen>
  );
}
