import { useEffect, useState } from 'react';
import { DOMAINS, DOMAIN_LIST, type DomainId } from '../lib/domains';
import type { Found } from '../state/duel';
import { AsyncTag, Avatar, LeagueBadge, Screen } from '../components/ui';

const CELL = 112;
const SPINS = 5;
const SPIN_MS = 2300;

function Reel({ domain }: { domain: DomainId }) {
  const strip = Array.from({ length: SPINS + 1 }, () => DOMAIN_LIST).flat();
  const target = SPINS * DOMAIN_LIST.length + DOMAIN_LIST.findIndex((d) => d.id === domain);
  const [offset, setOffset] = useState(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setOffset(target * CELL)));
    const t = setTimeout(() => setLanded(true), SPIN_MS + 50);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [target]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-2 border-line bg-ink-2" style={{ height: CELL }}>
      <div
        style={{
          transform: `translateY(${-offset}px)`,
          transition: offset ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.18, 1.02)` : 'none',
        }}
      >
        {strip.map((d, i) => (
          <div key={i} className="flex items-center justify-center gap-4 px-6" style={{ height: CELL }}>
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} text-4xl`}>{d.emoji}</div>
            <div className="text-2xl font-black">{d.name}</div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-ink-2 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-ink-2 to-transparent" />
      {landed && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl animate-pop" style={{ boxShadow: `inset 0 0 0 3px ${DOMAINS[domain].color}, 0 0 40px ${DOMAINS[domain].color}` }} />
      )}
    </div>
  );
}

export function VsHeader({ found, roundWins }: { found: Found; roundWins: [number, number] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <Avatar name={found.you.name} size={64} ring="var(--color-me)" />
        <div className="max-w-full truncate font-extrabold">{found.you.name}</div>
        <LeagueBadge league={found.you.league} small />
      </div>
      <div className="flex flex-col items-center">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">vs</div>
        <div className="text-3xl font-black tabular-nums">
          <span className="text-me">{roundWins[0]}</span>
          <span className="mx-1 text-muted">:</span>
          <span className="text-foe">{roundWins[1]}</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <Avatar name={found.opponent.name} size={64} ring="var(--color-foe)" />
        <div className="flex max-w-full items-center gap-1">
          <span className="truncate font-extrabold">{found.opponent.name}</span>
        </div>
        <LeagueBadge league={found.opponent.league} small />
      </div>
    </div>
  );
}

export function FoundScreen({ found }: { found: Found }) {
  return (
    <Screen className="justify-center">
      <div className="text-center text-sm font-bold uppercase tracking-[0.3em] text-good animate-pop">Adversar găsit!</div>
      <div className="mt-6 animate-rise">
        <VsHeader found={found} roundWins={[0, 0]} />
      </div>
      {found.opponent.async && (
        <div className="mt-3 flex justify-end pr-6">
          <AsyncTag />
        </div>
      )}
    </Screen>
  );
}

export function IntroScreen({ found, index, domain, roundWins }: { found: Found; index: number; domain: DomainId; roundWins: [number, number] }) {
  const meta = DOMAINS[domain];
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReveal(true), SPIN_MS + 100);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <Screen className="justify-center">
      <VsHeader found={found} roundWins={roundWins} />
      <div className="mt-10 text-center">
        <div className="text-sm font-bold uppercase tracking-[0.3em] text-muted">Runda {index + 1} din 3</div>
      </div>
      <div className="mt-4">
        <Reel key={index} domain={domain} />
      </div>
      <div className="mt-6 h-16 text-center">
        {reveal && (
          <div className="animate-pop">
            <div className="text-2xl font-black" style={{ color: meta.color }}>
              Runda {index + 1}: {meta.name}
            </div>
            <div className="mt-1 text-sm text-muted">{meta.tagline}</div>
          </div>
        )}
      </div>
    </Screen>
  );
}
