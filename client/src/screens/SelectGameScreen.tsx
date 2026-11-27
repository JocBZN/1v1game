import { DOMAIN_LIST, type DomainId } from '../lib/domains';
import { PageHeader, Screen, TopicIcon } from '../components/ui';

/** "Select game": play any single game against a bot, exactly like a duel, without rating changes. */
export function SelectGameScreen({ connected, onPick, onBack }: {
  connected: boolean;
  onPick: (domain: DomainId) => void;
  onBack: () => void;
}) {
  return (
    <Screen className="pb-6">
      <PageHeader title="Select game" onBack={onBack} />
      <p className="mt-2 text-sm text-muted">Pick a game and play a full duel against a bot. Every round is the game you chose. Your rating doesn’t change.</p>

      <div className="mt-5 grid gap-2.5">
        {DOMAIN_LIST.map((d) => (
          <button
            key={d.id}
            disabled={!connected}
            onClick={() => onPick(d.id)}
            className="card flex items-center gap-3 px-4 py-3 text-left transition hover:-translate-y-px disabled:opacity-50"
          >
            <TopicIcon domain={d.id} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold" style={{ color: d.color }}>{d.name}</span>
              <span className="block truncate text-xs text-muted">{d.tagline}</span>
            </span>
            <span aria-hidden className="text-lg text-muted">→</span>
          </button>
        ))}
      </div>
      {!connected && <p className="mt-4 text-center text-sm text-muted">Connecting…</p>}
    </Screen>
  );
}
