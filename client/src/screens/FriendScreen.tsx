import { useEffect, useState, type FormEvent } from 'react';
import type { RoomError, RoomState } from '../state/duel';
import { track } from '../lib/analytics';
import { Avatar, PageHeader, Screen, TopicIcon } from '../components/ui';
import { DOMAIN_LIST, type DomainId } from '../lib/domains';

const CODE_CHARS = /[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g;

export const ROOM_ERRORS: Record<RoomError, string> = {
  not_found: 'No room with this code. Check it, or ask your friend for a new one.',
  full: 'This room already has two players.',
  busy: 'Finish your current duel first.',
};

export function roomUrl(code: string) {
  return `${location.origin}/c/${code}`;
}

/** Entry point: create a private room or join one with a code. */
export function FriendScreen({ connected, error, onCreate, onJoin, onBack }: {
  connected: boolean;
  error: RoomError | null;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setBusy(false), [error]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) return;
    setBusy(true);
    track('room_join', { via: 'code' });
    onJoin(code);
  };

  return (
    <Screen>
      <PageHeader title="Play with a friend" onBack={onBack} />

      <section className="card mt-5 p-5 animate-rise">
        <h2 className="text-lg font-semibold">Create a room</h2>
        <p className="mt-1 text-sm text-muted">You get a 5-character code and a link. Send it to a friend: the duel starts as soon as they join.</p>
        <button
          disabled={!connected}
          onClick={() => {
            track('room_create');
            onCreate();
          }}
          className="btn btn-primary mt-4 w-full py-4 text-lg"
        >
          Create room
        </button>
      </section>

      <form onSubmit={submit} className="card mt-3 p-5 animate-rise" style={{ animationDelay: '60ms' }}>
        <label htmlFor="room-code" className="text-lg font-semibold">Join with a code</label>
        <input
          id="room-code"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={5}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(CODE_CHARS, '').slice(0, 5))}
          placeholder="K7QX2"
          className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-center font-mono text-3xl font-bold uppercase tracking-[0.4em] outline-none transition placeholder:text-muted/30 focus:border-cyan focus:ring-4 focus:ring-cyan-soft"
        />
        {error && <p className="mt-2 text-sm font-medium text-red animate-shake">{ROOM_ERRORS[error]}</p>}
        <button type="submit" disabled={!connected || code.length !== 5 || busy} className="btn btn-secondary mt-3 w-full py-3.5">
          {busy ? 'Joining…' : 'Join'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">Friend duels don’t change your rating.</p>
    </Screen>
  );
}

