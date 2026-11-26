import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Crown, Download, LogIn, Trophy, UserPlus, Users } from 'lucide-react';
import type { Route } from '../App';
import type { Me } from '../lib/api';
import { DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META, leagueProgress } from '../lib/leagues';
import { useInstallPrompt } from '../lib/pwa';
import { Avatar, LeagueIcon, TopicIcon, useAnimatedNumber } from '../components/ui';
import { FloatingShapes, GameMarquee, MysteryAvatar, VsBubble } from '../components/Fun';
import { track } from '../lib/analytics';

/** "Beat one person at ___" with the game name rolling. */
function RollingTitle({ big }: { big?: boolean }) {
  const [i, setI] = useState(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setI((n) => (n + 1) % DOMAIN_LIST.length), 1800);
    return () => clearInterval(t);
  }, [still]);
  const d = DOMAIN_LIST[i];
  return (
    <h1 className={`font-display font-bold leading-[1.05] tracking-tight ${big ? 'text-5xl' : 'text-[2.15rem]'}`}>
      Beat one person at
      <span className="relative block h-[1.15em] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={d.id}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="absolute left-0 whitespace-nowrap"
            style={{ color: d.color }}
          >
            {d.name.toLowerCase()}.
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}

/** You vs the unknown opponent. Tap your side to open your profile. */
function FaceOff({ me, onProfile }: { me: Me; onProfile: () => void }) {
  const g = me.ratings.general;
  const league = LEAGUE_META[me.league.id];
  const prog = leagueProgress(g.rating);
  const rating = useAnimatedNumber(g.rating, 900);
  const still = useReducedMotion();
  return (
    <div className="relative flex items-center gap-3">
      <motion.button
        onClick={onProfile}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-3xl bg-surface/80 p-3 text-left shadow-[0_10px_30px_-18px_rgb(70_66_94/0.5)] backdrop-blur"
        aria-label="Open your profile"
      >
        <Avatar name={me.user.nickname} size={40} ring={league.color} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-muted">{me.user.nickname}</div>
          <div className="font-display text-2xl font-bold tabular-nums leading-none">{rating}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold" style={{ color: league.color }}>
            <LeagueIcon league={me.league.id} size={12} /> {league.name}
            {!prog.next && <Crown size={11} />}
          </div>
          {prog.next && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-sunken" title={`${prog.toGo} points to ${LEAGUE_META[prog.next].name}`}>
              <motion.div className="h-full rounded-full" style={{ background: league.color }} initial={{ width: 0 }} animate={{ width: `${prog.pct * 100}%` }} transition={{ duration: 1, delay: 0.3 }} />
            </div>
          )}
        </div>
      </motion.button>

      <div className="-mx-5"><VsBubble /></div>

      <div className="flex flex-1 items-center justify-end gap-3 rounded-3xl bg-slate p-3 text-cream">
        <div className="min-w-0 text-right">
          <div className="text-sm font-bold">Opponent</div>
          <div className="text-[11px] opacity-70">press Play</div>
        </div>
        <MysteryAvatar size={40} />
      </div>
    </div>
  );
}

