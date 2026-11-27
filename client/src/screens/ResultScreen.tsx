import { useEffect, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowRight, ArrowUpRight, Crown, Equal, Flag, Home, ShieldX, Trophy, Users } from 'lucide-react';
import { DOMAINS, type DomainId } from '../lib/domains';
import { LEAGUE_META, leagueRank } from '../lib/leagues';
import type { DuelResult, Found, RatingChange, RoomState } from '../state/duel';
import { AsyncTag, Avatar, LeagueIcon, TopicIcon, useAnimatedNumber } from '../components/ui';
import { FloatingShapes, SoftPanel, VsBubble } from '../components/Fun';
import { SignupPrompt } from '../components/SignupPrompt';
import type { Me } from '../lib/api';

/** Why the rating moved more or less than usual: streak, score margin, record. */
function FactorChips({ f }: { f: NonNullable<DuelResult['ratingFactors']> }) {
  const pct = (x: number) => `${x >= 1 ? '+' : '−'}${Math.round(Math.abs(x - 1) * 100)}%`;
  const chips: string[] = [];
  if (Math.abs(f.streak) >= 2) chips.push(`${Math.abs(f.streak)} ${f.streak > 0 ? 'wins' : 'losses'} in a row ${pct(f.streakX)}`);
  if (Math.abs(f.marginX - 1) >= 0.05) chips.push(`${f.marginX > 1 ? 'One-sided' : 'Close'} score ${pct(f.marginX)}`);
  if (Math.abs(f.recordX - 1) >= 0.03) chips.push(`Your record ${pct(f.recordX)}`);
  if (!chips.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((c) => <span key={c} className="chip bg-sunken text-muted">{c}</span>)}
    </div>
  );
}

function Delta({ change, big }: { change: RatingChange; big?: boolean }) {
  const d = Math.round(change.after) - Math.round(change.before);
  const shown = useAnimatedNumber(Math.round(change.after), 1200);
  const color = d > 0 ? 'text-cyan-strong bg-cyan-soft' : d < 0 ? 'text-red-strong bg-red-soft' : 'text-muted bg-sunken';
  return (
    <div className="flex items-center gap-2">
      <span className={`${big ? 'font-display text-5xl font-bold' : 'text-lg font-bold'} tabular-nums tracking-tight`}>{shown}</span>
      <span className={`rounded-full px-2 py-0.5 ${big ? 'text-sm' : 'text-xs'} font-bold tabular-nums ${color}`}>
        {d > 0 ? `+${d}` : d === 0 ? '±0' : d}
      </span>
    </div>
  );
}

/** Palette confetti from both bottom corners. */
function celebrate() {
  const colors = ['#ff6973', '#ffb0a3', '#00b9be', '#ffeecc'];
  const fire = (x: number, angle: number) => confetti({ particleCount: 70, spread: 65, angle, origin: { x, y: 0.9 }, colors, scalar: 1.05, ticks: 220 });
  fire(0.1, 60);
  fire(0.9, 120);
  setTimeout(() => confetti({ particleCount: 90, spread: 100, origin: { y: 0.35 }, colors, startVelocity: 35 }), 350);
}

