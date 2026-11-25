import { motion } from 'motion/react';
import { Crown, Download, LogIn, Trophy, User, UserPlus, Users } from 'lucide-react';
import type { Route } from '../App';
import type { Me } from '../lib/api';
import { DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META, leagueProgress } from '../lib/leagues';
import { useInstallPrompt } from '../lib/pwa';
import { Avatar, LeagueBadge, LeagueIcon, Progress, Screen, TopicIcon, rise, useAnimatedNumber } from '../components/ui';
import { SignupPrompt } from '../components/SignupPrompt';

/** The big Play button: rotating light ring, soft pulse, presses in like a real button. */
function PlayButton({ onPlay, disabled }: { onPlay: () => void; disabled: boolean }) {
  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full opacity-80 blur-[2px]"
        style={{ background: 'conic-gradient(from 0deg, #ff9100, #df301c, #00b7cd, #ff9100)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-red/40 blur-2xl"
        animate={{ scale: [0.85, 1.08, 0.85], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-[7px] rounded-full bg-bg" />
      <motion.button
        onClick={onPlay}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.04 }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        className="relative h-40 w-40 rounded-full font-display text-4xl font-extrabold tracking-tight text-[#fff8e8] disabled:opacity-50"
        style={{
          background: 'radial-gradient(circle at 35% 25%, #ff6a4d, #df301c 55%, #a8230f)',
          boxShadow: '0 8px 0 #7d190a, 0 22px 40px -14px rgb(223 48 28 / 0.75), inset 0 3px 0 rgb(255 255 255 / 0.25)',
        }}
      >
        Play
      </motion.button>
    </div>
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
            <button onClick={() => onNavigate('signup')} className="btn btn-accent h-9 px-3 text-sm">
              <UserPlus size={15} strokeWidth={2.5} /> Sign up
            </button>
          </div>
        ) : (
          <button onClick={() => onNavigate('profile')} className="btn btn-secondary h-9 w-9 rounded-full p-0" aria-label="Account">
            <User size={17} strokeWidth={2.5} />
          </button>
        )}
      </motion.header>

      <motion.section
        {...rise(1)}
        className="relative mt-5 overflow-hidden rounded-[1.75rem] p-5 text-[#fff8e8]"
        style={{
          background: `radial-gradient(120% 140% at 100% 0%, ${league.color}55, transparent 55%), linear-gradient(150deg, #3a2417, #2b1b12)`,
          boxShadow: '0 18px 40px -22px rgb(43 27 18 / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#fff1d1]/60">Overall rating</span>
          <span className="rounded-full bg-[#fff1d1]/95 px-0.5 py-0.5">
            <LeagueBadge league={me.league.id} small />
          </span>
        </div>
        <div className="mt-1 font-display text-6xl font-extrabold tabular-nums tracking-tight">{rating}</div>
        {prog.next ? (
          <div className="mt-4">
            <Progress value={prog.pct} color={`linear-gradient(90deg, ${league.color}, #ff9100)`} className="bg-[#fff1d1]/15 shadow-none" />
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#fff1d1]/70">
              {prog.toGo} to <LeagueIcon league={prog.next} size={13} /> <span className="font-semibold text-[#fff1d1]">{LEAGUE_META[prog.next].name}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#ffb98a]">
            <Crown size={16} strokeWidth={2.5} /> You’re at the top
          </div>
        )}
      </motion.section>

      {guest && (
        <motion.div {...rise(2)} className="mt-3">
          <SignupPrompt
            compact
            where="home"
            title="You’re playing as a guest"
            text={g.games > 0 ? 'Create a free account to save your rating and get on the leaderboard.' : 'Play now. Create a free account anytime to save your progress and get on the leaderboard.'}
            onSignup={() => onNavigate('signup')}
          />
        </motion.div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center py-7">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.12 }}>
          <PlayButton onPlay={onPlay} disabled={!connected} />
        </motion.div>
        <p className="mt-4 text-sm font-semibold text-muted">{connected ? '3 rounds · random topics · best of 3' : 'Connecting…'}</p>
        <div className="mt-4 flex gap-2">
          {DOMAIN_LIST.map((d, i) => (
            <motion.span key={d.id} title={d.name} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.06, type: 'spring', stiffness: 260, damping: 18 }}>
              <TopicIcon domain={d.id} size={40} solid />
            </motion.span>
          ))}
        </div>
        {canInstall && (
          <button onClick={install} className="btn btn-secondary mt-4 h-9 px-3 text-xs">
            <Download size={14} strokeWidth={2.5} /> Install the app
          </button>
        )}
      </div>

      <motion.div {...rise(3)} className="grid gap-3 pb-2">
        <button onClick={() => onNavigate('friend')} disabled={!connected} className="btn btn-accent w-full py-3.5">
          <Users size={18} strokeWidth={2.5} /> Play with a friend
        </button>
        <nav className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate('leaderboard')} className="btn btn-secondary py-3.5">
            <Trophy size={17} strokeWidth={2.5} className="text-orange-strong" /> Leaderboard
          </button>
          <button onClick={() => onNavigate('profile')} className="btn btn-secondary py-3.5">
            <User size={17} strokeWidth={2.5} className="text-cyan-strong" /> Profile
          </button>
        </nav>
      </motion.div>
    </Screen>
  );
}
