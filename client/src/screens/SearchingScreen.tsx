import { useEffect, useState } from 'react';
import type { Me } from '../lib/api';
import { Avatar, Screen } from '../components/ui';

const TIPS = [
  'Domeniile sunt alese de server. Fii gata de orice!',
  'La cultură generală, viteza aduce puncte bonus.',
  'La șah, o mutare greșită pierde puzzle-ul.',
  'La calcul mental, o greșeală costă puțin. Nu ezita!',
  'Câștigi duelul cu 2 runde din 3.',
];

export function SearchingScreen({ me, since, onCancel }: { me: Me; since: number; onCancel: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  const tip = TIPS[Math.floor((since / 1000) % TIPS.length)];

  return (
    <Screen className="items-center justify-center text-center">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div className="radar-ring absolute inset-0 rounded-full border-2 border-me/60" />
        <div className="radar-ring absolute inset-0 rounded-full border-2 border-foe/50" style={{ animationDelay: '0.6s' }} />
        <div className="radar-ring absolute inset-0 rounded-full border-2 border-me/40" style={{ animationDelay: '1.2s' }} />
        <Avatar name={me.user.nickname} size={88} ring="#22d3ee" />
      </div>
      <h2 className="mt-8 text-2xl font-black">Căutăm un adversar…</h2>
      <p className="mt-2 text-4xl font-black tabular-nums text-me">
        0:{secs.toString().padStart(2, '0')}
      </p>
      <p className="mt-6 max-w-xs text-sm text-muted">{tip}</p>
      <button onClick={onCancel} className="mt-10 rounded-2xl border border-line px-6 py-3 font-bold text-muted transition hover:text-white">
        Anulează
      </button>
    </Screen>
  );
}
