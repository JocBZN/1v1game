import { useEffect, useRef, useState } from 'react';
import { api, type LeaderboardEntry, type LeaderboardResponse, type Me, type RatingTrack } from '../lib/api';
import { DOMAINS, DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META } from '../lib/leagues';
import { Avatar, PageHeader, Screen } from '../components/ui';
import { SignupPrompt } from '../components/SignupPrompt';

const TABS: { id: RatingTrack; label: string }[] = [
  { id: 'general', label: 'Overall' },
  ...DOMAIN_LIST.map((d) => ({ id: d.id as RatingTrack, label: d.short })),
];

const PODIUM = ['#b56500', '#7a7268', '#9c5a2e'];

function Row({ e, mine, delay }: { e: LeaderboardEntry; mine: boolean; delay: number }) {
  const league = LEAGUE_META[e.league];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 animate-rise ${mine ? 'border border-cyan bg-cyan-soft/60' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-7 text-center text-sm font-semibold tabular-nums" style={{ color: e.rank <= 3 ? PODIUM[e.rank - 1] : 'var(--color-muted)' }}>
        {e.rank}
      </div>
      <Avatar name={e.nickname} size={32} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">
          {e.nickname} {mine && <span className="text-xs font-semibold text-cyan-strong">you</span>}
        </div>
        <div className="text-[11px] text-muted">
          {league.emoji} {league.name} · {e.wins}W {e.losses}L{e.draws ? ` ${e.draws}D` : ''}
        </div>
      </div>
      <div className="text-lg font-semibold tabular-nums">{e.rating}</div>
    </div>
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

  return (
    <Screen>
      <PageHeader title="Leaderboard" onBack={onBack} />

      {me.user.guest && (
        <div className="mt-3">
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

      <div className="-mx-5 mt-4 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTrack(t.id)}
            className={`chip shrink-0 px-3.5 py-1.5 text-sm transition-colors ${
              track === t.id ? 'bg-text text-cream' : 'border border-line text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {track !== 'general' && <p className="mt-2 text-xs text-muted">{DOMAINS[track].name} rating — changes after every round in this topic.</p>}

      <div className="card mt-3 mb-24 p-1.5">
        {error && <p className="py-10 text-center text-red">Couldn’t load the leaderboard.</p>}
        {!data && !error && <p className="py-10 text-center text-muted">Loading…</p>}
        {data && data.rows.length === 0 && <p className="py-12 text-center text-muted">Nobody has played here yet. Be the first.</p>}
        {data?.rows.map((e, i) => (
          <div key={e.userId} ref={e.userId === me.user.id ? myRowRef : undefined}>
            <Row e={e} mine={e.userId === me.user.id} delay={Math.min(i, 15) * 20} />
          </div>
        ))}
      </div>

      {data && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pt-6 safe-bottom">
          <div className="mx-auto max-w-md">
            {data.guest ? (
              <button onClick={onSignup} className="btn btn-primary w-full py-3.5">
                Create an account to get ranked
              </button>
            ) : data.me ? (
              inTop ? (
                <button onClick={() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="btn btn-secondary w-full py-3 text-sm">
                  You’re #{data.me.rank} · show me
                </button>
              ) : (
                <div className="card p-1">
                  <Row e={data.me} mine delay={0} />
                </div>
              )
            ) : (
              <div className="card py-3 text-center text-sm text-muted">Play a duel to appear on the leaderboard.</div>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}
