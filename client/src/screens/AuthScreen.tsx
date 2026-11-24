import { useState } from 'react';
import { api, ApiError, setToken, type Me } from '../lib/api';
import { PageHeader, Screen } from '../components/ui';

const ERRORS: Record<string, string> = {
  too_short: 'Nickname: at least 3 characters.',
  too_long: 'Nickname: at most 16 characters.',
  invalid_chars: 'Nickname: only letters, digits, "_", "-" and ".".',
  taken: 'That nickname is taken. Try another one.',
  reserved: 'Nicknames can’t start with “Guest”.',
  weak_password: 'Password: at least 6 characters.',
  bad_credentials: 'Wrong nickname or password.',
  rate_limited: 'Too many attempts. Try again in a few minutes.',
};

export type AuthMode = 'signup' | 'login';

const PERKS = ['Appear on the leaderboard', 'Keep your rating and duel history', 'Play on any device'];

export function AuthScreen({ mode, me, onDone, onBack, onSwitch }: {
  mode: AuthMode;
  me: Me | null;
  onDone: (me: Me, how: 'signup' | 'upgrade' | 'login') => void;
  onBack: () => void;
  onSwitch: (mode: AuthMode) => void;
}) {
  const [nick, setNick] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isGuest = !!me?.user.guest;
  const signup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (signup) {
        const { token, upgraded, ...m } = await api.register(nick, pass);
        setToken(token);
        onDone(m, upgraded ? 'upgrade' : 'signup');
      } else {
        const { token, ...m } = await api.login(nick, pass);
        setToken(token);
        onDone(m, 'login');
      }
    } catch (err) {
      setError(err instanceof ApiError ? (ERRORS[err.code] ?? 'Something went wrong. Try again.') : 'The server is not responding.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <PageHeader title={signup ? 'Create account' : 'Log in'} onBack={onBack} />

      <div className="mt-4 grid grid-cols-2 rounded-2xl bg-sunken p-1 text-sm font-semibold">
        {(['signup', 'login'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setError(null);
              onSwitch(m);
            }}
            className={`rounded-xl py-2 transition-colors ${mode === m ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`}
          >
            {m === 'signup' ? 'Create account' : 'Log in'}
          </button>
        ))}
      </div>

      {signup && (
        <div className="card mt-4 p-4 animate-rise">
          <ul className="space-y-1.5 text-sm">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-soft text-[11px] font-bold text-cyan-strong">✓</span>
                {p}
              </li>
            ))}
          </ul>
          {isGuest && (
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              You’re playing as <span className="font-semibold text-text">{me!.user.nickname}</span>. Your rating and duels so far move to your new account.
            </p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label htmlFor="nick" className="label mb-1.5 block">Nickname</label>
          <input
            id="nick"
            autoFocus
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={16}
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="e.g. Lightning_92"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base font-medium outline-none transition placeholder:text-muted/50 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
          />
        </div>
        <div>
          <label htmlFor="pass" className="label mb-1.5 block">Password</label>
          <input
            id="pass"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder={signup ? 'At least 6 characters' : ''}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base font-medium outline-none transition placeholder:text-muted/50 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
          />
        </div>
        {error && <p className="text-sm font-medium text-red animate-shake">{error}</p>}
        <button type="submit" disabled={busy || nick.trim().length < 3 || pass.length < (signup ? 6 : 1)} className="btn btn-primary w-full py-4 text-lg">
          {busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {signup ? 'Already have an account? ' : 'New here? '}
        <button className="font-semibold text-cyan-strong hover:underline" onClick={() => onSwitch(signup ? 'login' : 'signup')}>
          {signup ? 'Log in' : 'Create an account'}
        </button>
      </p>
      {!signup && isGuest && (
        <p className="mt-2 text-center text-xs text-muted">Logging in replaces your guest progress on this device.</p>
      )}
      <p className="mt-auto pt-8 text-center text-xs text-muted">No email needed. Free forever.</p>
    </Screen>
  );
}
