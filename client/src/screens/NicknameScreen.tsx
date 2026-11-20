import { useState } from 'react';
import { api, ApiError, setToken, type Me } from '../lib/api';

const ERRORS: Record<string, string> = {
  too_short: 'At least 3 characters.',
  too_long: 'At most 16 characters.',
  invalid_chars: 'Only letters, digits, "_", "-" and ".".',
  taken: 'That nickname is taken. Try another one.',
};

export function NicknameScreen({ onDone }: { onDone: (me: Me) => void }) {
  const [nick, setNick] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { token, ...me } = await api.register(nick);
      setToken(token);
      onDone(me);
    } catch (err) {
      setError(err instanceof ApiError ? (ERRORS[err.code] ?? 'Something went wrong. Try again.') : 'The server is not responding.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-10 text-center animate-rise">
        <div className="mb-3 text-7xl animate-float">⚔️</div>
        <h1 className="text-5xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-fire-1 via-fire-2 to-fire-3 bg-clip-text text-transparent">DUEL</span>
        </h1>
        <p className="mt-3 text-muted">1 vs 1. Three rounds. Random topics.</p>
      </div>

      <form onSubmit={submit} className="rounded-3xl border border-line bg-panel/80 p-6 shadow-2xl animate-rise" style={{ animationDelay: '80ms' }}>
        <label htmlFor="nick" className="mb-2 block text-sm font-bold uppercase tracking-widest text-muted">
          Pick a nickname
        </label>
        <input
          id="nick"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={16}
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="e.g. Lightning_92"
          className="w-full rounded-2xl border-2 border-line bg-ink-2 px-4 py-4 text-xl font-bold outline-none transition focus:border-fire-2"
        />
        {error && <p className="mt-3 text-sm font-semibold text-bad animate-shake">{error}</p>}
        <button
          type="submit"
          disabled={busy || nick.trim().length < 3}
          className="btn-game mt-5 w-full bg-gradient-to-r from-fire-1 via-fire-2 to-fire-3 py-4 text-xl text-ink disabled:opacity-40"
        >
          {busy ? 'Creating…' : 'Enter the arena'}
        </button>
        <p className="mt-4 text-center text-xs text-muted">No password, no email. Nicknames are unique.</p>
      </form>
    </div>
  );
}
