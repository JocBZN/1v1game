import { useEffect, useState } from 'react';
import { api, ApiError, forgetTabIdentity, getToken, type Me } from './lib/api';
import { NicknameScreen } from './screens/NicknameScreen';

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex h-full items-center justify-center text-muted">Se încarcă…</div>;
  if (!me) return <NicknameScreen onDone={setMe} />;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-2xl font-black">Salut, {me.user.nickname}!</p>
      <p className="text-muted">
        {me.league.name} · {me.ratings.general.rating}
      </p>
    </div>
  );
}
