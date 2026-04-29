/**
 * ReportIssueLink — small "Report an issue" affordance + inline overlay.
 *
 * Mounts in viewer chrome, deck dashboard, and presenter view. The trigger
 * styles itself to inherit from its parent (text-color and font come from the
 * surrounding chrome) so it blends into existing footer rows.
 *
 * Submission goes to /api/feedback on the cloud origin and is gated server-side
 * by either a shine_session (board user) or shine_viewer (share-link viewer)
 * cookie. The component does not enforce the gate — if the user isn't gated it
 * simply gets a 401 from the server and we surface a friendly error.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, X, Check } from 'lucide-react'

export type ReportContext = 'viewer' | 'dashboard' | 'presenter' | 'stage' | 'unknown'

export interface ReportIssueContextProvider {
  context: ReportContext
  deckSlug?: string
  slideId?: string
  slideIndex?: number
}

interface ReportIssueLinkProps {
  /** Returns context fields at click time so parent can pass live deck/slide state */
  getContext: () => ReportIssueContextProvider
  /** Visual style: 'inline' blends into the existing chrome row, 'pill' is a free-standing button */
  variant?: 'inline' | 'pill'
  className?: string
}

const MAX_MESSAGE_BYTES = 4_000

function getApiBase(): string {
  const env = (import.meta as { env?: Record<string, string> }).env
  if (env?.VITE_DECK_API_URL) {
    const base = env.VITE_DECK_API_URL
    return base.replace(/\/api\/decks\/?$/, '').replace(/\/$/, '')
  }
  return ''
}

function getIdentityHash(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem('throughline-identity')
    if (!raw) return undefined
    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) | 0
    }
    return Math.abs(hash).toString(36)
  } catch {
    return undefined
  }
}

export default function ReportIssueLink({ getContext, variant = 'inline', className = '' }: ReportIssueLinkProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setError(null)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        e.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [open, submitting, close])

  useEffect(() => {
    if (open && submittedAt === null) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
  }, [open, submittedAt])

  useEffect(() => {
    if (submittedAt === null) return
    const t = window.setTimeout(() => {
      setOpen(false)
      setSubmittedAt(null)
      setMessage('')
      triggerRef.current?.focus()
    }, 2400)
    return () => window.clearTimeout(t)
  }, [submittedAt])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError(null)

    const ctx = getContext()
    const payload = {
      context: ctx.context,
      deckSlug: ctx.deckSlug,
      slideId: ctx.slideId,
      slideIndex: ctx.slideIndex,
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      identityHash: getIdentityHash(),
      message: trimmed,
    }

    try {
      const res = await fetch(`${getApiBase()}/api/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        if (res.status === 401) {
          setError("You'll need to be signed in or have an unlocked deck to file reports.")
        } else if (res.status === 429) {
          setError('Too many reports — try again in a few minutes.')
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data?.error || `Couldn't send (${res.status}).`)
        }
        setSubmitting(false)
        return
      }
      setSubmittedAt(Date.now())
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }, [message, getContext])

  const triggerClass = variant === 'pill'
    ? 'inline-flex items-center gap-1 px-2 py-1 rounded-md bg-nav-bg/70 backdrop-blur-md border border-border text-nav-text/70 hover:text-nav-text text-tiny transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30'
    : 'underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 rounded'

  const bytesUsed = new Blob([message]).size
  const overLimit = bytesUsed > MAX_MESSAGE_BYTES

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`${triggerClass} ${className}`}
        aria-label="Report an issue"
      >
        Report an issue
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => !submitting && close()}
            role="dialog"
            aria-modal="true"
            aria-label="Report an issue"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-xl bg-chrome-card border border-chrome-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {submittedAt !== null ? (
                <div className="p-8 flex flex-col items-center gap-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                    <Check size={24} />
                  </div>
                  <div>
                    <h2 className="font-mono text-chrome-ink text-lg lowercase mb-1">thanks for the report</h2>
                    <p className="text-chrome-ink-secondary text-sm">
                      We'll take a look. Feel free to file another any time.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-chrome-border">
                    <h2 className="font-mono text-chrome-ink text-lg lowercase" style={{ letterSpacing: '-0.01em' }}>
                      report an issue
                    </h2>
                    <button
                      type="button"
                      onClick={close}
                      className="text-chrome-ink-muted hover:text-chrome-ink transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    <p className="text-chrome-ink-secondary text-sm">
                      What went wrong, or what could be better? We capture the deck, slide, and browser info automatically — no need to repeat them.
                    </p>
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe what happened…"
                      rows={5}
                      className="w-full rounded-lg bg-chrome-base border border-chrome-border px-3 py-2 text-chrome-ink placeholder:text-chrome-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 resize-none"
                      maxLength={MAX_MESSAGE_BYTES * 2}
                      disabled={submitting}
                    />
                    <div className="flex items-center justify-between text-tiny">
                      <span className={overLimit ? 'text-red-400' : 'text-chrome-ink-muted/60'}>
                        {bytesUsed} / {MAX_MESSAGE_BYTES} bytes
                      </span>
                      {error && <span className="text-red-400">{error}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-chrome-border bg-chrome-base/40">
                    <button
                      type="button"
                      onClick={close}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-md text-chrome-ink-secondary hover:text-chrome-ink text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !message.trim() || overLimit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
