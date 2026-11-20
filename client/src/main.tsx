import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import flagFontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url';
import App from './App';
import './index.css';

// Windows doesn't render flag emoji; load a bundled (self-hosted) flag font only when needed.
polyfillCountryFlagEmojis('Twemoji Country Flags', flagFontUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
