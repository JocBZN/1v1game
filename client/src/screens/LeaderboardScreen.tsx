import { useEffect, useRef, useState } from 'react';
import { api, type LeaderboardEntry, type LeaderboardResponse, type Me, type RatingTrack } from '../lib/api';
import { DOMAINS, DOMAIN_LIST } from '../lib/domains';
import { LEAGUE_META } from '../lib/leagues';
import { Avatar, Screen } from '../components/ui';

const TABS: { id: RatingTrack; label: string; emoji: string }[] = [
  { id: 'general', label: 'General', emoji: '🏆' },
  ...DOMAIN_LIST.map((d) => ({ id: d.id as RatingTrack, label: d.short, emoji: d.emoji })),
];

const MEDALS = ['🥇', '🥈', '🥉'];

function Row({ e, mine, delay }: { e: LeaderboardEntry; mine: boolean; delay: number }) {
  const league = LEAGUE_META[e.league];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 animate-rise ${mine ? 'border-me bg-me/10 shadow-[0_0_24px_-8px_var(--color-me)]' : 'border-line bg-panel/60'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-8 text-center text-lg font-black tabular-nums text-muted">{e.rank <= 3 ? MEDALS[e.rank - 1] : e.rank}</div>
      <Avatar name={e.nickname} size={34} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">
          {e.nickname} {mine && <span className="text-xs font-bold text-me">(tu)</span>}
        </div>
        <div className="text-[11px] text-muted">
          {league.emoji} {league.name} · {e.wins}V {e.losses}Î{e.draws ? ` ${e.draws}E` : ''}
        </div>
      </div>
      <div className="text-xl font-black tabular-nums" style={{ color: league.color }}>{e.rating}</div>
    </div>
  );
}

export function LeaderboardScreen({ me, onBack }: { me: Me; onBack: () => void }) {
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
      <header className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-xl bg-panel-2 px-3 py-2 text-sm font-bold">←</button>
        <h1 className="text-2xl font-black">Clasament</h1>
      </header>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTrack(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              track === t.id ? 'border-transparent bg-white text-ink' : 'border-line bg-panel/60 text-muted'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      {track !== 'general' && <p className="mt-2 text-xs text-muted">Rating pe {DOMAINS[track].name.toLowerCase()} — se schimbă după fiecare rundă jucată în domeniu.</p>}

      <div className="mt-3 flex-1 space-y-2 pb-24">
        {error && <p className="py-10 text-center text-bad">Nu s-a putut încărca clasamentul.</p>}
        {!data && !error && <p className="py-10 text-center text-muted">Se încarcă…</p>}
        {data && data.rows.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-5xl">🏁</div>
            <p className="mt-3 text-muted">Nimeni n-a jucat încă aici. Fii primul!</p>
          </div>
        )}
        {data?.rows.map((e, i) => (
          <div key={e.userId} ref={e.userId === me.user.id ? myRowRef : undefined}>
            <Row e={e} mine={e.userId === me.user.id} delay={Math.min(i, 15) * 25} />
          </div>
        ))}
      </div>

      {data && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/95 to-transparent px-4 pt-6 safe-bottom">
          <div className="mx-auto max-w-md">
            {data.me ? (
              inTop ? (
                <button onClick={() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="w-full rounded-2xl border border-me/50 bg-panel py-3 text-sm font-bold text-me">
                  Ești pe locul #{data.me.rank} · arată-mă
                </button>
              ) : (
                <Row e={data.me} mine delay={0} />
              )
            ) : (
              <div className="rounded-2xl border border-line bg-panel py-3 text-center text-sm text-muted">Joacă un duel ca să apari în clasament.</div>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}
