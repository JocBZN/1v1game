import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, Crown, Download, LogIn, Trophy, UserPlus, Users } from 'lucide-react';
import type { Route } from '../App';
import type { Me } from '../lib/api';
import { DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META, leagueProgress } from '../lib/leagues';
import { useInstallPrompt } from '../lib/pwa';
import { Avatar, LeagueIcon, Progress, TopicIcon, useAnimatedNumber } from '../components/ui';
import { track } from '../lib/analytics';

/**
 * Home. Two layouts:
 *  - phone: one column, the important things first (who you are, Play), then the games
 *  - PC (md+): one big square panel, you + actions on the left, the 12 games on the right
 * Every button does exactly what it says; game tiles are information, not buttons.
 */
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
  const winRate = g.games > 0 ? Math.round((g.wins / g.games) * 100) : null;

  const account = guest ? (
    <div className="flex items-center gap-2">
      <button onClick={() => onNavigate('login')} className="btn btn-ghost h-9 px-2 text-sm">
        <LogIn size={15} /> Log in
      </button>
      <button onClick={() => onNavigate('signup')} className="btn btn-primary h-9 px-3 text-sm">
        <UserPlus size={15} /> Sign up
      </button>
    </div>
  ) : null;

  /** You: tap to open your profile. */
  const playerCard = (
    <button
      onClick={() => onNavigate('profile')}
      className="card group w-full p-4 text-left transition-colors hover:border-line-strong lg:p-5"
      aria-label="Open your profile"
    >
      <div className="flex items-center gap-3">
        <Avatar name={me.user.nickname} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold leading-tight">{me.user.nickname}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: league.color }}>
            <LeagueIcon league={me.league.id} size={13} /> {league.name}
            {guest && <span className="font-medium text-muted">· guest</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold tabular-nums leading-none tracking-tight lg:text-4xl">{rating}</div>
          <div className="label mt-1">Rating</div>
        </div>
      </div>
      <div className="mt-4">
        <Progress value={prog.next ? prog.pct : 1} color={league.color} />
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>
            {prog.next ? <>{prog.toGo} points to {LEAGUE_META[prog.next].name}</> : <span className="inline-flex items-center gap-1"><Crown size={12} /> Top league</span>}
          </span>
          <span className="tabular-nums">
            {g.wins}W {g.losses}L{g.draws ? ` ${g.draws}D` : ''}{winRate !== null ? ` · ${winRate}%` : ''}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-teal opacity-80 group-hover:opacity-100">
        {guest ? 'Your stats' : 'Profile and history'} <ChevronRight size={14} />
      </div>
    </button>
  );

  const actions = (
    <div className="grid gap-3">
      <button onClick={onPlay} disabled={!connected} className="btn btn-primary group w-full justify-between rounded-2xl px-5 py-4 text-left md:py-5">
        <span>
          <span className="block font-display text-2xl font-bold tracking-tight lg:text-3xl">Play now</span>
          <span className="block text-sm font-medium opacity-80">{connected ? 'Ranked 1v1 · 3 random games · best of 3' : 'Connecting…'}</span>
        </span>
        <ArrowRight size={26} className="shrink-0 transition-transform group-hover:translate-x-1" />
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('friend')} disabled={!connected} className="btn btn-secondary flex-col gap-1 py-3 lg:py-4">
          <Users size={20} />
          <span className="text-sm">Play a friend</span>
          <span className="text-[11px] font-medium text-muted">private room, no rating</span>
        </button>
        <button onClick={() => onNavigate('leaderboard')} className="btn btn-secondary flex-col gap-1 py-3 lg:py-4">
          <Trophy size={20} />
          <span className="text-sm">Leaderboard</span>
          <span className="text-[11px] font-medium text-muted">top players, every game</span>
        </button>
      </div>
      {guest && (
        <button
          onClick={() => {
            track('signup_cta', { where: 'home' });
            onNavigate('signup');
          }}
          className="rounded-xl px-1 py-1.5 text-left text-xs text-muted transition-colors hover:text-text"
        >
          You’re playing as a guest. <span className="font-semibold text-teal">Create a free account</span> to keep your rating and appear on the leaderboard.
        </button>
      )}
      {canInstall && (
        <button onClick={install} className="btn btn-ghost h-9 justify-start px-1 text-xs">
          <Download size={14} /> Install the app on this device
        </button>
      )}
    </div>
  );

  const games = (
    <section aria-labelledby="games-title" className="flex shrink-0 flex-col">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="games-title" className="whitespace-nowrap font-display text-lg font-bold">The games</h2>
        <span className="text-xs text-muted">{DOMAIN_LIST.length} games · 3 picked at random each duel</span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 lg:gap-2">
        {DOMAIN_LIST.map((d) => (
          <li key={d.id} className="flex items-start gap-2.5 rounded-2xl bg-surface/70 p-2.5 lg:items-center lg:gap-3 lg:bg-sunken/40 lg:p-2.5">
            <TopicIcon domain={d.id} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{d.name}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted lg:text-xs">{d.tagline}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  const howItWorks = (
    <section aria-labelledby="how-title" className="shrink-0 rounded-2xl border border-line p-4">
      <h2 id="how-title" className="font-display text-base font-bold">How a duel works</h2>
      <ol className="mt-2 grid gap-2 text-sm text-muted sm:grid-cols-3 sm:gap-4">
        <li><span className="font-semibold text-text">1. Match.</span> A live player in a few seconds, or a recorded player or bot.</li>
        <li><span className="font-semibold text-text">2. Three rounds.</span> Three different games, the same questions for both of you.</li>
        <li><span className="font-semibold text-text">3. Rating.</span> Win two rounds. Clear wins and streaks move your rating more.</li>
      </ol>
    </section>
  );

  return (    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mx-auto flex min-h-full w-full flex-col px-4 pt-4 safe-bottom sm:px-6 lg:items-center lg:justify-center lg:p-8"
    >
      {/* ---------- phone ---------- */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 md:max-w-2xl lg:hidden">
        <header className="flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-tight">1v1game</span>
          {account}
        </header>
        {playerCard}
        {actions}
        <div className="pt-2">{games}</div>
        <div className="pb-6">{howItWorks}</div>
      </div>

      {/* ---------- PC: everything in one square ---------- */}
      <div className="card hidden aspect-square w-[max(880px,min(94vw,92vh,1040px))] grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-7 overflow-hidden p-9 lg:grid">
        <div className="flex min-h-0 flex-col gap-5">
          <header className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold tracking-tight">1v1game</span>
            {account}
          </header>
          <p className="text-sm leading-relaxed text-muted">
            Duel one opponent in three quick rounds. Win two and you take the match. Live players first; if nobody is online you get a recorded player or a bot.
          </p>
          {playerCard}
          {actions}
        </div>
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto border-l border-line pl-7">
          {games}
          <div className="mt-auto">{howItWorks}</div>
        </div>
      </div>
    </motion.div>
  );
}
