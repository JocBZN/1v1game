import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowUpRight, Equal, Flag, Home, RotateCcw, ShieldX, Swords, Trophy, Users } from 'lucide-react';
import { DOMAINS, type DomainId } from '../lib/domains';
import { LEAGUE_META, leagueRank } from '../lib/leagues';
import type { DuelResult, Found, RatingChange, RoomState } from '../state/duel';
import { AsyncTag, Avatar, LeagueIcon, Screen, TopicIcon, rise, useAnimatedNumber } from '../components/ui';
import { SignupPrompt } from '../components/SignupPrompt';
import type { Me } from '../lib/api';

function Delta({ change, big }: { change: RatingChange; big?: boolean }) {
  const d = Math.round(change.after) - Math.round(change.before);
  const shown = useAnimatedNumber(Math.round(change.after), 1200);
  const color = d > 0 ? 'text-cyan-strong bg-cyan-soft' : d < 0 ? 'text-red bg-red-soft' : 'text-muted bg-sunken';
  return (
    <div className="flex items-center gap-2">
      <span className={`${big ? 'font-display text-5xl font-extrabold' : 'text-lg font-bold'} tabular-nums tracking-tight`}>{shown}</span>
      <span className={`rounded-full px-2 py-0.5 ${big ? 'text-sm' : 'text-xs'} font-bold tabular-nums ${color}`}>
        {d > 0 ? `+${d}` : d === 0 ? '±0' : d}
      </span>
    </div>
  );
}

/** Palette confetti from both bottom corners. */
function celebrate() {
  const colors = ['#df301c', '#ff9100', '#00b7cd', '#fff1d1'];
  const fire = (x: number, angle: number) => confetti({ particleCount: 70, spread: 65, angle, origin: { x, y: 0.9 }, colors, scalar: 1.05, ticks: 220 });
  fire(0.1, 60);
  fire(0.9, 120);
  setTimeout(() => confetti({ particleCount: 90, spread: 100, origin: { y: 0.35 }, colors, startVelocity: 35 }), 350);
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
  const win = result.result === 'win';
  const loss = result.result === 'loss';
  const title = win ? 'Victory' : loss ? 'Defeat' : 'Draw';
  const color = win ? 'text-cyan-strong' : loss ? 'text-red' : 'text-orange-strong';
  const HeroIcon = win ? Trophy : loss ? ShieldX : Equal;
  const heroBg = win ? 'linear-gradient(140deg, #19c6db, #007f8f)' : loss ? 'linear-gradient(140deg, #ec4630, #a8230f)' : 'linear-gradient(140deg, #ffa733, #b56500)';
  const general = result.ratingChanges?.general;
  const domainChanges = Object.entries(result.ratingChanges ?? {}).filter(([k]) => k !== 'general') as [DomainId, RatingChange][];
  const leagueUp = result.league && result.league.before !== result.league.after;
  const promoted = leagueUp && leagueRank(result.league!.after) > leagueRank(result.league!.before);

  useEffect(() => {
    if (win) celebrate();
  }, [win]);

  return (
    <Screen className="pb-4">
      <div className="mt-5 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 13 }}
          className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] text-[#fff8e8]"
          style={{ background: heroBg, boxShadow: '0 6px 0 rgb(0 0 0 / 0.18), 0 20px 40px -18px rgb(43 27 18 / 0.7)' }}
        >
          <HeroIcon size={40} strokeWidth={2.4} />
        </motion.div>
        <motion.h1
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.08 }}
          className={`mt-4 text-6xl font-extrabold tracking-tighter ${color}`}
        >
          {title}
        </motion.h1>
        {result.forfeit && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <Flag size={14} strokeWidth={2.4} /> {result.forfeit === 'you' ? 'You forfeited the duel.' : 'Your opponent forfeited.'}
          </p>
        )}
      </div>

      <motion.div {...rise(2)} className="mt-6 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={found?.you.name ?? 'You'} size={40} ring="var(--color-cyan)" />
          <span className="font-display text-5xl font-extrabold tabular-nums text-me">{result.roundWins[0]}</span>
        </div>
        <Swords size={20} strokeWidth={2.4} className="text-line-strong" />
        <div className="flex items-center gap-2.5">
          <span className="font-display text-5xl font-extrabold tabular-nums text-foe">{result.roundWins[1]}</span>
          <Avatar name={result.opponent.name} size={40} ring="var(--color-red)" />
        </div>
      </motion.div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
        vs {result.opponent.name} {result.opponent.async && <AsyncTag />}
      </div>

      <motion.div {...rise(3)} className="card mt-6 divide-y divide-line/70 overflow-hidden">
        {result.rounds.map((r, i) => {
          const m = DOMAINS[r.domain];
          const mark = r.winner === 'you' ? 'bg-cyan' : r.winner === 'opponent' ? 'bg-red' : 'bg-orange';
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className={`h-8 w-1.5 rounded-full ${mark}`} />
              <TopicIcon domain={r.domain} size={30} />
              <span className="flex-1 truncate text-sm font-semibold">{m.name}</span>
              <span className="font-bold tabular-nums text-me">{r.you}</span>
              <span className="text-line-strong">–</span>
              <span className="font-bold tabular-nums text-foe">{r.opponent}</span>
            </div>
          );
        })}
      </motion.div>

      {general && (
        <motion.div {...rise(4)} className="card mt-3 p-4">
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
          {leagueUp && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 14 }}
              className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${promoted ? 'bg-orange-soft text-orange-strong' : 'bg-sunken text-muted'}`}
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
        </motion.div>
      )}

      {me.user.guest && general && (
        <div className="mt-3">
          <SignupPrompt
            compact
            where="result"
            title={`Keep your ${Math.round(general.after)} rating`}
            text="You’re a guest: create a free account to save it and get on the leaderboard."
            onSignup={onSignup}
          />
        </div>
      )}

      {result.friendly && (
        <motion.div {...rise(4)} className="card mt-3 p-4 text-center text-sm text-muted">
          {room && room.duels > 0 && (
            <div className="mb-1 flex items-center justify-center gap-2 text-base text-text">
              <Users size={16} strokeWidth={2.4} /> Room score <span className="font-bold text-me">{room.score[0]}</span> – <span className="font-bold text-foe">{room.score[1]}</span>
            </div>
          )}
          Friend duel · no rating change
        </motion.div>
      )}

      <div className="mt-auto grid gap-3 pt-6">
        <button onClick={onAgain} className="btn btn-primary py-4 text-lg">
          <RotateCcw size={19} strokeWidth={2.6} />
          {result.friendly && room
            ? room.guest && (room.you === 'host' ? room.guest.ready : room.host.ready)
              ? `${result.opponent.name} wants a rematch — Play`
              : 'Rematch'
            : 'Another duel'}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onLeaderboard} className="btn btn-secondary py-3">
            <Trophy size={16} strokeWidth={2.5} className="text-orange-strong" /> Leaderboard
          </button>
          <button onClick={onHome} className="btn btn-secondary py-3">
            <Home size={16} strokeWidth={2.5} className="text-cyan-strong" /> Home
          </button>
        </div>
      </div>
    </Screen>
  );
}