/** One side of the final score: light panel for you, dark slate for the opponent (same as the home face-off). */
function Side({ name, avatar, wins, side, won, extra }: { name: string; avatar?: string | null; wins: number; side: 'me' | 'foe'; won: boolean; extra?: ReactNode }) {
  const me = side === 'me';
  return (
    <motion.div
      initial={{ x: me ? -50 : 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 }}
      className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-3xl px-3 pb-4 pt-5 ${me ? 'bg-surface/85 shadow-[0_10px_30px_-18px_rgb(70_66_94/0.5)] backdrop-blur' : 'bg-slate text-cream'}`}
    >
      {won && (
        <motion.span
          initial={{ y: -14, opacity: 0, rotate: -20 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.6 }}
          className="absolute -top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-slate shadow-[0_6px_14px_-6px_#c8705f]"
        >
          <Crown size={15} strokeWidth={2.6} />
        </motion.span>
      )}
      <Avatar name={name} src={avatar} size={52} ring={me ? 'var(--color-teal)' : 'var(--color-red)'} />
      <div className="max-w-full truncate text-sm font-bold">{name}</div>
      <div className={`font-display text-5xl font-bold leading-none tabular-nums ${me ? 'text-me' : 'text-red'}`}>{wins}</div>
      <div className={`text-[11px] font-semibold ${me ? 'text-muted' : 'opacity-70'}`}>rounds won</div>
      {extra}
    </motion.div>
  );
}

export function ResultScreen({ me, found, result, room, onAgain, onLeaderboard, onHome, onSignup }: {
  me: Me;
  found: Found | null;
  result: DuelResult;
  /** Set for a duel played in a private room. */
  room: RoomState | null;
  onAgain: () => void;
  onLeaderboard: () => void;
  onHome: () => void;
  onSignup: () => void;
}) {
  const still = useReducedMotion();
  const win = result.result === 'win';
  const loss = result.result === 'loss';
  const title = win ? 'Victory' : loss ? 'Defeat' : 'Draw';
  const subtitle = win ? 'You won the duel.' : loss ? 'So close. Get the next one.' : 'Nobody blinked.';
  const color = win ? 'text-teal' : loss ? 'text-red' : 'text-orange-strong';
  const HeroIcon = win ? Trophy : loss ? ShieldX : Equal;
  const heroBg = win ? '#15788c' : loss ? '#ff6973' : '#46425e';
  const general = result.ratingChanges?.general;
  const domainChanges = Object.entries(result.ratingChanges ?? {}).filter(([k]) => k !== 'general') as [DomainId, RatingChange][];
  const leagueUp = result.league && result.league.before !== result.league.after;
  const promoted = leagueUp && leagueRank(result.league!.after) > leagueRank(result.league!.before);

  useEffect(() => {
    if (win) celebrate();
  }, [win]);

  const enter = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1 + i * 0.07, type: 'spring' as const, stiffness: 260, damping: 24 },
  });

  const hero = (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 13 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] text-cream"
        style={{ background: heroBg, boxShadow: `0 14px 30px -14px ${heroBg}` }}
      >
        {!still && win && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-[1.6rem] border-2"
            style={{ borderColor: heroBg }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <HeroIcon size={40} strokeWidth={2.4} />
      </motion.div>
      <motion.h1
        initial={{ scale: 1.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.08 }}
        className={`mt-4 font-display text-6xl font-bold tracking-tighter ${color}`}
      >
        {title}
      </motion.h1>
      <p className="mt-1 text-sm font-medium text-muted">{subtitle}</p>
      {result.forfeit && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <Flag size={14} strokeWidth={2.4} /> {result.forfeit === 'you' ? 'You forfeited the duel.' : 'Your opponent forfeited.'}
        </p>
      )}
    </div>
  );

  const faceOff = (
    <div className="flex items-stretch gap-2 sm:gap-3">
      <Side name={found?.you.name ?? 'You'} avatar={found?.you.avatar} wins={result.roundWins[0]} side="me" won={win} />
      <div className="relative z-10 shrink-0 self-center"><VsBubble size={52} /></div>
      <Side
        name={result.opponent.name}
        avatar={result.opponent.avatar}
        wins={result.roundWins[1]}
        side="foe"
        won={loss}
        extra={result.opponent.async ? <span className="mt-0.5 rounded-full bg-cream/90"><AsyncTag /></span> : undefined}
      />
    </div>
  );

  const rounds = (
    <div className="grid gap-2">
      {result.rounds.map((r, i) => {
        const m = DOMAINS[r.domain];
        const tag = r.winner === 'you' ? { t: 'you', c: 'bg-teal text-cream' } : r.winner === 'opponent' ? { t: 'them', c: 'bg-red text-white' } : { t: 'draw', c: 'bg-slate text-cream' };
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
            className="flex items-center gap-3 rounded-3xl py-2 pl-2 pr-3"
            style={{ background: m.soft }}
          >
            <TopicIcon domain={r.domain} size={36} solid />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold" style={{ color: m.color }}>{m.name}</div>
              <div className="text-[11px] font-semibold text-text/60">Round {i + 1}</div>
            </div>
            <span className="font-display text-lg font-bold tabular-nums text-me">{r.you}</span>
            <span className="text-text/40">–</span>
            <span className="font-display text-lg font-bold tabular-nums text-red">{r.opponent}</span>
            <span className={`ml-1 w-12 rounded-full py-0.5 text-center text-[10px] font-bold uppercase tracking-wide ${tag.c}`}>{tag.t}</span>
          </motion.div>
        );
      })}
    </div>
  );

  const rating = general && (
    <SoftPanel className="p-4">
      <div className="flex items-center justify-between">
        <span className="label">Overall rating</span>
        {result.league && (
          <span className="flex items-center gap-1 text-sm font-bold" style={{ color: LEAGUE_META[result.league.after].color }}>
            <LeagueIcon league={result.league.after} size={15} /> {LEAGUE_META[result.league.after].name}
          </span>
        )}
      </div>
      <div className="mt-1">
        <Delta change={general} big />
      </div>
      {result.ratingFactors && <FactorChips f={result.ratingFactors} />}
      {leagueUp && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 14 }}
          className={`mt-3 flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-bold ${promoted ? 'bg-orange-soft text-orange-strong' : 'bg-sunken text-muted'}`}
        >
          {promoted ? (
            <><ArrowUpRight size={16} strokeWidth={2.8} /> Promoted to {LEAGUE_META[result.league!.after].name}</>
          ) : (
            <>Dropped to {LEAGUE_META[result.league!.after].name}. You’ll be back.</>
          )}
        </motion.div>
      )}
      {domainChanges.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-line pt-3">
          {domainChanges.map(([d, c]) => (
            <div key={d} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-muted">
                <TopicIcon domain={d} size={22} /> {DOMAINS[d].name}
              </span>
              <Delta change={c} />
            </div>
          ))}
        </div>
      )}
    </SoftPanel>
  );

  const extras = (
    <>
      {me.user.guest && general && (
        <SignupPrompt
          compact
          where="result"
          title={`Keep your ${Math.round(general.after)} rating`}
          text="You’re a guest: create a free account to save it and get on the leaderboard."
          onSignup={onSignup}
        />
      )}
      {result.friendly && (
        <SoftPanel className="p-4 text-center text-sm text-muted">
          {room && room.duels > 0 && (
            <div className="mb-1 flex items-center justify-center gap-2 text-base text-text">
              <Users size={16} strokeWidth={2.4} /> Room score <span className="font-bold text-me">{room.score[0]}</span> – <span className="font-bold text-red">{room.score[1]}</span>
            </div>
          )}
          {result.practice ? 'Practice vs bot' : 'Friend duel'} · no rating change
        </SoftPanel>
      )}
    </>
  );

  const againLabel = result.practice ? 'Play again' : result.friendly && room
    ? room.guest && (room.you === 'host' ? room.guest.ready : room.host.ready)
      ? `${result.opponent.name} wants a rematch`
      : 'Rematch'
    : 'Another duel';

  const actions = (
    <div className="grid gap-3">
      <motion.button
        onClick={onAgain}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="group relative w-full overflow-hidden rounded-3xl bg-teal px-6 py-5 text-left text-cream shadow-[0_14px_30px_-14px_#15788c]"
      >
        {!still && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/15"
            initial={{ left: '-40%' }}
            animate={{ left: '130%' }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
          />
        )}
        <span className="relative flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate font-display text-3xl font-bold tracking-tight">{againLabel}</span>
            <span className="block text-sm font-medium opacity-80">{result.practice ? `${DOMAINS[result.practice].name} vs bot` : result.friendly ? 'same room, new games' : '3 new random games'}</span>
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
      <div className="grid grid-cols-2 gap-3">
        {[
          { on: onLeaderboard, icon: Trophy, label: 'Leaderboard', sub: 'see where you stand', color: '#00b9be' },
          { on: onHome, icon: Home, label: 'Home', sub: 'back to the start', color: '#ffb0a3' },
        ].map((b) => (
          <motion.button
            key={b.label}
            onClick={b.on}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 rounded-3xl bg-surface/80 p-3 text-left shadow-[0_10px_30px_-20px_rgb(70_66_94/0.5)] backdrop-blur"
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
    </div>
  );

  return (
    <div className="relative min-h-full w-full">
      <FloatingShapes />

      {/* ---------- phone / tablet ---------- */}
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col gap-5 px-4 pb-6 pt-6 safe-bottom sm:px-6 md:max-w-xl lg:hidden">
        <motion.div {...enter(0)}>{hero}</motion.div>
        <motion.div {...enter(1)} className="mt-2">{faceOff}</motion.div>
        <motion.div {...enter(2)}>{rounds}</motion.div>
        {rating && <motion.div {...enter(3)}>{rating}</motion.div>}
        <motion.div {...enter(4)} className="grid gap-3 empty:hidden">{extras}</motion.div>
        <motion.div {...enter(5)} className="mt-auto pt-2">{actions}</motion.div>
      </div>

      {/* ---------- PC: one big panel, two columns ---------- */}
      <div className="relative hidden min-h-full items-center justify-center p-8 lg:flex">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="grid w-[min(94vw,1060px)] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 rounded-[2.5rem] bg-surface/85 p-10 shadow-[0_40px_80px_-40px_rgb(70_66_94/0.45)] backdrop-blur"
        >
          <div className="flex min-h-0 flex-col gap-7">
            <header className="font-display text-2xl font-bold tracking-tight">1v1<span className="text-red">game</span></header>
            {hero}
            <div className="mt-3">{faceOff}</div>
            <div className="mt-auto">{actions}</div>
          </div>
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl font-bold">Rounds</span>
              <span className="text-xs text-muted">best of 3</span>
            </div>
            {rounds}
            {rating}
            {extras}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
