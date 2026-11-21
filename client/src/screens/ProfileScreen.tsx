import { useEffect, useState } from 'react';
import { api, type Me, type ProfileResponse } from '../lib/api';
import { DOMAINS, DOMAIN_LIST, type DomainId } from '../lib/domains';
import { AsyncTag, Avatar, LeagueBadge, PageHeader, Screen, TopicIcon } from '../components/ui';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function winRate(w: number, l: number, d: number) {
  const n = w + l + d;
  return n ? Math.round((100 * (w + d / 2)) / n) : null;
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="py-1">
      <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
      <div className="label mt-0.5">{label}</div>
    </div>
  );
}

export function ProfileScreen({ me, onBack }: { me: Me; onBack: () => void }) {
  const [p, setP] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.profile('me').then(setP).catch(() => setError(true));
  }, []);

  const data = p ?? { ...me, recent: [] };
  const g = data.ratings.general;
  const wr = winRate(g.wins, g.losses, g.draws);

  return (
    <Screen className="pb-6">
      <PageHeader title="Profile" onBack={onBack} />

      <section className="card mt-4 p-5 animate-rise">
        <div className="flex items-center gap-4">
          <Avatar name={data.user.nickname} size={56} />
          <div className="min-w-0">
            <div className="truncate text-xl font-semibold">{data.user.nickname}</div>
            <div className="mt-0.5">
              <LeagueBadge league={data.league.id} />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-line text-center">
          <Stat value={g.rating} label="Rating" />
          <Stat
            value={
              <>
                <span className="text-cyan-strong">{g.wins}</span>
                <span className="text-line-strong">/</span>
                <span className="text-red">{g.losses}</span>
              </>
            }
            label={`W / L${g.draws ? ` · ${g.draws}D` : ''}`}
          />
          <Stat value={wr === null ? '—' : `${wr}%`} label="Win rate" />
        </div>
      </section>

      <h2 className="label mt-7 mb-2">By topic</h2>
      <div className="card divide-y divide-line">
        {DOMAIN_LIST.map((d) => {
          const r = data.ratings[d.id];
          return (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <TopicIcon emoji={d.emoji} soft={d.soft} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{d.name}</div>
                <div className="text-xs text-muted">
                  {r.games ? `${r.wins}W · ${r.losses}L${r.draws ? ` · ${r.draws}D` : ''} (rounds)` : 'not played yet'}
                </div>
              </div>
              <div className="text-lg font-semibold tabular-nums">{r.rating}</div>
            </div>
          );
        })}
      </div>

      <h2 className="label mt-7 mb-2">Recent duels</h2>
      {error && <p className="text-sm text-red">Couldn’t load your history.</p>}
      {!p && !error && <p className="text-sm text-muted">Loading…</p>}
      {p && p.recent.length === 0 && <p className="card p-4 text-center text-sm text-muted">No duels yet. Hit Play.</p>}
      {p && p.recent.length > 0 && (
        <div className="card divide-y divide-line">
          {p.recent.map((d) => {
            const delta = Math.round(d.ratingAfter) - Math.round(d.ratingBefore);
            const res = d.result === 'W' ? 'bg-cyan-soft text-cyan-strong' : d.result === 'L' ? 'bg-red-soft text-red-strong' : 'bg-orange-soft text-orange-strong';
            return (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${res}`}>{d.result}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">vs {d.opponent}</span>
                    {d.opponentAsync && <AsyncTag />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    {d.rounds.map((r, i) => (
                      <span key={i} title={DOMAINS[r.domain as DomainId]?.name} className={r.mine > r.theirs ? 'opacity-100' : 'opacity-35'}>
                        {DOMAINS[r.domain as DomainId]?.emoji}
                      </span>
                    ))}
                    <span className="ml-1">
                      {d.roundsWon}–{d.oppRoundsWon}
                      {d.forfeit ? ' · forfeit' : ''} · {timeAgo(d.createdAt)}
                    </span>
                  </div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${delta > 0 ? 'text-cyan-strong' : delta < 0 ? 'text-red' : 'text-muted'}`}>
                  {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
