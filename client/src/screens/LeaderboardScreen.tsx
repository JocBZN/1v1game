import { useEffect, useRef, useState } from 'react';
import { api, type LeaderboardEntry, type LeaderboardResponse, type Me, type RatingTrack } from '../lib/api';
import { DOMAINS, DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META } from '../lib/leagues';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Crown, Trophy } from 'lucide-react';
import { Avatar, LeagueIcon, TopicIcon } from '../components/ui';
import { FloatingShapes } from '../components/Fun';
import { SignupPrompt } from '../components/SignupPrompt';
import { track as trackEvent } from '../lib/analytics';

const TABS: { id: RatingTrack; label: string }[] = [
  { id: 'general', label: 'Overall' },
  ...DOMAIN_LIST.map((d) => ({ id: d.id as RatingTrack, label: d.short })),
];

/** Podium colours: gold-ish coral, silver slate, bronze. */
const PODIUM = [
  { bg: '#15788c', fg: 'text-cream', badge: '#ffb0a3', h: 'pt-7' },
  { bg: '#46425e', fg: 'text-cream', badge: '#d2f0ef', h: 'pt-4' },
  { bg: '#ffb0a3', fg: 'text-slate', badge: '#fff8e6', h: 'pt-3' },
];

function record(e: LeaderboardEntry) {
  return `${e.wins}W ${e.losses}L${e.draws ? ` ${e.draws}D` : ''}`;
}

