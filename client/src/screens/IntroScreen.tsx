import { useEffect, useState } from 'react';
import { DOMAINS, DOMAIN_LIST, type DomainId } from '../lib/domains';
import type { Found } from '../state/duel';
import { AsyncTag, Avatar, LeagueBadge, Screen, TopicIcon } from '../components/ui';

const CELL = 104;
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
    <div
      className="relative w-full overflow-hidden rounded-3xl border bg-surface transition-colors duration-300"
      style={{ height: CELL, borderColor: landed ? DOMAINS[domain].color : 'var(--color-line)' }}
    >
      <div
        style={{
          transform: `translateY(${-offset}px)`,
          transition: offset ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.18, 1.02)` : 'none',
        }}
      >
        {strip.map((d, i) => (
          <div key={i} className="flex items-center justify-center gap-4 px-6" style={{ height: CELL }}>
            <TopicIcon emoji={d.emoji} soft={d.soft} size={56} />
            <div className="text-2xl font-semibold tracking-tight">{d.name}</div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-surface to-transparent" />
    </div>
  );
}

export function VsHeader({ found, roundWins }: { found: Found; roundWins: [number, number] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <Avatar name={found.you.name} size={56} ring="var(--color-cyan)" />
        <div className="max-w-full truncate font-semibold">{found.you.name}</div>
        <LeagueBadge league={found.you.league} small />
      </div>
      <div className="flex flex-col items-center">
        <div className="label">vs</div>
        <div className="text-3xl font-bold tabular-nums">
          <span className="text-me">{roundWins[0]}</span>
          <span className="mx-1 text-line-strong">:</span>
          <span className="text-foe">{roundWins[1]}</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <Avatar name={found.opponent.name} size={56} ring="var(--color-red)" />
        <div className="max-w-full truncate font-semibold">{found.opponent.name}</div>
        <LeagueBadge league={found.opponent.league} small />
      </div>
    </div>
  );
}

export function FoundScreen({ found }: { found: Found }) {
  return (
    <Screen className="justify-center">
      <div className="label text-center text-cyan-strong animate-pop">Opponent found</div>
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
      <div className="label mt-10 text-center">Round {index + 1} of 3</div>
      <div className="mt-3">
        <Reel key={index} domain={domain} />
      </div>
      <div className="mt-5 h-14 text-center">
        {reveal && (
          <div className="animate-pop">
            <div className="text-lg font-semibold" style={{ color: meta.color }}>
              {meta.name}
            </div>
            <div className="mt-0.5 text-sm text-muted">{meta.tagline}</div>
          </div>
        )}
      </div>
    </Screen>
  );
}