/** Lobby: waiting for the friend, or between duels. */
export function RoomScreen({ room, onLeave, onRematch, onGames }: {
  room: RoomState;
  /** Host only: change the games this room plays. */
  onGames: (allowed: DomainId[]) => void;
  onLeave: () => void;
  onRematch: () => void;
}) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const url = roomUrl(room.code);
  const me = room.you === 'host' ? room.host : room.guest!;
  const friend = room.you === 'host' ? room.guest : room.host;
  const shareText = `Duel me on 1v1game! Room code ${room.code}`;

  const copy = async (what: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(what === 'link' ? url : room.code);
      setCopied(what);
      track('room_share', { channel: `copy_${what}` });
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked: the code is on screen anyway */
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: '1v1game duel', text: shareText, url });
      track('room_share', { channel: 'native' });
    } catch {
      /* cancelled */
    }
  };

  return (
    <Screen className="pb-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Private room</h1>
        <button onClick={onLeave} className="btn btn-ghost px-3 py-2 text-sm">Leave</button>
      </header>

      <section className="card mt-5 p-5 text-center animate-rise">
        <div className="label">Room code</div>
        <button onClick={() => copy('code')} className="mt-2 font-mono text-5xl font-bold tracking-[0.25em] text-text" title="Copy code">
          {room.code}
        </button>
        <div className="mt-1 h-4 text-xs text-cyan-strong">{copied === 'code' ? 'Code copied' : copied === 'link' ? 'Link copied' : ''}</div>
        <div className="mt-3 truncate rounded-xl bg-sunken px-3 py-2 text-sm text-muted">{url.replace(/^https?:\/\//, '')}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => copy('link')} className="btn btn-secondary py-3">Copy link</button>
          {'share' in navigator ? (
            <button onClick={share} className="btn btn-accent py-3">Share</button>
          ) : (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
              target="_blank"
              rel="noopener"
              onClick={() => track('room_share', { channel: 'whatsapp' })}
              className="btn btn-accent py-3"
            >
              WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="card mt-3 divide-y divide-line animate-rise" style={{ animationDelay: '60ms' }}>
        <Seat name={me.name} tag="you" ready={me.ready} online />
        {friend ? (
          <Seat name={friend.name} ready={friend.ready} online={friend.online} />
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 text-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-line-strong">?</span>
            <span className="flex-1 text-sm">Waiting for your friend…</span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange" />
          </div>
        )}
      </section>

      <RoomGames room={room} onGames={onGames} />

      {room.duels > 0 && friend && (
        <div className="mt-3 text-center text-sm text-muted">
          Room score <span className="font-semibold text-me">{room.score[0]}</span> – <span className="font-semibold text-foe">{room.score[1]}</span>
        </div>
      )}

      <div className="mt-auto pt-6">
        {friend && room.duels > 0 ? (
          <button onClick={onRematch} disabled={me.ready} className="btn btn-primary w-full py-4 text-lg">
            {me.ready ? `Waiting for ${friend.name}…` : friend.ready ? `${friend.name} wants a rematch — Play` : 'Rematch'}
          </button>
        ) : (
          <p className="text-center text-sm text-muted">
            {friend ? 'Starting…' : 'The duel starts automatically when your friend joins.'}
          </p>
        )}
        <p className="mt-3 text-center text-xs text-muted">Friend duels don’t change your rating.</p>
      </div>
    </Screen>
  );
}

function Seat({ name, tag, ready, online }: { name: string; tag?: string; ready: boolean; online: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar name={name} size={36} />
      <span className="min-w-0 flex-1 truncate font-medium">
        {name} {tag && <span className="text-xs font-semibold text-cyan-strong">{tag}</span>}
      </span>
      {!online ? (
        <span className="text-xs text-muted">offline</span>
      ) : ready ? (
        <span className="text-xs font-semibold text-cyan-strong">ready</span>
      ) : null}
    </div>
  );
}

/** Which games this room plays: the host toggles them (at least one stays on), the guest just sees them. */
function RoomGames({ room, onGames }: { room: RoomState; onGames: (allowed: DomainId[]) => void }) {
  const host = room.you === 'host';
  const allowed = new Set(room.allowed);
  const editable = host && !room.inDuel;
  const toggle = (id: DomainId) => {
    const next = DOMAIN_LIST.map((d) => d.id).filter((d) => (d === id ? !allowed.has(d) : allowed.has(d)));
    if (next.length) onGames(next);
  };
  return (
    <section className="card mt-3 p-4 animate-rise" style={{ animationDelay: '90ms' }}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Games in this room</h2>
        <span className="text-xs text-muted">{allowed.size} of {DOMAIN_LIST.length}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {host
          ? allowed.size === 1 ? 'Only one game: all 3 rounds will be this game.' : 'Tap to turn games on or off. Rounds are picked from the games that are on.'
          : 'The room owner picks the games.'}
      </p>
      {host && (
        <div className="mt-2 flex gap-2 text-xs">
          <button type="button" disabled={!editable} onClick={() => onGames(DOMAIN_LIST.map((d) => d.id))} className="chip border border-line">All games</button>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DOMAIN_LIST.map((d) => {
          const on = allowed.has(d.id);
          const last = on && allowed.size === 1;
          return (
            <button
              key={d.id}
              type="button"
              disabled={!editable || last}
              onClick={() => toggle(d.id)}
              aria-pressed={on}
              className={`flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-left text-sm transition disabled:cursor-default ${on ? 'border-teal bg-surface' : 'border-line bg-sunken/60 text-muted'} ${editable && !last ? 'hover:-translate-y-px' : ''}`}
              title={last ? 'At least one game must stay on' : undefined}
            >
              <span className={on ? '' : 'opacity-40 grayscale'}><TopicIcon domain={d.id} size={26} /></span>
              <span className={`min-w-0 flex-1 truncate font-semibold ${on ? '' : 'line-through'}`}>{d.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
