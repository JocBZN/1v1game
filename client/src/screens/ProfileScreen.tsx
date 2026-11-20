import type { Me } from '../lib/api';
import { Screen } from '../components/ui';

export function ProfileScreen({ onBack }: { me: Me; onBack: () => void }) {
  return (
    <Screen>
      <button onClick={onBack} className="self-start text-muted">← Înapoi</button>
      <h1 className="mt-4 text-3xl font-black">Profil</h1>
      <p className="mt-2 text-muted">În curând.</p>
    </Screen>
  );
}
