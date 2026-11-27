import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import type { Me } from '../lib/api';
import { LEAGUE_META } from '../lib/leagues';
import { Avatar, LeagueIcon } from '../components/ui';
import { FloatingShapes, GameMarquee, MysteryAvatar, SoftPanel, VsBubble } from '../components/Fun';

const TIPS = [
  'The server picks the games. Be ready for anything.',
  'In trivia, harder questions (more stars) are worth more points.',
  'In chess puzzles, one wrong move loses the puzzle.',
  'Split the shape: draw one cut, straight or curved, as close to 50/50 as you can.',
  'Golf: pull back from the ball and let go. Walls bounce.',
  'Timeline: drag the events, oldest at the top.',
  'Opinion: being off by 2× still scores well. Go with your gut.',
  'Win 2 rounds out of 3 to win the duel.',
  'Win streaks move your rating faster.',
  'Rubik’s Cube: you only need one face or a cross, not the whole cube.',
];

export function SearchingScreen({ me, since, onCancel }: { me: Me; since: number; onCancel: () => void }) {
  const [now, setNow] = useState(Date.now());
  const still = useReducedMotion();
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  const tip = TIPS[Math.floor(secs / 4 + since / 1000) % TIPS.length];
  const league = LEAGUE_META[me.league.id];

  return (
    <div className="relative min-h-full w-full">
      <FloatingShapes />
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-6 safe-bottom sm:px-6 lg:max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="label">Ranked duel</div>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight lg:text-5xl">
            Finding an opponent
          </h1>
          <div className="mt-2 font-display text-2xl font-bold tabular-nums text-teal">0:{secs.toString().padStart(2, '0')}</div>
        </motion.div>

        {/* you vs ? */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.05 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <SoftPanel className="flex min-w-0 flex-1 items-center gap-3 lg:p-5">
            <Avatar name={me.user.nickname} src={me.user.avatar} size={48} ring={league.color} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{me.user.nickname}</div>
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: league.color }}>
                <LeagueIcon league={me.league.id} size={12} /> {Math.round(me.ratings.general.rating)}
              </div>
            </div>
          </SoftPanel>
          <div className="relative z-10 shrink-0"><VsBubble size={56} /></div>
          <SoftPanel dark className="flex min-w-0 flex-1 items-center justify-end gap-3 lg:p-5">
            <div className="min-w-0 text-right">
              <div className="text-sm font-bold">Searching</div>
              <div className="text-xs opacity-70">similar rating</div>
            </div>
            <div className="relative">
              {!still && [0, 1].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-cream/60"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
                />
              ))}
              <MysteryAvatar size={48} fast />
            </div>
          </SoftPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="mb-2 text-center text-xs font-semibold text-muted">3 of these are coming up</div>
          <GameMarquee className="-mx-4 sm:-mx-6" />
        </motion.div>

        <div className="mx-auto h-12 w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.p
              key={tip}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start justify-center gap-2 text-center text-sm text-muted"
            >
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-orange-strong" />
              {tip}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.button
          onClick={onCancel}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="mx-auto flex items-center gap-2 rounded-full bg-surface/85 px-6 py-3 text-sm font-semibold shadow-[0_10px_30px_-18px_rgb(70_66_94/0.5)]"
        >
          <X size={16} /> Cancel
        </motion.button>
      </div>
    </div>
  );
}
