import { useEffect, useState } from 'react';
import { api, type Me, type ProfileResponse } from '../lib/api';
import { DOMAINS, DOMAIN_LIST, type DomainId } from '../lib/domains';
import { LEAGUE_META } from '../lib/leagues';
import { AsyncTag, Avatar, LeagueBadge, Screen } from '../components/ui';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'acum';
  if (s < 3600) return `acum ${Math.floor(s / 60)} min`;
  if (s < 86400) return `acum ${Math.floor(s / 3600)} h`;
  return `acum ${Math.floor(s / 86400)} z`;
}

function winRate(w: number, l: number, d: number) {
  const n = w + l + d;
  return n ? Math.round((100 * (w + d / 2)) / n) : null;
}

export function ProfileScreen({ me, onBack }: { me: Me; onBack: () => void }) {
  const [p, setP] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.profile('me').then(setP).catch(() => setError(true));
  }, []);

  const data = p ?? { ...me, recent: [] };
  const g = data.ratings.general;
  const league = LEAGUE_META[data.league.id];
  const wr = winRate(g.wins, g.losses, g.draws);

  return (
    <Screen className="pb-6">
      <header className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-xl bg-panel-2 px-3 py-2 text-sm font-bold">←</button>
        <h1 className="text-2xl font-black">Profil</h1>
      </header>

      <section className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 animate-rise" style={{ boxShadow: `0 0 60px -24px ${league.color}` }}>
        <div className="flex items-center gap-4">
          <Avatar name={data.user.nickname} size={64} ring={league.color} />
          <div className="min-w-0">
            <div className="truncate text-2xl font-black">{data.user.nickname}</div>
            <div className="mt-1">
              <LeagueBadge league={data.league.id} />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-ink-2 py-3">
            <div className="text-2xl font-black tabular-nums" style={{ color: league.color }}>{g.rating}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Rating</div>
          </div>
          <div className="rounded-2xl bg-ink-2 py-3">
            <div className="text-2xl font-black tabular-nums">
              <span className="text-good">{g.wins}</span>
              <span className="text-muted">/</span>
              <span className="text-bad">{g.losses}</span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">V / Î{g.draws ? ` · ${g.draws}E` : ''}</div>
          </div>
          <div className="rounded-2xl bg-ink-2 py-3">
            <div className="text-2xl font-black tabular-nums">{wr === null ? '—' : `${wr}%`}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Victorii</div>
          </div>
        </div>
      </section>

      <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-widest text-muted">Pe domenii</h2>
      <div className="grid grid-cols-2 gap-2">
        {DOMAIN_LIST.map((d, i) => {
          const r = data.ratings[d.id];
          return (
            <div key={d.id} className="rounded-2xl border border-line bg-panel/60 p-3 animate-rise" style={{ animationDelay: `${60 + i * 40}ms` }}>
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${d.gradient} text-base`}>{d.emoji}</span>
                <span className="truncate text-sm font-bold">{d.short}</span>
              </div>
              <div className="mt-2 text-2xl font-black tabular-nums" style={{ color: d.color }}>{r.rating}</div>
              <div className="text-xs text-muted">
                {r.games ? `${r.wins}V · ${r.losses}Î${r.draws ? ` · ${r.draws}E` : ''} (runde)` : 'nejucat încă'}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-widest text-muted">Ultimele dueluri</h2>
      {error && <p className="text-sm text-bad">Nu s-a putut încărca istoricul.</p>}
      {!p && !error && <p className="text-sm text-muted">Se încarcă…</p>}
      {p && p.recent.length === 0 && <p className="rounded-2xl border border-line bg-panel/60 p-4 text-center text-sm text-muted">Niciun duel încă. Apasă JOACĂ!</p>}
      <div className="space-y-2">
        {p?.recent.map((d) => {
          const delta = Math.round(d.ratingAfter) - Math.round(d.ratingBefore);
          const res = d.result === 'W' ? { t: 'V', c: 'bg-good text-ink' } : d.result === 'L' ? { t: 'Î', c: 'bg-bad text-ink' } : { t: 'E', c: 'bg-gold text-ink' };
          return (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel/60 px-3 py-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black ${res.c}`}>{res.t}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-bold">vs {d.opponent}</span>
                  {d.opponentAsync && <AsyncTag />}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  {d.rounds.map((r, i) => (
                    <span key={i} title={DOMAINS[r.domain as DomainId]?.name} className={r.mine > r.theirs ? 'opacity-100' : 'opacity-40'}>
                      {DOMAINS[r.domain as DomainId]?.emoji}
                    </span>
                  ))}
                  <span className="ml-1">
                    {d.roundsWon}–{d.oppRoundsWon}
                    {d.forfeit ? ' · abandon' : ''} · {timeAgo(d.createdAt)}
                  </span>
                </div>
              </div>
              <div className={`text-sm font-black tabular-nums ${delta > 0 ? 'text-good' : delta < 0 ? 'text-bad' : 'text-muted'}`}>
                {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
              </div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
