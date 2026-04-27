import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import ThroughlineCoalBackground from './ThroughlineCoalBackground';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
}

const BG_BASE = '#16141A';
const BG_SURFACE = 'rgba(29, 27, 34, 0.82)';
const TEXT_PRIMARY = '#ECE8E4';
const TEXT_SECONDARY = 'rgba(236, 232, 228, 0.70)';
const TEXT_MUTED = 'rgba(236, 232, 228, 0.45)';
const BORDER_SUBTLE = 'rgba(236, 232, 228, 0.07)';
const ACCENT = '#B91C1C';
const ACCENT_HOVER = '#DC2626';
const INPUT_BG = 'rgba(236, 232, 228, 0.03)';
const INPUT_BORDER = 'rgba(236, 232, 228, 0.09)';

const THREAD_EDGE = `linear-gradient(90deg,
  transparent 0%,
  ${ACCENT} 15%,
  ${ACCENT} 85%,
  transparent 100%)`;

export default function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: INPUT_BG,
    border: `1px solid ${INPUT_BORDER}`,
    color: TEXT_PRIMARY,
    outline: 'none',
  };

  const inputFocusClass = 'focus-within:ring-1';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: BG_BASE,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <ThroughlineCoalBackground />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="w-full max-w-md px-6 relative z-10"
      >
        {/* Thread-mark + wordmark */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5" style={{ color: ACCENT }}>
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M10 5 L10 19.75" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" fill="none" />
              <polygon points="10,19.75 12.25,22 10,24.25 7.75,22" fill="currentColor" />
              <path d="M12.25 22 L26 22" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" fill="none" />
            </svg>
            <span
              className="font-mono lowercase"
              style={{
                color: TEXT_PRIMARY,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: '1.25rem',
                letterSpacing: '-0.01em',
              }}
            >
              throughline
            </span>
          </div>
          <h1
            className="mt-6 text-center"
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: '1.625rem',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Decks as code.
            <br />
            <span style={{ color: ACCENT }}>Argument as craft.</span>
          </h1>
          <p
            className="mt-4 text-center"
            style={{
              color: TEXT_SECONDARY,
              fontSize: '0.875rem',
              lineHeight: 1.55,
            }}
          >
            Your deck is a TypeScript file. Your editor is a conversation.
            Your audience gets a shareable link — no account, no export, no friction.
          </p>
          <p
            className="mt-3 text-center"
            style={{
              color: TEXT_MUTED,
              fontSize: '0.8125rem',
              fontStyle: 'italic',
            }}
          >
            For people whose thinking deserves better than WYSIWYG.
          </p>
        </div>

        {/* Card with thread edge — glass over the coal stack */}
        <div
          className="relative rounded-2xl p-8 overflow-hidden"
          style={{
            backgroundColor: BG_SURFACE,
            border: `1px solid ${BORDER_SUBTLE}`,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: 1,
              background: THREAD_EDGE,
              transformOrigin: 'left center',
            }}
          />

          <h2
            className="font-mono lowercase mb-1"
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
            }}
          >
            {mode === 'login' ? 'sign in' : 'create account'}
          </h2>
          <p
            className="mb-6 text-sm"
            style={{ color: TEXT_SECONDARY }}
          >
            {mode === 'login'
              ? 'Continue to your decks.'
              : 'Start shaping decks with a throughline.'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.18)',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  className="block font-mono lowercase mb-1.5"
                  style={{
                    color: TEXT_MUTED,
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={`w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${inputFocusClass}`}
                  style={{ ...inputStyle, '--tw-ring-color': `${ACCENT}40` } as React.CSSProperties}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label
                className="block font-mono lowercase mb-1.5"
                style={{
                  color: TEXT_MUTED,
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                }}
              >
                email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${inputFocusClass}`}
                style={{ ...inputStyle, '--tw-ring-color': `${ACCENT}40` } as React.CSSProperties}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                className="block font-mono lowercase mb-1.5"
                style={{
                  color: TEXT_MUTED,
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                }}
              >
                password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${inputFocusClass}`}
                style={{ ...inputStyle, '--tw-ring-color': `${ACCENT}40` } as React.CSSProperties}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = ACCENT_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = ACCENT;
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors text-white mt-6"
              style={{
                backgroundColor: ACCENT,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                <LogIn size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {loading
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>
        </div>

        <p
          className="text-center mt-6 text-sm"
          style={{ color: TEXT_SECONDARY }}
        >
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="font-medium underline underline-offset-4 transition-colors"
            style={{ color: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT)}
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
