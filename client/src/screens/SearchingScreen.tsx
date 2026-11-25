import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import type { Me } from '../lib/api';
import { Avatar, Screen } from '../components/ui';

const TIPS = [
  'The server picks the topics. Be ready for anything.',
  'In trivia, answering fast earns bonus points.',
  'In chess puzzles, one wrong move loses the puzzle.',
  'Split the shape: one straight cut, as close to 50/50 as you can.',
  'Golf: pull back from the ball and let go. Walls bounce.',
  'Timeline: drag the events, oldest at the top.',
  'Win 2 rounds out of 3 to win the duel.',
  'Rubik’s Cube: you only need one face or a cross, not the whole cube.',
];

const RINGS = ['#15788c', '#15788c'];

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
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: c }}
            initial={{ scale: 0.45, opacity: 0.6 }}
            animate={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
          />
        ))}
        <Avatar name={me.user.nickname} size={88} />
      </div>
      <h2 className="mt-8 text-2xl font-bold tracking-tight">Finding an opponent</h2>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight text-teal">
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
            <Lightbulb size={16} strokeWidth={2.4} className="mt-0.5 shrink-0" />
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
