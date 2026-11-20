import { DOMAINS } from '../lib/domains';
import type { Found, RoundEnd } from '../state/duel';
import { Screen, useAnimatedNumber } from '../components/ui';
import { VsHeader } from './IntroScreen';

export function RoundEndScreen({ found, data }: { found: Found; data: RoundEnd }) {
  const meta = DOMAINS[data.domain];
  const you = useAnimatedNumber(data.you, 700);
  const opp = useAnimatedNumber(data.opponent, 700);
  const title = data.winner === 'you' ? 'Rundă câștigată!' : data.winner === 'opponent' ? 'Rundă pierdută' : 'Egalitate';
  const color = data.winner === 'you' ? 'text-good' : data.winner === 'opponent' ? 'text-bad' : 'text-gold';
  const emoji = data.winner === 'you' ? '🎉' : data.winner === 'opponent' ? '😤' : '🤝';

  return (
    <Screen className="justify-center">
      <VsHeader found={found} roundWins={data.roundWins} />
      <div className="mt-10 rounded-3xl border border-line bg-panel/80 p-6 text-center animate-pop">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
          Runda {data.index + 1} · {meta.emoji} {meta.name}
        </div>
        <div className="mt-3 text-5xl">{emoji}</div>
        <div className={`mt-2 text-3xl font-black ${color}`}>{title}</div>
        <div className="mt-5 flex items-center justify-center gap-6 text-4xl font-black tabular-nums">
          <span className="text-me">{you}</span>
          <span className="text-xl text-muted">–</span>
          <span className="text-foe">{opp}</span>
        </div>
        <div className="mt-5 text-sm text-muted">{data.last ? 'Se calculează rezultatul…' : 'Urmează runda următoare…'}</div>
      </div>
    </Screen>
  );
}
