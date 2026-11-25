import { useState } from 'react';
import { needsConsent, setConsent, track } from '../lib/analytics';

/** Minimal cookie banner; only shown when GA4 or Clarity are configured and the player hasn't chosen yet. */
export function ConsentBanner() {
  const [open, setOpen] = useState(needsConsent);
  if (!open) return null;
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    track('consent', { choice: v });
    setOpen(false);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-rise">
      <div className="card mx-auto flex max-w-md flex-col gap-3 p-4">
        <p className="text-sm text-text">
          We use analytics cookies to see what players like and make Duel better. You can play either way.{' '}
          <a href="/privacy" className="text-cyan-strong underline">Privacy</a>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-secondary py-2.5 text-sm" onClick={() => choose('denied')}>Decline</button>
          <button className="btn btn-accent py-2.5 text-sm" onClick={() => choose('granted')}>Accept</button>
        </div>
      </div>
    </div>
  );
}
