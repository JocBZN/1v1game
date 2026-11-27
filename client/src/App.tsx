import { useCallback, useEffect, useState } from 'react';
import { prefetchHeavyModes } from './modes/registry';
import { api, ApiError, clearToken, getToken, setToken, type Me } from './lib/api';
import { closeSocket } from './lib/socket';
import { DuelProvider, useDuel } from './state/duel';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SearchingScreen } from './screens/SearchingScreen';
import { FoundScreen, IntroScreen } from './screens/IntroScreen';
import { RoundScreen } from './screens/RoundScreen';
import { RoundEndScreen } from './screens/RoundEndScreen';
import { ResultScreen } from './screens/ResultScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { FriendScreen, RoomScreen } from './screens/FriendScreen';
import { SelectGameScreen } from './screens/SelectGameScreen';
import { IntroSplash, shouldShowIntro } from './components/IntroSplash';
import { ConsentBanner } from './components/ConsentBanner';
import { pageview, track, identifyUser, resetUser } from './lib/analytics';

export type Route = 'home' | 'leaderboard' | 'profile' | 'signup' | 'login' | 'friend' | 'games';

const HASH: Record<Route, string> = { home: '/', leaderboard: '/clasament', profile: '/profil', signup: '/signup', login: '/login', friend: '/friend', games: '/select-game' };

function routeFromHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('clasament')) return 'leaderboard';
  if (h.startsWith('profil')) return 'profile';
  if (h.startsWith('signup')) return 'signup';
  if (h.startsWith('login')) return 'login';
  if (h.startsWith('friend')) return 'friend';
  if (h.startsWith('select-game')) return 'games';
  return 'home';
}

