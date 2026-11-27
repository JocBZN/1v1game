import { useEffect, useState, type FormEvent } from 'react';
import { Check, CircleDollarSign as Coin, KeyRound, Lock, Pencil, X } from 'lucide-react';
import { api, ApiError, setToken, type IconState, type Me } from '../lib/api';
import { IconAvatar, PROFILE_ICONS, TIER_LABEL, TIER_PRICE, getProfileIcon, type IconTier } from '../lib/icons';
import { updateSocketToken } from '../lib/socket';
import { Avatar } from './ui';

/** Current icon with an edit badge; opens the icon picker. */
export function IconButton({ me, onOpen }: { me: Me; onOpen: () => void }) {
  if (me.user.guest) return <Avatar name={me.user.nickname} icon={me.user.avatar} size={56} />;
  return (
    <button type="button" onClick={onOpen} className="group relative block shrink-0 rounded-full" aria-label="Choose a profile icon" title="Choose an icon">
      <Avatar name={me.user.nickname} icon={me.user.avatar} size={72} />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal text-cream shadow ring-2 ring-[var(--color-bg)] transition group-hover:scale-110">
        <Pencil size={13} strokeWidth={2.4} />
      </span>
    </button>
  );
}

const TIERS: IconTier[] = ['free', 'common', 'rare', 'epic', 'legendary'];

function Coins({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${className}`}>
      <Coin size={14} strokeWidth={2.4} className="text-orange-strong" /> {n.toLocaleString('en')}
    </span>
  );
}

/** Pick a profile icon: free ones and bought ones can be used, the rest cost coins. */
export function IconPicker({ me, onChange, onClose }: { me: Me; onChange: (icon: string | null) => void; onClose: () => void }) {
  const [state, setState] = useState<IconState | null>(null);
  const [chosen, setChosen] = useState<string | null>(me.user.avatar ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.icons().then(setState).catch(() => setError('Couldn’t load the icons.'));
  }, []);

  const owned = new Set(state?.owned ?? []);
  const pick = chosen ? getProfileIcon(chosen) : undefined;
  const canUse = !!pick && owned.has(pick.id);
  const inUse = (me.user.avatar ?? null) === chosen;

  const act = async (fn: () => Promise<IconState>, after?: (s: IconState) => void) => {
    setBusy(true);
    setError(null);
    try {
      const s = await fn();
      setState(s);
      after?.(s);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'not_enough_coins') setError('Not enough coins yet.');
      else setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Choose a profile icon"
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <h2 className="flex-1 font-display text-xl font-bold">Profile icon</h2>
          {state && <Coins n={state.coins} className="rounded-full bg-orange-soft px-3 py-1 text-sm text-orange-strong" />}
          <button type="button" onClick={onClose} className="btn btn-ghost h-9 w-9 p-0" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {!state && !error && <p className="py-10 text-center text-sm text-muted">Loading…</p>}
          {state && TIERS.map((tier) => (
            <section key={tier} className="mt-4">
              <h3 className="label mb-2 flex items-center justify-between">
                <span>{TIER_LABEL[tier]}</span>
                {TIER_PRICE[tier] > 0 && <Coins n={TIER_PRICE[tier]} className="text-xs text-muted" />}
              </h3>
              <div className="grid grid-cols-5 gap-2.5">
                {PROFILE_ICONS.filter((i) => i.tier === tier).map((i) => {
                  const has = owned.has(i.id);
                  const sel = chosen === i.id;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setChosen(i.id)}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl p-1.5 transition ${sel ? 'bg-surface ring-2 ring-teal' : 'hover:bg-surface'}`}
                      title={i.name}
                    >
                      <IconAvatar icon={i} size={48} />
                      {!has && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-muted shadow-sm">
                          <Lock size={11} strokeWidth={2.6} />
                        </span>
                      )}
                      {me.user.avatar === i.id && (
                        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-cream shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-line px-5 py-4 safe-bottom">
          {pick ? (
            <div className="flex items-center gap-3">
              <IconAvatar icon={pick} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{pick.name}</div>
                <div className="text-xs text-muted">{TIER_LABEL[pick.tier]}{canUse ? (pick.price ? ' · owned' : '') : ''}</div>
              </div>
              {canUse ? (
                <button
                  type="button"
                  disabled={busy || inUse}
                  onClick={() => void act(() => api.selectIcon(pick.id), () => onChange(pick.id))}
                  className="btn btn-primary px-5 py-3"
                >
                  {inUse ? 'In use' : 'Use'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || !state || state.coins < pick.price}
                  onClick={() => void act(() => api.buyIcon(pick.id))}
                  className="btn btn-accent px-4 py-3"
                >
                  Buy · <Coins n={pick.price} />
                </button>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">Tap an icon to see it.</p>
          )}
          {pick && !canUse && state && state.coins < pick.price && (
            <p className="mt-2 text-xs text-muted">You have {state.coins} coins. Ways to earn coins are coming soon.</p>
          )}
          {error && <p className="mt-2 text-sm font-medium text-red">{error}</p>}
          {me.user.avatar && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void act(() => api.clearIcon(), () => { setChosen(null); onChange(null); })}
              className="mt-3 w-full text-center text-xs text-muted underline-offset-2 hover:underline"
            >
              Use my letter instead
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

const PASSWORD_ERRORS: Record<string, string> = {
  bad_credentials: 'Your current password is wrong.',
  weak_password: 'The new password needs at least 6 characters.',
  same_password: 'The new password is the same as the old one.',
  not_registered: 'Create an account first.',
  rate_limited: 'Too many tries. Wait a few minutes.',
};

const inputCls =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base font-medium outline-none transition placeholder:text-muted/50 focus:border-cyan focus:ring-4 focus:ring-cyan-soft';

/** Change password: current + new (twice). Other devices are signed out afterwards. */
export function PasswordCard({ onChanged }: { onChanged: (me: Me) => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== again) return setError('The two new passwords don’t match.');
    setBusy(true);
    try {
      const { token, ...m } = await api.changePassword(current, next);
      setToken(token);
      updateSocketToken(token);
      setCurrent('');
      setNext('');
      setAgain('');
      setDone(true);
      setOpen(false);
      onChanged(m);
    } catch (err) {
      setError(PASSWORD_ERRORS[err instanceof ApiError ? err.code : ''] ?? 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="card flex items-center gap-3 px-4 py-3">
        <KeyRound size={18} className="text-muted" />
        <span className="flex-1 text-sm">{done ? 'Password changed. Other devices were signed out.' : 'Password'}</span>
        <button type="button" onClick={() => { setOpen(true); setDone(false); }} className="btn btn-secondary px-3.5 py-2 text-sm">
          Change
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="flex items-center gap-2 font-semibold"><KeyRound size={18} /> Change password</div>
      <input type="password" autoComplete="current-password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
      <input type="password" autoComplete="new-password" placeholder="New password (at least 6 characters)" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
      <input type="password" autoComplete="new-password" placeholder="New password again" value={again} onChange={(e) => setAgain(e.target.value)} className={inputCls} />
      {error && <p className="text-sm font-medium text-red animate-shake">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => { setOpen(false); setError(null); }} className="btn btn-secondary py-3">Cancel</button>
        <button type="submit" disabled={busy || !current || next.length < 6 || !again} className="btn btn-primary py-3">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-xs text-muted">You stay logged in here. Other phones and computers will need the new password.</p>
    </form>
  );
}
