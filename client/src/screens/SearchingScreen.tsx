import { useEffect, useState } from 'react';
import type { Me } from '../lib/api';
import { Avatar, Screen } from '../components/ui';

const TIPS = [
  'The server picks the topics. Be ready for anything!',
  'In trivia, answering fast earns bonus points.',
  'In chess puzzles, one wrong move loses the puzzle.',
  'In mental math, a mistake costs little. Don’t hesitate!',
  'Win 2 rounds out of 3 to win the duel.',
  'Rubik’s Cube: drag a row to turn it, drag outside the cube to spin it.',
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
        <Avatar name={me.user.nickname} size={88} ring="var(--color-me)" />
      </div>
      <h2 className="mt-8 text-2xl font-black">Finding an opponent…</h2>
      <p className="mt-2 text-4xl font-black tabular-nums text-me">
        0:{secs.toString().padStart(2, '0')}
      </p>
      <p className="mt-6 max-w-xs text-sm text-muted">{tip}</p>
      <button onClick={onCancel} className="mt-10 rounded-2xl border border-line px-6 py-3 font-bold text-muted transition hover:text-white">
        Cancel
      </button>
    </Screen>
  );
}
