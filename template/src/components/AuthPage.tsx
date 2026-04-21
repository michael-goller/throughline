import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
}

/**
 * Auth page styled to match the Throughline landing page aesthetic:
 * dark bg (#0f0f13), indigo accent, JetBrains Mono headings + Inter body.
 */
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#e8e8ed',
    outline: 'none',
  };

  const inputFocusClass = 'focus-within:ring-1 focus-within:ring-[#6366f1]/50';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: '#0f0f13',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Subtle radial glow behind the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 400,
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md px-6 relative z-10"
      >
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient>
                <linearGradient id="k" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
              </defs>
              <rect x="3" y="4" width="22" height="16" rx="2" fill="url(#s)" opacity="0.9"/>
              <rect x="5" y="6" width="18" height="12" rx="1" fill="#1e1b4b" opacity="0.6"/>
              <rect x="7" y="9" width="10" height="1.5" rx="0.75" fill="white" opacity="0.8"/>
              <rect x="7" y="12" width="7" height="1.2" rx="0.6" fill="white" opacity="0.5"/>
              <rect x="7" y="14.5" width="8" height="1.2" rx="0.6" fill="white" opacity="0.5"/>
              <rect x="12" y="20" width="4" height="2" fill="url(#s)" opacity="0.7"/>
              <rect x="9" y="22" width="10" height="1.5" rx="0.75" fill="url(#s)" opacity="0.6"/>
              <path d="M26 4 L27.2 7.8 L31 9 L27.2 10.2 L26 14 L24.8 10.2 L21 9 L24.8 7.8 Z" fill="url(#k)"/>
              <path d="M22 17 L22.6 18.8 L24.5 19.4 L22.6 20 L22 21.8 L21.4 20 L19.5 19.4 L21.4 18.8 Z" fill="url(#k)" opacity="0.7"/>
            </svg>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", color: '#e8e8ed', letterSpacing: '-0.02em' }}
            >
              Throughline
            </h1>
          </div>
          <p style={{ color: 'rgba(232, 232, 237, 0.5)', fontSize: '0.9rem' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a presenter account'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#16161e',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.15)',
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
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'rgba(232, 232, 237, 0.65)' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={`w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${inputFocusClass}`}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(232, 232, 237, 0.65)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${inputFocusClass}`}
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(232, 232, 237, 0.65)' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${inputFocusClass}`}
                style={inputStyle}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all text-white"
              style={{
                background: loading
                  ? '#4f46e5'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === 'login' ? (
                <LogIn size={18} />
              ) : (
                <UserPlus size={18} />
              )}
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>
        </div>

        <p
          className="text-center mt-6 text-sm"
          style={{ color: 'rgba(232, 232, 237, 0.4)' }}
        >
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="font-medium underline underline-offset-2 transition-colors"
            style={{ color: '#818cf8' }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p
          className="text-center mt-4 text-xs"
          style={{ color: 'rgba(232, 232, 237, 0.25)' }}
        >
          Beautiful decks made simple
        </p>
      </motion.div>
    </div>
  );
}
