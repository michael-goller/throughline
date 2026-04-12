import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Lock, AlertCircle, ChevronRight } from 'lucide-react'
import SlideRenderer from '../templates'
import type { SlideConfig } from '../types'
import SlideOverview from './SlideOverview'
import { useSwipe } from '../hooks/useSwipe'

interface ViewerPageProps {
  slug: string
  tokenId: string
}

type ViewerState = 'loading' | 'password' | 'verified' | 'error' | 'expired'

export default function ViewerPage({ slug, tokenId }: ViewerPageProps) {
  const [state, setState] = useState<ViewerState>('loading')
  const [title, setTitle] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [slides, setSlides] = useState<SlideConfig[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showOverview, setShowOverview] = useState(false)
  const [direction, setDirection] = useState(0)

  // Check if we already have a valid session, then try to load the deck
  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    // First get metadata (public)
    try {
      const metaRes = await fetch(`/api/view/${slug}/meta?shareToken=${tokenId}`)
      if (metaRes.ok) {
        const meta = await metaRes.json()
        setTitle(meta.title)
        document.title = meta.title
      } else if (metaRes.status === 410) {
        setState('expired')
        return
      } else if (metaRes.status === 404) {
        setError('This share link is no longer valid.')
        setState('error')
        return
      }
    } catch {
      // Continue anyway
    }

    // Try loading deck with existing cookie
    try {
      const deckRes = await fetch(`/api/view/${slug}/${tokenId}`)
      if (deckRes.ok) {
        const config = await deckRes.json()
        setSlides(config.slides || [])
        setState('verified')
        return
      }
    } catch {
      // No valid session
    }

    setState('password')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/view/${slug}/${tokenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        // Now fetch the deck
        const deckRes = await fetch(`/api/view/${slug}/${tokenId}`)
        if (deckRes.ok) {
          const config = await deckRes.json()
          setSlides(config.slides || [])
          setState('verified')
          return
        }
      }

      const body = await res.json().catch(() => ({}))
      if (res.status === 410) {
        setState('expired')
      } else if (res.status === 401) {
        setError('Incorrect password')
      } else {
        setError(body.error || 'Something went wrong')
      }
    } catch {
      setError('Connection failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h1 className="text-xl font-bold text-text mb-2">Link Expired</h1>
          <p className="text-text-muted">This share link has expired. Ask the presenter for a new link.</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-text mb-2">Not Found</h1>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (state === 'password') {
    return <PasswordPrompt title={title} error={error} password={password} setPassword={setPassword} submitting={submitting} onSubmit={handleSubmit} />
  }

  // Verified — show the presentation
  return <ViewerPresentation slides={slides} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} showOverview={showOverview} setShowOverview={setShowOverview} direction={direction} setDirection={setDirection} />
}

function PasswordPrompt({ title, error, password, setPassword, submitting, onSubmit }: {
  title: string
  error: string
  password: string
  setPassword: (v: string) => void
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-4"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-brand-red" />
          </div>
          {title && <h1 className="text-xl font-bold text-text mb-1">{title}</h1>}
          <p className="text-sm text-text-muted">Enter the password to view this presentation</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-nav-bg border border-white/10 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-all"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={!password || submitting}
            className="w-full py-3 rounded-xl bg-brand-red text-white font-medium hover:bg-brand-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                View Presentation
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted/40 mt-6">Powered by Shine</p>
      </motion.div>
    </div>
  )
}

const slideVariants = {
  enter: (direction: number) => direction === 0
    ? { x: 0, opacity: 1, scale: 1 }
    : { x: direction > 0 ? '100%' : '-60%', opacity: 0, scale: 0.97 },
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => direction === 0
    ? { x: 0, opacity: 1, scale: 1 }
    : { x: direction < 0 ? '60%' : '-60%', opacity: 0, scale: 0.95 },
}

const transition = {
  x: { type: 'spring' as const, stiffness: 500, damping: 38, mass: 0.8 },
  opacity: { duration: 0.15 },
  scale: { type: 'spring' as const, stiffness: 500, damping: 38, mass: 0.8 },
}

function ViewerPresentation({ slides, currentSlide, setCurrentSlide, showOverview, setShowOverview, direction, setDirection }: {
  slides: SlideConfig[]
  currentSlide: number
  setCurrentSlide: (n: number) => void
  showOverview: boolean
  setShowOverview: (v: boolean) => void
  direction: number
  setDirection: (n: number) => void
}) {
  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1)
      setCurrentSlide(currentSlide + 1)
    }
  }, [currentSlide, slides.length])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide(currentSlide - 1)
    }
  }, [currentSlide])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      else if (e.key === 'o' || e.key === 'O') { e.preventDefault(); setShowOverview(!showOverview) }
      else if (e.key === 'Escape') { setShowOverview(false) }
      else if (e.key === 'Home') { setDirection(-1); setCurrentSlide(0) }
      else if (e.key === 'End') { setDirection(1); setCurrentSlide(slides.length - 1) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, showOverview, slides.length])

  // Swipe
  useSwipe({ onSwipeLeft: goNext, onSwipeRight: goPrev })

  const slide = slides[currentSlide]
  if (!slide) return null

  if (showOverview) {
    return (
      <SlideOverview
        slides={slides}
        currentSlide={currentSlide}
        starredSlideIds={[]}
        hiddenSlideIds={[]}
        onSelect={(i: number) => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); setShowOverview(false) }}
        onClose={() => setShowOverview(false)}
      />
    )
  }

  return (
    <div
      className="slide-viewport overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="absolute inset-0"
        >
          <SlideRenderer slide={slide} />
        </motion.div>
      </AnimatePresence>

      {/* Minimal progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-brand-red/60"
          initial={false}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}
