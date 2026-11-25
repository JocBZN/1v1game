import { motion } from 'motion/react';
import { ArrowRight, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
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
  if (compact) {
    return (
      <button
        onClick={() => {
          track('signup_cta', { where });
          onSignup();
        }}
        className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-left text-sm text-muted transition-colors hover:text-text"
      >
        <LockKeyhole size={14} strokeWidth={2} className="shrink-0" />
        <span className="flex-1">{title}. <span className="font-semibold text-teal">Save your progress</span></span>
        <ArrowRight size={14} strokeWidth={2} className="shrink-0 text-teal" />
      </button>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-soft text-teal">
          <LockKeyhole size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <div className="font-display font-bold leading-snug">{title}</div>
          <p className="mt-0.5 text-sm text-text/75">{text}</p>
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${onLogin ? 'grid-cols-[1fr_auto]' : ''}`}>
        <button
          className="btn btn-primary py-3"
          onClick={() => {
            track('signup_cta', { where });
            onSignup();
          }}
        >
          <UserPlus size={17} strokeWidth={2.5} /> Create free account
        </button>
        {onLogin && (
          <button
            className="btn btn-secondary px-4 py-3"
            onClick={() => {
              track('login_cta', { where });
              onLogin();
            }}
          >
            <LogIn size={16} strokeWidth={2.5} /> Log in
          </button>
        )}
      </div>
    </motion.div>
  );
}
