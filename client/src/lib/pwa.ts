import { useEffect, useState } from 'react';
import { track } from './analytics';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

/** Service worker (production only) + capture the browser's install prompt. */
export function initPwa() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
    track('app_installed');
  });
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** `install` is set when the browser offers "Add to home screen". */
export function useInstallPrompt(): { canInstall: boolean; install: () => Promise<void> } {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return {
    canInstall: !!deferred,
    install: async () => {
      if (!deferred) return;
      const e = deferred;
      deferred = null;
      track('install_prompt');
      await e.prompt();
      const { outcome } = await e.userChoice;
      track('install_choice', { outcome });
      listeners.forEach((l) => l());
    },
  };
}
