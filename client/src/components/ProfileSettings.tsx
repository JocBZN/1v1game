import { useRef, useState, type FormEvent } from 'react';
import { Camera, KeyRound, Trash2 } from 'lucide-react';
import { api, ApiError, setToken, type Me } from '../lib/api';
import { updateSocketToken } from '../lib/socket';
import { Avatar } from './ui';

const PHOTO_SIZE = 256;

/** Center-crop to a square and shrink to 256×256 (WebP, or JPEG where WebP can't be encoded). */
async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  bitmap.close?.();
  const encode = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  const webp = await encode('image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await encode('image/jpeg', 0.88);
  if (!jpeg) throw new Error('encode');
  return jpeg;
}

/** Big profile photo: tap to change it (registered accounts), with a small remove button. */
export function PhotoPicker({ me, onChange }: { me: Me; onChange: (avatar: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = !me.user.guest;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) return setError('Pick an image file.');
    setBusy(true);
    try {
      const photo = await preparePhoto(file);
      const r = await api.uploadAvatar(photo);
      onChange(r.avatar);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 413 ? 'That photo is too big.' : 'Couldn’t use that photo. Try another one.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteAvatar();
      onChange(null);
    } catch {
      setError('Couldn’t remove the photo.');
    } finally {
      setBusy(false);
    }
  };

  if (!editable) return <Avatar name={me.user.nickname} src={me.user.avatar} size={56} />;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="group relative block rounded-full"
        aria-label={me.user.avatar ? 'Change profile photo' : 'Add a profile photo'}
        title={me.user.avatar ? 'Change photo' : 'Add a photo'}
      >
        <Avatar name={me.user.nickname} src={me.user.avatar} size={72} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-teal text-cream shadow ring-2 ring-[var(--color-bg)] transition group-hover:scale-110">
          {busy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cream/40 border-t-cream" /> : <Camera size={14} strokeWidth={2.4} />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      {me.user.avatar && !busy && (
        <button
          type="button"
          onClick={() => void remove()}
          className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-muted shadow ring-1 ring-line hover:text-red"
          aria-label="Remove photo"
          title="Remove photo"
        >
          <Trash2 size={12} strokeWidth={2.4} />
        </button>
      )}
      {error && <p className="absolute left-0 top-full mt-1 w-56 text-xs font-medium text-red">{error}</p>}
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
