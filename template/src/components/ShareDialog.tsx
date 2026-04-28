import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Copy,
  Check,
  Link2,
  Trash2,
  Loader2,
  Shield,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface ShareToken {
  id: string
  shortId: string
  label: string | null
  createdAt: string
  expiresAt: string | null
  viewUrl: string
}

interface ShareDialogProps {
  slug: string
  deckTitle: string
  onClose: () => void
  onShareCountChange?: (count: number) => void
}

type DialogView = 'form' | 'creating' | 'success' | 'error'
type ExpiryPreset = '4h' | '12h' | '24h' | '7d' | '30d' | 'never'

const EXPIRY_OPTIONS: { value: ExpiryPreset; label: string }[] = [
  { value: '4h', label: '4 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'never', label: 'Never' },
]

function expiryToDate(preset: ExpiryPreset): string | null {
  if (preset === 'never') return null
  const ms: Record<ExpiryPreset, number> = {
    '4h': 4 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'never': 0,
  }
  return new Date(Date.now() + ms[preset]).toISOString()
}

const SPECIAL_CHARS = ['!', '@', '#', '$', '%', '&', '*', '?', '+', '=']
const WORDS = [
  'alpha', 'brave', 'coral', 'delta', 'ember', 'frost', 'glyph', 'haven',
  'ivory', 'jewel', 'knack', 'lunar', 'maple', 'noble', 'onyx', 'prism',
  'quartz', 'raven', 'solar', 'tiger', 'ultra', 'vivid', 'waltz', 'xenon',
  'yield', 'zephyr', 'blaze', 'charm', 'drift', 'eagle', 'flame', 'grain',
]

function generatePassphrase(): string {
  const pick = (arr: readonly string[]) => arr[Math.floor(Math.random() * arr.length)]
  const digit = Math.floor(Math.random() * 10)
  const special = pick(SPECIAL_CHARS)
  return `${pick(WORDS)}${digit}${special}${pick(WORDS)}`
}

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function getExpiryStatus(expiresAt: string | null): 'active' | 'expired' | 'never' {
  if (!expiresAt) return 'never'
  return new Date(expiresAt) > new Date() ? 'active' : 'expired'
}

function getApiBase(): string {
  if (import.meta.env.VITE_DECK_API_URL) {
    return import.meta.env.VITE_DECK_API_URL as string
  }
  return '/api/decks'
}

export default function ShareDialog({ slug, deckTitle, onClose, onShareCountChange }: ShareDialogProps) {
  const [view, setView] = useState<DialogView>('form')
  const [shares, setShares] = useState<ShareToken[]>([])
  const [loadingShares, setLoadingShares] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [password, setPassword] = useState(generatePassphrase)
  const [label, setLabel] = useState('')
  const [expiry, setExpiry] = useState<ExpiryPreset>('7d')

  const [createdShare, setCreatedShare] = useState<{ viewUrl: string; password: string } | null>(null)
  const [copied, setCopied] = useState<'message' | 'link' | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const apiBase = getApiBase()

  const onShareCountChangeRef = useRef(onShareCountChange)
  useEffect(() => {
    onShareCountChangeRef.current = onShareCountChange
  }, [onShareCountChange])

  const fetchShares = useCallback(async () => {
    setLoadingShares(true)
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(slug)}/share`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load shares')
      const data: ShareToken[] = await res.json()
      setShares(data)
      onShareCountChangeRef.current?.(data.length)
    } catch {
      // silently fail — shares list is supplementary
    } finally {
      setLoadingShares(false)
    }
  }, [apiBase, slug])

  useEffect(() => {
    fetchShares()
  }, [fetchShares])

  const handleCreate = async () => {
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters')
      return
    }
    setView('creating')
    setErrorMsg('')
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(slug)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          password,
          label: label.trim() || undefined,
          expiresAt: expiryToDate(expiry),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to create share' }))
        throw new Error(data.error || 'Failed to create share')
      }
      const data = await res.json()
      setCreatedShare({ viewUrl: data.viewUrl, password })
      setView('success')
      fetchShares()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create share')
      setView('error')
    }
  }

  const handleRevoke = async (tokenId: string) => {
    setRevoking(tokenId)
    const prev = shares
    setShares(s => s.filter(t => t.id !== tokenId))
    onShareCountChange?.(shares.length - 1)
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(slug)}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenId }),
      })
      if (!res.ok) {
        setShares(prev)
        onShareCountChange?.(prev.length)
      }
    } catch {
      setShares(prev)
      onShareCountChange?.(prev.length)
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    const prev = shares
    setShares([])
    onShareCountChange?.(0)
    try {
      const res = await fetch(`${apiBase}/${encodeURIComponent(slug)}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) {
        setShares(prev)
        onShareCountChange?.(prev.length)
      }
    } catch {
      setShares(prev)
      onShareCountChange?.(prev.length)
    }
  }

  const copyToClipboard = async (text: string, type: 'message' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const inviteMessage = createdShare
    ? `Hey, check out my slide deck:\n${createdShare.viewUrl}\nPassword: ${createdShare.password}`
    : ''

  const resetForm = () => {
    setPassword(generatePassphrase())
    setLabel('')
    setExpiry('7d')
    setErrorMsg('')
    setCreatedShare(null)
    setView('form')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg mx-4 bg-background-elevated rounded-xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-display text-text text-body font-semibold">Share Deck</h2>
            <p className="text-text-muted text-tiny mt-0.5 truncate max-w-[300px]">{deckTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <AnimatePresence mode="wait">
            {/* Success View */}
            {view === 'success' && createdShare && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-accent-green">
                  <Check size={20} />
                  <span className="font-semibold text-body-sm">Share link created!</span>
                </div>

                <div className="space-y-3 p-4 bg-background-accent rounded-lg border border-border">
                  <div>
                    <p className="text-tiny text-text-muted mb-1">Link</p>
                    <p className="text-caption text-text font-mono break-all">{createdShare.viewUrl}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-text-muted mb-1">Password</p>
                    <p className="text-caption text-text font-mono">{createdShare.password}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-accent-orange/10 rounded-lg border border-accent-orange/20">
                  <Shield size={14} className="text-accent-orange mt-0.5 flex-shrink-0" />
                  <p className="text-tiny text-text-muted">
                    Save the password now — it cannot be retrieved later.
                  </p>
                </div>

                <div className="p-4 bg-background-accent rounded-lg border border-border">
                  <p className="text-tiny text-text-muted mb-2">Copy-ready message</p>
                  <pre className="text-caption text-text whitespace-pre-wrap font-sans leading-relaxed">{inviteMessage}</pre>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => copyToClipboard(inviteMessage, 'message')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-accent-primary text-white rounded-lg text-caption font-semibold hover:bg-accent-primary-hover transition-colors"
                  >
                    {copied === 'message' ? <Check size={14} /> : <Copy size={14} />}
                    {copied === 'message' ? 'Copied!' : 'Copy Message'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => copyToClipboard(createdShare.viewUrl, 'link')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-caption font-semibold text-text hover:bg-nav-bg transition-colors"
                  >
                    {copied === 'link' ? <Check size={14} /> : <Link2 size={14} />}
                    {copied === 'link' ? 'Copied!' : 'Link Only'}
                  </motion.button>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full text-center text-caption text-text-muted hover:text-text transition-colors py-1"
                >
                  Create another share
                </button>
              </motion.div>
            )}

            {/* Form / Error View */}
            {(view === 'form' || view === 'creating' || view === 'error') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Create section */}
                <div className="space-y-3">
                  <h3 className="text-caption font-semibold text-text">Create New Share</h3>

                  {/* Password */}
                  <div>
                    <label className="block text-tiny text-text-muted mb-1">Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="flex-1 px-3 py-2 rounded-lg bg-background-accent border border-border text-text text-caption placeholder:text-text-muted/60 focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-border-accent transition-colors font-mono"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPassword(generatePassphrase())}
                        className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
                        title="Generate passphrase"
                      >
                        <RefreshCw size={14} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-tiny text-text-muted mb-1">Label <span className="text-text-muted/50">(optional)</span></label>
                    <input
                      type="text"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      placeholder='e.g. "For Sarah", "Client review"'
                      className="w-full px-3 py-2 rounded-lg bg-background-accent border border-border text-text text-caption placeholder:text-text-muted/60 focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-border-accent transition-colors"
                    />
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-tiny text-text-muted mb-1">Expires</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EXPIRY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setExpiry(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-tiny font-medium transition-colors ${
                            expiry === opt.value
                              ? 'bg-accent-primary text-white'
                              : 'bg-background-accent border border-border text-text-muted hover:text-text hover:bg-nav-bg'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                      <p className="text-tiny text-red-400">{errorMsg}</p>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={view === 'creating' || password.length < 8}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary text-white rounded-lg text-caption font-semibold hover:bg-accent-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {view === 'creating' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create Share'
                    )}
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Active shares section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-caption font-semibold text-text">
                      Active Shares
                      {shares.length > 0 && (
                        <span className="ml-1.5 text-text-muted font-normal">({shares.length})</span>
                      )}
                    </h3>
                    {shares.length > 1 && (
                      <button
                        onClick={handleRevokeAll}
                        className="text-tiny text-red-400 hover:text-red-300 transition-colors"
                      >
                        Revoke all
                      </button>
                    )}
                  </div>

                  {loadingShares ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={18} className="text-text-muted animate-spin" />
                    </div>
                  ) : shares.length === 0 ? (
                    <p className="text-tiny text-text-muted/60 py-4 text-center">
                      No shares yet. Create one above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {shares.map(token => {
                        const status = getExpiryStatus(token.expiresAt)
                        return (
                          <motion.div
                            key={token.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 p-3 bg-background-accent rounded-lg border border-border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-caption text-text font-medium truncate">
                                {token.label || 'Untitled'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-tiny text-text-muted">
                                  {formatRelativeDate(token.createdAt)}
                                </span>
                                <span className="text-text-muted/30">·</span>
                                <span className={`flex items-center gap-1 text-tiny ${
                                  status === 'expired' ? 'text-red-400' :
                                  status === 'never' ? 'text-text-muted' :
                                  'text-accent-green'
                                }`}>
                                  <Clock size={10} />
                                  {status === 'expired' ? 'Expired' :
                                   status === 'never' ? 'No expiry' :
                                   `Expires ${formatRelativeDate(token.expiresAt!)}`}
                                </span>
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => copyToClipboard(token.viewUrl, 'link')}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
                              title="Copy link"
                            >
                              <Link2 size={14} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRevoke(token.id)}
                              disabled={revoking === token.id}
                              className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Revoke share"
                            >
                              {revoking === token.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </motion.button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
