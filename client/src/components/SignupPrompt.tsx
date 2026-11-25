import { motion } from 'motion/react';
import { LockKeyhole, LogIn, UserPlus } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border border-cyan/60 ${compact ? 'p-4' : 'p-5'}`}
      style={{ background: 'linear-gradient(140deg, #dff6f4, #c8ecea)', boxShadow: '0 12px 30px -22px rgb(0 127 143 / 0.8)' }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan text-[#08343b] shadow-[0_3px_0_#00788a]">
          <LockKeyhole size={17} strokeWidth={2.6} />
        </span>
        <div className="min-w-0">
          <div className="font-display font-bold leading-snug">{title}</div>
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
