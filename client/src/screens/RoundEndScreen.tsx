import { DOMAINS } from '../lib/domains';
import type { Found, RoundEnd } from '../state/duel';
import { Screen, useAnimatedNumber } from '../components/ui';
import { VsHeader } from './IntroScreen';

export function RoundEndScreen({ found, data }: { found: Found; data: RoundEnd }) {
  const meta = DOMAINS[data.domain];
  const you = useAnimatedNumber(data.you, 700);
  const opp = useAnimatedNumber(data.opponent, 700);
  const title = data.winner === 'you' ? 'Round won' : data.winner === 'opponent' ? 'Round lost' : 'Tie';
  const color = data.winner === 'you' ? 'text-cyan-strong' : data.winner === 'opponent' ? 'text-red' : 'text-orange-strong';

  return (
    <Screen className="justify-center">
      <VsHeader found={found} roundWins={data.roundWins} />
      <div className="card mt-10 p-6 text-center animate-pop">
        <div className="label">
          Round {data.index + 1} · {meta.name}
        </div>
        <div className={`mt-3 text-3xl font-bold tracking-tight ${color}`}>{title}</div>
        <div className="mt-5 flex items-center justify-center gap-6 text-4xl font-bold tabular-nums tracking-tight">
          <span className="text-me">{you}</span>
          <span className="text-xl text-line-strong">–</span>
          <span className="text-foe">{opp}</span>
        </div>
        <div className="mt-5 text-sm text-muted">{data.last ? 'Calculating the result…' : 'Next round coming up…'}</div>
      </div>
    </Screen>
  );
}
