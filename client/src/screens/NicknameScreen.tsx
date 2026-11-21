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
      <div className="mb-10 animate-rise">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-cyan" />
          <span className="h-3 w-3 rounded-full bg-orange" />
          <span className="h-3 w-3 rounded-full bg-red" />
        </div>
        <h1 className="mt-4 text-6xl font-extrabold tracking-tighter">Duel</h1>
        <p className="mt-2 text-muted">1 vs 1. Three rounds. Random topics.</p>
      </div>

      <form onSubmit={submit} className="animate-rise" style={{ animationDelay: '80ms' }}>
        <label htmlFor="nick" className="label mb-2 block">
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
          className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-lg font-medium outline-none transition placeholder:text-muted/50 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
        />
        {error && <p className="mt-3 text-sm font-medium text-red animate-shake">{error}</p>}
        <button type="submit" disabled={busy || nick.trim().length < 3} className="btn btn-primary mt-4 w-full py-4 text-lg">
          {busy ? 'Creating…' : 'Enter'}
        </button>
        <p className="mt-4 text-center text-xs text-muted">No password, no email. Nicknames are unique.</p>
      </form>
    </div>
  );
}
