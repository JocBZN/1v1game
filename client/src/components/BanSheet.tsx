import { useState } from 'react';
import { Ban, X } from 'lucide-react';
import { DOMAIN_LIST, type DomainId } from '../lib/domains';
import { TopicIcon } from './ui';

const KEY = 'duel.ban';
const readBan = (): DomainId | null => {
  try {
    const v = localStorage.getItem(KEY);
    return DOMAIN_LIST.some((d) => d.id === v) ? (v as DomainId) : null;
  } catch {
    return null;
  }
};

/**
 * Opens before every Play: ban one game you don't want in this duel, or play without a ban.
 * The opponent's ban counts too; the last choice is remembered on this device.
 */
export function BanSheet({ onPlay, onClose }: { onPlay: (ban: DomainId | null) => void; onClose: () => void }) {
  const [ban, setBan] = useState<DomainId | null>(readBan);

  const go = (b: DomainId | null) => {
    try {
      if (b) localStorage.setItem(KEY, b);
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode */
    }
    onPlay(b);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Ban a game"
      >
        <header className="flex items-start gap-3 px-5 pb-2 pt-5">
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">Ban a game?</h2>
            <p className="mt-0.5 text-sm text-muted">Optional. Pick one game you don’t want in this duel; your opponent can ban one too.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost h-9 w-9 p-0" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto px-5 py-3">
          {DOMAIN_LIST.map((d) => {
            const on = ban === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setBan(on ? null : d.id)}
                aria-pressed={on}
                className={`relative flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition ${on ? 'border-red bg-red-soft' : 'border-line bg-surface hover:bg-sunken'}`}
              >
                <span className={on ? 'opacity-40 grayscale' : ''}><TopicIcon domain={d.id} size={32} /></span>
                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${on ? 'text-red-strong line-through' : ''}`}>{d.name}</span>
                {on && <Ban size={16} className="shrink-0 text-red" />}
              </button>
            );
          })}
        </div>

        <footer className="grid gap-2 border-t border-line px-5 py-4 safe-bottom">
          <button type="button" onClick={() => go(ban)} className="btn btn-primary py-3.5 text-lg">
            {ban ? `Play without ${DOMAIN_LIST.find((d) => d.id === ban)!.name}` : 'Play'}
          </button>
          {ban && (
            <button type="button" onClick={() => go(null)} className="text-center text-sm text-muted underline-offset-2 hover:underline">
              Play without banning
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
