import { useEffect, useState } from 'react';
import type { Me } from '../lib/api';
import { Avatar, Screen } from '../components/ui';

const TIPS = [
  'The server picks the topics. Be ready for anything.',
  'In trivia, answering fast earns bonus points.',
  'In chess puzzles, one wrong move loses the puzzle.',
  'In mental math, a mistake costs little. Don’t hesitate.',
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
      <div className="relative flex h-48 w-48 items-center justify-center">
        <div className="radar-ring absolute inset-0 rounded-full border border-cyan" />
        <div className="radar-ring absolute inset-0 rounded-full border border-orange" style={{ animationDelay: '0.7s' }} />
        <div className="radar-ring absolute inset-0 rounded-full border border-red" style={{ animationDelay: '1.4s' }} />
        <Avatar name={me.user.nickname} size={80} />
      </div>
      <h2 className="mt-8 text-xl font-semibold">Finding an opponent</h2>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-cyan-strong">
        0:{secs.toString().padStart(2, '0')}
      </p>
      <p className="mt-6 max-w-xs text-sm text-muted">{tip}</p>
      <button onClick={onCancel} className="btn btn-secondary mt-10 px-6 py-2.5">
        Cancel
      </button>
    </Screen>
  );
}
