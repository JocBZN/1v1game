import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, forgetTabIdentity, getToken, type Me } from './lib/api';
import { closeSocket } from './lib/socket';
import { DuelProvider, useDuel } from './state/duel';
import { NicknameScreen } from './screens/NicknameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SearchingScreen } from './screens/SearchingScreen';
import { FoundScreen, IntroScreen } from './screens/IntroScreen';
import { RoundScreen } from './screens/RoundScreen';
import { RoundEndScreen } from './screens/RoundEndScreen';
import { ResultScreen } from './screens/ResultScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';

type Route = 'home' | 'leaderboard' | 'profile';

function routeFromHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('clasament')) return 'leaderboard';
  if (h.startsWith('profil')) return 'profile';
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
    location.hash = r === 'home' ? '/' : r === 'leaderboard' ? '/clasament' : '/profil';
  }, []);
  return [route, go];
}

function Game({ me, refreshMe, onSwitchPlayer }: { me: Me; refreshMe: () => void; onSwitchPlayer: () => void }) {
  const duel = useDuel();
  const { state } = duel;
  const [route, go] = useRoute();

  // Refresh ratings when a duel ends.
  useEffect(() => {
    if (state.phase === 'result') refreshMe();
  }, [state.phase, refreshMe]);

  if (state.replaced) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-5xl">🔁</div>
        <div className="text-xl font-black">Contul e deschis în alt tab</div>
        <p className="text-sm text-muted">Poți juca dintr-un singur loc odată.</p>
        <button className="btn-game mt-2 bg-panel-2 px-6 py-3 text-white" onClick={() => location.reload()}>Joacă aici</button>
      </div>
    );
  }

  switch (state.phase) {
    case 'searching':
      return <SearchingScreen me={me} since={state.searchSince ?? Date.now()} onCancel={duel.cancel} />;
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
          found={state.found}
          result={state.result}
          onAgain={() => duel.play()}
          onLeaderboard={() => {
            duel.reset();
            go('leaderboard');
          }}
          onHome={() => {
            duel.reset();
            go('home');
          }}
        />
      ) : null;
  }

  if (route === 'leaderboard') return <LeaderboardScreen me={me} onBack={() => go('home')} />;
  if (route === 'profile') return <ProfileScreen me={me} onBack={() => go('home')} />;
  return <HomeScreen me={me} connected={state.connected} onPlay={duel.play} onNavigate={go} onSwitchPlayer={onSwitchPlayer} />;
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(() => {
    api.me().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setMe)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) forgetTabIdentity();
      })
      .finally(() => setLoading(false));
  }, []);

  const switchPlayer = useCallback(() => {
    closeSocket();
    forgetTabIdentity();
    setMe(null);
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-muted">Se încarcă…</div>;
  if (!me) return <NicknameScreen onDone={setMe} />;

  return (
    <DuelProvider key={me.user.id}>
      <Game me={me} refreshMe={refreshMe} onSwitchPlayer={switchPlayer} />
    </DuelProvider>
  );
}