function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(routeFromHash);
  useEffect(() => {
    const on = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((r: Route) => {
    location.hash = HASH[r];
  }, []);
  return [route, go];
}

function Game({ me, refreshMe, onAuthDone, onLogout }: {
  me: Me;
  refreshMe: () => void;
  onAuthDone: (me: Me) => void;
  onLogout: () => void;
}) {
  const duel = useDuel();
  const { state } = duel;
  const [route, go] = useRoute();

  // The homepage text below the app (index.html, #about) is hidden while a duel is on screen.
  useEffect(() => {
    document.body.classList.toggle('in-duel', state.phase !== 'idle');
    return () => document.body.classList.remove('in-duel');
  }, [state.phase]);

  // Fetch the big cube/chess code in the background so those rounds start instantly.
  useEffect(() => prefetchHeavyModes(), []);

  // A room link that didn't work (wrong or full room): show the error on the friend screen.
  useEffect(() => {
    if (duel.roomError && route !== 'friend' && state.phase === 'idle') go('friend');
  }, [duel.roomError, route, state.phase, go]);

  // "Select game" is a link in the footer below the app: bring the app back into view.
  useEffect(() => {
    if (route === 'games') window.scrollTo({ top: 0 });
  }, [route]);

  // Refresh ratings when a duel ends.
  useEffect(() => {
    if (state.phase === 'result') refreshMe();
  }, [state.phase, refreshMe]);

  // Analytics: one virtual page per screen, plus the duel funnel as events.
  const screen = state.phase === 'idle' ? route : state.phase === 'searching' ? 'searching' : state.phase === 'result' ? 'result' : 'duel';
  useEffect(() => {
    pageview(screen === 'home' ? '/' : `/${screen}`, `Duel · ${screen}`);
  }, [screen]);
  useEffect(() => {
    const who = me.user.guest ? 'guest' : 'member';
    if (state.phase === 'searching') track('duel_search', { who });
    if (state.phase === 'found' && state.found) track('duel_found', { opponent: state.found.opponent.async ? 'async' : 'live', who });
    if (state.phase === 'roundEnd' && state.roundEnd) {
      track('round_end', { topic: state.roundEnd.domain, outcome: state.roundEnd.winner === 'you' ? 'won' : state.roundEnd.winner === 'opponent' ? 'lost' : 'tie' });
    }
    if (state.phase === 'result' && state.result) {
      track('duel_end', { result: state.result.result, forfeit: state.result.forfeit ?? 'none', opponent: state.result.opponent.async ? 'async' : 'live', who });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  if (state.replaced) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-xl font-semibold">You’re playing in another tab</div>
        <p className="text-sm text-muted">You can only play from one place at a time.</p>
        <button className="btn btn-primary mt-2 px-6 py-3" onClick={() => location.reload()}>Play here</button>
      </div>
    );
  }

  switch (state.phase) {
    case 'searching':
      return (
        <SearchingScreen
          me={me}
          since={state.searchSince ?? Date.now()}
          onCancel={() => {
            track('search_cancel', { wait_s: Math.round((Date.now() - (state.searchSince ?? Date.now())) / 1000) });
            duel.cancel();
          }}
        />
      );
    case 'found':
      return state.found ? <FoundScreen found={state.found} /> : null;
    case 'intro':
      return state.found && state.domain ? (
        <IntroScreen found={state.found} index={state.roundIndex} domain={state.domain} roundWins={state.roundWins} />
      ) : null;
    case 'playing':
      return <RoundScreen />;
    case 'roundEnd':
      return state.found && state.roundEnd ? <RoundEndScreen found={state.found} data={state.roundEnd} /> : null;
    case 'result':
      return state.result ? (
        <ResultScreen
          me={me}
          found={state.found}
          result={state.result}
          room={state.result.friendly ? duel.room : null}
          onAgain={() => {
            track('result_action', { action: 'again', result: state.result!.result });
            if (state.result!.practice) return duel.practice(state.result!.practice);
            return state.result!.friendly && duel.room ? duel.rematch() : duel.play();
          }}
          onLeaderboard={() => {
            track('result_action', { action: 'leaderboard', result: state.result!.result });
            duel.reset();
            go('leaderboard');
          }}
          onHome={() => {
            track('result_action', { action: 'home', result: state.result!.result });
            if (state.result!.friendly && !state.result!.practice) duel.leaveRoom();
            duel.reset();
            go('home');
          }}
          onSignup={() => {
            duel.reset();
            go('signup');
          }}
        />
      ) : null;
  }

  if (duel.room && (route === 'home' || route === 'friend')) {
    return (
      <RoomScreen
        room={duel.room}
        onRematch={duel.rematch}
        onLeave={() => {
          duel.leaveRoom();
          go('home');
        }}
      />
    );
  }
  if (route === 'games') {
    return (
      <SelectGameScreen
        connected={state.connected}
        onPick={(d) => {
          track('practice_start', { topic: d });
          duel.practice(d);
        }}
        onBack={() => go('home')}
      />
    );
  }
  if (duel.joining) return <div className="flex h-full items-center justify-center text-muted">Joining the room…</div>;
  if (route === 'friend') {
    return (
      <FriendScreen
        connected={state.connected}
        error={duel.roomError}
        onCreate={duel.createRoom}
        onJoin={duel.joinRoom}
        onBack={() => {
          duel.clearRoomError();
          go('home');
        }}
      />
    );
  }

  const toSignup = () => go('signup');
  const toLogin = () => go('login');
  if (route === 'signup' || route === 'login') {
    return (
      <AuthScreen
        mode={route}
        me={me}
        onBack={() => history.length > 1 ? history.back() : go('home')}
        onSwitch={(m) => go(m)}
        onDone={(m, how) => {
          track(how === 'login' ? 'login' : 'sign_up', { method: how });
          onAuthDone(m);
          go('home');
        }}
      />
    );
  }
  if (route === 'leaderboard') return <LeaderboardScreen me={me} onBack={() => go('home')} onSignup={toSignup} onLogin={toLogin} />;
  if (route === 'profile') return <ProfileScreen me={me} onBack={() => go('home')} onSignup={toSignup} onLogin={toLogin} onLogout={onLogout} onMeChange={onAuthDone} />;
  return <HomeScreen me={me} connected={state.connected} onPlay={duel.play} onNavigate={go} />;
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);
  // First-visit splash (overlays the app while it loads).
  const [intro, setIntro] = useState(shouldShowIntro);

  const refreshMe = useCallback(() => {
    api.me().then(setMe).catch(() => {});
  }, []);

  // Analytics: browser events belong to the same person as the server's game events.
  useEffect(() => {
    if (me) identifyUser(me.user, { rating: Math.round(me.ratings.general.rating), league: me.league.id, games: me.ratings.general.games });
  }, [me]);

  /** Anyone can play right away: no token → a fresh guest account. */
  const startGuest = useCallback(async () => {
    const { token, ...m } = await api.guest();
    setToken(token);
    setMe(m);
    track('guest_start');
  }, []);

  const boot = useCallback(async () => {
    setFailed(false);
    try {
      if (getToken()) {
        try {
          setMe(await api.me());
          return;
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 401)) throw e;
          clearToken(); // unknown token (e.g. database reset): start over as a guest
        }
      }
      await startGuest();
    } catch {
      track('boot_failed');
      setFailed(true);
    }
  }, [startGuest]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const logout = useCallback(() => {
    track('logout');
    resetUser();
    closeSocket();
    clearToken();
    setMe(null);
    void startGuest().catch(() => setFailed(true));
  }, [startGuest]);

  const content = failed ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-lg font-semibold">Can’t reach the game server right now</div>
      <button className="btn btn-secondary px-6 py-2.5" onClick={() => void boot()}>Try again</button>
      <p className="text-sm text-muted">
        Meanwhile, warm up with the <a className="underline" href="/quiz">free quizzes with answers</a>.
      </p>
    </div>
  ) : !me ? (
    <div className="flex h-full items-center justify-center text-muted">Loading…</div>
  ) : (
    <DuelProvider key={me.user.id}>
      <Game me={me} refreshMe={refreshMe} onAuthDone={setMe} onLogout={logout} />
    </DuelProvider>
  );

  return (
    <>
      {content}
      {intro ? <IntroSplash onDone={() => setIntro(false)} /> : <ConsentBanner />}
    </>
  );
}
