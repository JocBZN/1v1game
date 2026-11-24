import { track } from '../lib/analytics';

/** "Create an account" call to action shown to guests (home, leaderboard, profile, after a duel). */
export function SignupPrompt({ title, text, where, onSignup, onLogin, compact }: {
  title: string;
  text: string;
  where: string;
  onSignup: () => void;
  onLogin?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-3xl border border-cyan bg-cyan-soft/70 ${compact ? 'p-4' : 'p-5'} animate-rise`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan text-base">🔒</span>
        <div className="min-w-0">
          <div className="font-semibold leading-snug">{title}</div>
          <p className="mt-0.5 text-sm text-text/75">{text}</p>
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${onLogin ? 'grid-cols-[1fr_auto]' : ''}`}>
        <button
          className="btn btn-accent py-3"
          onClick={() => {
            track('signup_cta', { where });
            onSignup();
          }}
        >
          Create free account
        </button>
        {onLogin && (
          <button
            className="btn btn-secondary px-4 py-3"
            onClick={() => {
              track('login_cta', { where });
              onLogin();
            }}
          >
            Log in
          </button>
        )}
      </div>
    </div>
  );
}
