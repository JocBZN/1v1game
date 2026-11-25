import { motion } from 'motion/react';
import { Equal, ThumbsDown, Trophy } from 'lucide-react';
import { DOMAINS } from '../lib/domains';
import type { Found, RoundEnd } from '../state/duel';
import { Screen, TopicIcon, useAnimatedNumber } from '../components/ui';
import { VsHeader } from './IntroScreen';

export function RoundEndScreen({ found, data }: { found: Found; data: RoundEnd }) {
  const meta = DOMAINS[data.domain];
  const you = useAnimatedNumber(data.you, 700);
  const opp = useAnimatedNumber(data.opponent, 700);
  const won = data.winner === 'you';
  const lost = data.winner === 'opponent';
  const title = won ? 'Round won' : lost ? 'Round lost' : 'Tie';
  const color = won ? 'text-cyan-strong' : lost ? 'text-red' : 'text-orange-strong';
  const Icon = won ? Trophy : lost ? ThumbsDown : Equal;

  return (
    <Screen className="justify-center">
      <VsHeader found={found} roundWins={data.roundWins} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="card mt-10 p-6 text-center"
      >
        <div className="flex items-center justify-center gap-2">
          <TopicIcon domain={data.domain} size={26} />
          <span className="label">Round {data.index + 1} · {meta.name}</span>
        </div>
        <motion.div
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
          className={`mt-4 flex items-center justify-center gap-2 font-display text-4xl font-extrabold tracking-tight ${color}`}
        >
          <Icon size={30} strokeWidth={2.6} /> {title}
        </motion.div>
        <div className="mt-5 flex items-center justify-center gap-6 font-display text-5xl font-extrabold tabular-nums tracking-tight">
          <span className="text-me">{you}</span>
          <span className="text-xl text-line-strong">–</span>
          <span className="text-foe">{opp}</span>
        </div>
        <div className="mt-5 text-sm font-medium text-muted">{data.last ? 'Calculating the result…' : 'Next round coming up…'}</div>
      </motion.div>
    </Screen>
  );
}
