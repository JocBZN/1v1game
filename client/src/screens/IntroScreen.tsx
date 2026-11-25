import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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

  const m = DOMAINS[domain];
  return (
    <motion.div
      animate={landed ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.35 }}
      className="card relative w-full overflow-hidden transition-[border-color,box-shadow] duration-300"
      style={{
        height: CELL,
        borderColor: landed ? m.base : undefined,
        boxShadow: landed ? `0 0 0 3px ${m.soft}` : undefined,
      }}
    >
      <div
        style={{
          transform: `translateY(${-offset}px)`,
          transition: offset ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.18, 1.02)` : 'none',
        }}
      >
        {strip.map((d, i) => (
          <div key={i} className="flex items-center justify-center gap-4 px-6" style={{ height: CELL }}>
            <TopicIcon domain={d.id} size={58} solid />
            <div className="font-display text-2xl font-bold tracking-tight">{d.name}</div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#fff8e6] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-surface to-transparent" />
    </motion.div>
  );
}

function Fighter({ name, league, side }: { name: string; league: Found['you']['league']; side: 'me' | 'foe' }) {
  return (
    <motion.div
      initial={{ x: side === 'me' ? -60 : 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="flex min-w-0 flex-1 flex-col items-center gap-2"
    >
      <Avatar name={name} size={64} ring={side === 'me' ? 'var(--color-cyan)' : 'var(--color-red)'} />
      <div className="max-w-full truncate font-display text-lg font-bold">{name}</div>
      <LeagueBadge league={league} small />
    </motion.div>
  );
}

export function VsHeader({ found, roundWins }: { found: Found; roundWins: [number, number] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Fighter name={found.you.name} league={found.you.league} side="me" />
      <motion.div
        initial={{ scale: 2.2, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}
        className="flex flex-col items-center"
      >
        <span
          className="rounded-xl px-2.5 py-1 font-display text-sm font-bold tracking-wider text-[#fff8e6]"
          style={{ background: '#46425e' }}
        >
          VS
        </span>
        <div className="mt-2 font-display text-3xl font-bold tabular-nums">
          <span className="text-me">{roundWins[0]}</span>
          <span className="mx-1 text-line-strong">:</span>
          <span className="text-foe">{roundWins[1]}</span>
        </div>
      </motion.div>
      <Fighter name={found.opponent.name} league={found.opponent.league} side="foe" />
    </div>
  );
}

export function FoundScreen({ found }: { found: Found }) {
  return (
    <Screen className="justify-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="text-center font-display text-sm font-bold uppercase tracking-[0.2em] text-cyan-strong"
      >
        Opponent found
      </motion.div>
      <div className="mt-7">
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-display text-xl font-bold" style={{ color: meta.color }}>
              {meta.name}
            </div>
            <div className="mt-0.5 text-sm text-muted">{meta.tagline}</div>
          </motion.div>
        )}
      </div>
    </Screen>
  );
}
