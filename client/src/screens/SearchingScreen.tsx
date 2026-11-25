import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
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

const RINGS = ['#00b7cd', '#ff9100', '#df301c'];

export function SearchingScreen({ me, since, onCancel }: { me: Me; since: number; onCancel: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  const tip = TIPS[Math.floor(secs / 4 + since / 1000) % TIPS.length];

  return (
    <Screen className="items-center justify-center text-center">
      <div className="relative flex h-56 w-56 items-center justify-center">
        {RINGS.map((c, i) => (
          <motion.div
            key={c}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: c }}
            initial={{ scale: 0.45, opacity: 0.9 }}
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{ duration: 2.1, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          className="absolute inset-6 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, rgb(0 183 205 / 0.35), transparent 30%)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Avatar name={me.user.nickname} size={88} ring="var(--color-cyan)" />
        </motion.div>
      </div>
      <h2 className="mt-8 text-2xl font-bold tracking-tight">Finding an opponent</h2>
      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums tracking-tight text-cyan-strong">
        0:{secs.toString().padStart(2, '0')}
      </p>
      <div className="mt-7 h-12 max-w-xs">
        <AnimatePresence mode="wait">
          <motion.p
            key={tip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 text-left text-sm text-muted"
          >
            <Lightbulb size={16} strokeWidth={2.4} className="mt-0.5 shrink-0 text-orange-strong" />
            {tip}
          </motion.p>
        </AnimatePresence>
      </div>
      <button onClick={onCancel} className="btn btn-secondary mt-8 px-6 py-2.5">
        <X size={16} strokeWidth={2.6} /> Cancel
      </button>
    </Screen>
  );
}