function PlayButton({ onPlay, connected, big }: { onPlay: () => void; connected: boolean; big?: boolean }) {
  const still = useReducedMotion();
  return (
    <motion.button
      onClick={onPlay}
      disabled={!connected}
      whileHover={connected ? { scale: 1.02 } : undefined}
      whileTap={connected ? { scale: 0.97 } : undefined}
      className={`group relative w-full overflow-hidden rounded-3xl bg-teal text-left text-cream shadow-[0_14px_30px_-14px_#15788c] disabled:opacity-60 ${big ? 'px-7 py-6' : 'px-6 py-5'}`}
    >
      {!still && connected && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/15"
          initial={{ left: '-40%' }}
          animate={{ left: '130%' }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
        />
      )}
      <span className="relative flex items-center justify-between gap-3">
        <span>
          <span className={`block font-display font-bold tracking-tight ${big ? 'text-4xl' : 'text-3xl'}`}>{connected ? 'Play' : 'Connecting…'}</span>
          <span className="block text-sm font-medium opacity-80">3 random games · best of 3</span>
        </span>
        <motion.span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-teal"
          animate={still ? undefined : { x: [0, 5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight size={24} strokeWidth={2.5} />
        </motion.span>
      </span>
    </motion.button>
  );
}

/** PC: colourful tiles that pop in one by one and lift on hover. */
function GameTiles() {
  return (
    <ul className="grid grid-cols-3 gap-3">
      {DOMAIN_LIST.map((d, i) => (
        <motion.li
          key={d.id}
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ y: -4, rotate: i % 2 ? 1.5 : -1.5 }}
          className="flex cursor-default flex-col gap-2 rounded-3xl p-3.5"
          style={{ background: d.soft }}
        >
          <TopicIcon domain={d.id} size={36} solid />
          <div className="text-sm font-bold leading-tight" style={{ color: d.color }}>{d.name}</div>
          <div className="text-[11px] leading-snug text-text/70">{d.tagline}</div>
        </motion.li>
      ))}
    </ul>
  );
}

export function HomeScreen({ me, onPlay, onNavigate, connected }: {
  me: Me;
  onPlay: () => void;
  onNavigate: (to: Route) => void;
  connected: boolean;
}) {
  const { canInstall, install } = useInstallPrompt();
  const guest = me.user.guest;

  const account = guest ? (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onNavigate('login')} className="btn btn-ghost h-9 px-2 text-sm"><LogIn size={15} /> Log in</button>
      <button onClick={() => onNavigate('signup')} className="btn btn-primary h-9 rounded-full px-3.5 text-sm"><UserPlus size={15} /> Sign up</button>
    </div>
  ) : null;

  const secondary = (
    <div className="grid grid-cols-2 gap-3">
      {[
        { to: 'friend' as Route, icon: Users, label: 'Play a friend', sub: 'private room, no rating', color: '#ffb0a3', off: !connected },
        { to: 'leaderboard' as Route, icon: Trophy, label: 'Leaderboard', sub: 'see who’s on top', color: '#00b9be', off: false },
      ].map((b) => (
        <motion.button
          key={b.label}
          onClick={() => onNavigate(b.to)}
          disabled={b.off}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-3 rounded-3xl bg-surface/80 p-3 text-left shadow-[0_10px_30px_-20px_rgb(70_66_94/0.5)] backdrop-blur disabled:opacity-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: b.color }}>
            <b.icon size={19} className="text-slate" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{b.label}</span>
            <span className="block truncate text-[11px] text-muted">{b.sub}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );

  const guestLine = guest && (
    <button
      onClick={() => {
        track('signup_cta', { where: 'home' });
        onNavigate('signup');
      }}
      className="text-left text-xs text-muted transition-colors hover:text-text"
    >
      Playing as a guest. <span className="font-semibold text-teal underline-offset-2 hover:underline">Make a free account</span> to keep your rating.
    </button>
  );

  const install_ = canInstall && (
    <button onClick={install} className="btn btn-ghost h-8 justify-start px-0 text-xs"><Download size={14} /> Install the app</button>
  );

  const steps = (
    <div className="flex items-center justify-between gap-2 text-center text-[11px] font-semibold text-muted">
      {['Match in seconds', 'Win 2 of 3 rounds', 'Climb the leagues'].map((s, i) => (
        <motion.span
          key={s}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.12 }}
          className="flex flex-1 flex-col items-center gap-1"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate font-display text-xs text-cream">{i + 1}</span>
          {s}
        </motion.span>
      ))}
    </div>
  );

  const enter = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, type: 'spring' as const, stiffness: 260, damping: 24 },
  });

  return (
    <div className="relative min-h-full w-full">
      <FloatingShapes />

      {/* ---------- phone / tablet ---------- */}
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col gap-5 px-4 pb-8 pt-4 safe-bottom sm:px-6 md:max-w-xl lg:hidden">
        <motion.header {...enter(0)} className="flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-tight">1v1<span className="text-red">game</span></span>
          {account}
        </motion.header>
        <motion.div {...enter(1)}><RollingTitle /></motion.div>
        <motion.div {...enter(2)}><FaceOff me={me} onProfile={() => onNavigate('profile')} /></motion.div>
        <motion.div {...enter(3)}><PlayButton onPlay={onPlay} connected={connected} /></motion.div>
        <motion.div {...enter(4)}>{secondary}</motion.div>
        {guestLine}
        <motion.div {...enter(5)} className="mt-1">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="font-display text-lg font-bold">{DOMAIN_LIST.length} games</span>
            <span className="text-xs text-muted">3 random ones each duel</span>
          </div>
          <GameMarquee className="-mx-4 sm:-mx-6" />
        </motion.div>
        <motion.div {...enter(6)} className="mt-1">{steps}</motion.div>
        {install_}
      </div>

      {/* ---------- PC: one big square ---------- */}
      <div className="relative hidden min-h-full items-center justify-center p-8 lg:flex">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="grid aspect-square w-[max(820px,min(94vw,92vh,1060px))] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 overflow-hidden rounded-[2.5rem] bg-surface/85 p-10 shadow-[0_40px_80px_-40px_rgb(70_66_94/0.45)] backdrop-blur"
        >
          <div className="flex min-h-0 flex-col gap-6">
            <header className="flex items-center justify-between">
              <span className="font-display text-2xl font-bold tracking-tight">1v1<span className="text-red">game</span></span>
              {account}
            </header>
            <RollingTitle big />
            <p className="text-sm leading-relaxed text-muted">
              Three quick rounds against one opponent: a live player when someone’s online, otherwise a recorded player or a bot. Win two and the match is yours.
            </p>
            <FaceOff me={me} onProfile={() => onNavigate('profile')} />
            <PlayButton onPlay={onPlay} connected={connected} big />
            {secondary}
            {guestLine}
            {install_}
          </div>
          <div className="flex min-h-0 flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl font-bold">{DOMAIN_LIST.length} games</span>
              <span className="text-xs text-muted">3 random ones each duel</span>
            </div>
            <GameTiles />
            <div className="mt-auto">{steps}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