/** Top 3 side by side: 2nd · 1st · 3rd, the winner taller with a crown. */
function Podium({ rows, myId }: { rows: LeaderboardEntry[]; myId: number }) {
  const still = useReducedMotion();
  const order = [rows[1], rows[0], rows[2]];
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {order.map((e, col) => {
        if (!e) return <div key={col} />;
        const p = PODIUM[e.rank - 1];
        const first = e.rank === 1;
        const mine = e.userId === myId;
        return (
          <motion.div
            key={e.userId}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18, delay: first ? 0.25 : col === 0 ? 0.1 : 0.4 }}
            className={`relative flex min-w-0 flex-col items-center gap-1 rounded-3xl px-2 pb-3 ${p.h} ${p.fg} ${mine ? 'ring-2 ring-red ring-offset-2 ring-offset-bg' : ''}`}
            style={{ background: p.bg, boxShadow: `0 14px 30px -16px ${p.bg}` }}
          >
            {first && (
              <motion.span
                className="absolute -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-orange text-slate shadow-[0_6px_14px_-6px_#c8705f]"
                animate={still ? undefined : { y: [0, -3, 0], rotate: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Crown size={17} strokeWidth={2.6} />
              </motion.span>
            )}
            <Avatar name={e.nickname} icon={e.avatar} size={first ? 56 : 44} />
            <div className="mt-1 max-w-full truncate text-sm font-bold">{e.nickname}</div>
            <div className={`font-display font-bold tabular-nums leading-none ${first ? 'text-3xl' : 'text-2xl'}`}>{e.rating}</div>
            <div className="flex max-w-full items-center gap-1 truncate text-[10px] font-semibold opacity-75">
              <LeagueIcon league={e.league} size={10} /> {record(e)}
            </div>
            <span
              className="mt-1.5 flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold text-slate"
              style={{ background: p.badge }}
            >
              {e.rank}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function Row({ e, mine, delay, dark }: { e: LeaderboardEntry; mine: boolean; delay: number; dark?: boolean }) {
  const league = LEAGUE_META[e.league];
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, type: 'spring', stiffness: 300, damping: 26 }}
      className={`flex items-center gap-3 rounded-3xl px-3 py-2.5 ${
        dark
          ? 'bg-slate text-cream'
          : mine
            ? 'bg-cyan-soft shadow-[0_10px_30px_-20px_rgb(21_120_140/0.6)] ring-2 ring-teal'
            : 'bg-surface/85 shadow-[0_10px_30px_-22px_rgb(70_66_94/0.5)] backdrop-blur'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold tabular-nums ${dark ? 'bg-cream/15' : 'bg-sunken text-muted'}`}>
        {e.rank}
      </span>
      <Avatar name={e.nickname} icon={e.avatar} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">
          {e.nickname} {mine && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${dark ? 'bg-red text-white' : 'bg-teal text-cream'}`}>you</span>}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold ${dark ? 'opacity-70' : ''}`} style={dark ? undefined : { color: league.color }}>
          <LeagueIcon league={e.league} size={11} /> {league.name}
          <span className={dark ? '' : 'text-muted'}>· {record(e)}</span>
        </div>
      </div>
      <div className="font-display text-2xl font-bold tabular-nums">{e.rating}</div>
    </motion.div>
  );
}

export function LeaderboardScreen({ me, onBack, onSignup, onLogin }: { me: Me; onBack: () => void; onSignup: () => void; onLogin: () => void }) {
  const [track, setTrack] = useState<RatingTrack>('general');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState(false);
  const myRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(false);
    api.leaderboard(track).then((d) => alive && setData(d)).catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [track]);

  const inTop = data?.rows.some((r) => r.userId === me.user.id);
  const top = data?.rows.filter((r) => r.rank <= 3) ?? [];
  const rest = data?.rows.filter((r) => r.rank > 3) ?? [];

  return (
    <div className="relative min-h-full w-full">
      <FloatingShapes />
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-4 safe-bottom sm:px-6 md:max-w-xl lg:max-w-2xl">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <motion.button
            onClick={onBack}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface/85 shadow-[0_10px_30px_-18px_rgb(70_66_94/0.5)] backdrop-blur"
            aria-label="Back"
          >
            <ArrowLeft size={19} strokeWidth={2.5} />
          </motion.button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold leading-none tracking-tight">Leaderboard</h1>
            <div className="mt-1 text-xs font-semibold text-muted">
              {track === 'general' ? 'Overall rating · all games' : `${DOMAINS[track].name} · changes after every round`}
            </div>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange text-slate">
            <Trophy size={20} strokeWidth={2.4} />
          </span>
        </motion.header>

        {me.user.guest && (
          <div className="mt-4">
            <SignupPrompt
              compact
              where="leaderboard"
              title="Guests aren’t ranked"
              text={`Create a free account to appear here${me.ratings.general.games > 0 ? ` with your ${me.ratings.general.rating} rating` : ''}.`}
              onSignup={onSignup}
              onLogin={onLogin}
            />
          </div>
        )}

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
          {TABS.map((t) => {
            const active = track === t.id;
            const d = t.id !== 'general' ? DOMAINS[t.id] : null;
            return (
              <motion.button
                key={t.id}
                onClick={() => {
                  setTrack(t.id);
                  trackEvent('leaderboard_tab', { tab: t.id });
                }}
                whileTap={{ scale: 0.94 }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 text-sm font-semibold transition-shadow ${d ? 'pl-1 pr-3.5' : 'px-4'} ${active ? 'shadow-[0_8px_18px_-10px_rgb(70_66_94/0.8)] ring-2 ring-slate' : 'opacity-80 hover:opacity-100'}`}
                style={d ? { background: d.soft, color: d.color } : { background: active ? '#46425e' : '#fff8e6', color: active ? '#ffeecc' : '#46425e' }}
              >
                {d && <TopicIcon domain={d.id} size={24} solid />}
                {t.label}
              </motion.button>
            );
          })}
        </div>

        <div className="mb-28 mt-5">
          {error && <p className="rounded-3xl bg-surface/85 py-10 text-center text-red">Couldn’t load the leaderboard.</p>}
          {!data && !error && <p className="rounded-3xl bg-surface/60 py-10 text-center text-muted">Loading…</p>}
          {data && data.rows.length === 0 && (
            <p className="rounded-3xl bg-surface/85 py-12 text-center text-muted">Nobody has played here yet. Be the first.</p>
          )}
          {top.length > 0 && (
            <div className="mt-4" key={`podium-${track}`} ref={top.some((r) => r.userId === me.user.id) ? myRowRef : undefined}>
              <Podium rows={top} myId={me.user.id} />
            </div>
          )}
          {rest.length > 0 && (
            <div className="mt-4 grid gap-2">
              {rest.map((e, i) => (
                <div key={e.userId} ref={e.userId === me.user.id ? myRowRef : undefined}>
                  <Row e={e} mine={e.userId === me.user.id} delay={300 + Math.min(i, 15) * 25} />
                </div>
              ))}
            </div>
          )}
        </div>

        {data && (
          <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-8 safe-bottom">
            <div className="mx-auto max-w-md pb-3 md:max-w-xl lg:max-w-2xl">
              {data.guest ? (
                <motion.button
                  onClick={onSignup}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-3xl bg-teal px-6 py-4 font-display text-lg font-bold text-cream shadow-[0_14px_30px_-14px_#15788c]"
                >
                  Create an account to get ranked
                </motion.button>
              ) : data.me ? (
                inTop ? (
                  <motion.button
                    onClick={() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-3xl bg-slate px-6 py-3.5 text-sm font-bold text-cream"
                  >
                    You’re #{data.me.rank} · show me
                  </motion.button>
                ) : (
                  <Row e={data.me} mine dark delay={0} />
                )
              ) : (
                <div className="rounded-3xl bg-slate py-3.5 text-center text-sm font-semibold text-cream">Play a duel to appear on the leaderboard.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
