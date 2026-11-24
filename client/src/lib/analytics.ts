/**
 * Analytics, configured at runtime by the server (window.__DUEL__, from Railway env vars):
 *  - Umami (cookieless, no consent needed): page views + events, if UMAMI_WEBSITE_ID is set.
 *  - Google Analytics 4 and Microsoft Clarity (heatmaps, session replays): loaded only after the
 *    player accepts the cookie banner, if GA4_ID / CLARITY_ID are set.
 * Nothing loads in development (no config there).
 */

interface DuelConfig {
  publicUrl: string;
  ga4: string | null;
  clarity: string | null;
  umami: { src: string; websiteId: string } | null;
}

type W = Window & {
  __DUEL__?: DuelConfig;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  umami?: { track: (nameOrProps?: unknown, data?: Record<string, unknown>) => void };
};
const w = window as W;
const cfg = w.__DUEL__;

const CONSENT_KEY = 'duel.consent';
export type Consent = 'granted' | 'denied';

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

/** True when there is something that needs consent and the player hasn't answered yet. */
export function needsConsent(): boolean {
  return !!(cfg?.ga4 || cfg?.clarity) && getConsent() === null;
}

function addScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
}

let consentLoaded = false;
function loadConsentedTools() {
  if (consentLoaded || !cfg) return;
  consentLoaded = true;
  if (cfg.ga4) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag('js', new Date());
    // Hash routes: we send page views ourselves.
    w.gtag('config', cfg.ga4, { send_page_view: false, anonymize_ip: true });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4)}`);
  }
  if (cfg.clarity) {
    const c = ((...args: unknown[]) => {
      (c.q = c.q || []).push(args);
    }) as NonNullable<W['clarity']>;
    w.clarity = c;
    addScript(`https://www.clarity.ms/tag/${encodeURIComponent(cfg.clarity)}`);
  }
  pageview(currentPath());
}

export function setConsent(v: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* ignore */
  }
  if (v === 'granted') loadConsentedTools();
}

export function initAnalytics() {
  if (!cfg) return;
  if (cfg.umami) addScript(cfg.umami.src, { 'data-website-id': cfg.umami.websiteId, 'data-auto-track': 'false' });
  if (getConsent() === 'granted') loadConsentedTools();
  // Umami loads async: send the first page view once it's there.
  let tries = 0;
  const first = setInterval(() => {
    if (w.umami || ++tries > 40) {
      clearInterval(first);
      if (w.umami) w.umami.track((props: Record<string, unknown>) => ({ ...props, url: currentPath() }));
    }
  }, 250);
}

function currentPath(): string {
  const h = location.hash.replace(/^#/, '') || '/';
  return h.startsWith('/') ? h : `/${h}`;
}

/** Virtual page view (the app uses #hash routes and in-app screens). */
export function pageview(path: string, title?: string) {
  if (!cfg) return;
  const page_title = title ?? document.title;
  w.gtag?.('event', 'page_view', { page_path: path, page_location: `${location.origin}${path}`, page_title });
  w.umami?.track((props: Record<string, unknown>) => ({ ...props, url: path, title: page_title }));
}

/** Product event (sign_up, duel_found, round_end, duel_end, …). */
export function track(name: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  if (!cfg) return;
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null));
  w.gtag?.('event', name, clean);
  w.umami?.track(name, clean);
  w.clarity?.('event', name);
}
