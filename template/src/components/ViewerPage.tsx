import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Lock, AlertCircle, ChevronLeft, ChevronRight, Moon, Sun, HelpCircle, MessageSquare, LayoutGrid, Search } from 'lucide-react'
import SlideRenderer from '../templates'
import type { SlideConfig } from '../types'
import SlideOverview from './SlideOverview'
import SlideSearch from './SlideSearch'
import FeedbackOverlay from './FeedbackOverlay'
import OnboardingOverlay from './OnboardingOverlay'
import FollowPresenterIcon from './FollowPresenterIcon'
import RemoteLaserPointer from './RemoteLaserPointer'
import ReportIssueLink from './ReportIssueLink'
import { useSwipe } from '../hooks/useSwipe'
import { useTheme } from '../hooks/useTheme'
import { useIsTouch } from '../hooks/useIsTouch'
import { useOnboarding, type OnboardingContext } from '../hooks/useOnboarding'
import { useFollowPresenter } from '../hooks/useFollowPresenter'
import { isInstantDBConfigured } from '../lib/instantdb'
import { trackDeckOpened, trackSlideViewed } from '../lib/track'

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
  const [feedbackMode, setFeedbackMode] = useState(false)

  // Check if we already have a valid session, then try to load the deck
  useEffect(() => {
    checkSession()
  }, [])

  // Vercel Analytics: deck_opened once verified (after password gate)
  useEffect(() => {
    if (state === 'verified') trackDeckOpened(slug, 'viewer')
  }, [state, slug])

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
          <h1 className="font-mono text-xl font-bold text-text mb-2">Link Expired</h1>
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
          <h1 className="font-mono text-xl font-bold text-text mb-2">Not Found</h1>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (state === 'password') {
    return <PasswordPrompt title={title} error={error} password={password} setPassword={setPassword} submitting={submitting} onSubmit={handleSubmit} />
  }

  // Verified — show the presentation
  return <ViewerPresentation slides={slides} currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} showOverview={showOverview} setShowOverview={setShowOverview} direction={direction} setDirection={setDirection} deckId={slug} feedbackMode={feedbackMode} setFeedbackMode={setFeedbackMode} />
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

        <div className="flex items-center justify-end gap-1.5 mt-6 text-text-muted/40">
          <svg width="11" height="11" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M10 5 L10 19.75" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" fill="none" />
            <polygon points="10,19.75 12.25,22 10,24.25 7.75,22" fill="currentColor" />
            <path d="M12.25 22 L26 22" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" fill="none" />
          </svg>
          <span className="font-mono text-[10px] tracking-wide lowercase">throughline</span>
        </div>
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

function ViewerPresentation({ slides, currentSlide, setCurrentSlide, showOverview, setShowOverview, direction, setDirection, deckId, feedbackMode, setFeedbackMode }: {
  slides: SlideConfig[]
  currentSlide: number
  setCurrentSlide: (n: number) => void
  showOverview: boolean
  setShowOverview: (v: boolean) => void
  direction: number
  setDirection: (n: number) => void
  deckId: string
  feedbackMode: boolean
  setFeedbackMode: (v: boolean) => void
}) {
  const [showHelp, setShowHelp] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchInitialQuery, setSearchInitialQuery] = useState('')
  const lastKeyRef = useRef({ key: '', time: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const isTouch = useIsTouch()
  const { theme, toggleTheme } = useTheme()

  // Viewer cold-land detection: a shared-link visitor who isn't also a
  // presenter on this install sees the onboarding hero on desktop (1→2→4) or
  // a single step-1 + "install on desktop" CTA on mobile. A presenter (i.e.,
  // has a stored `throughline-identity`) is the build persona and skips it.
  const viewerContext = useMemo<OnboardingContext | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      if (window.localStorage.getItem('throughline-identity')) return null
    } catch {
      // ignore storage errors — default to showing the guide
    }
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    return isMobile ? 'viewer-mobile' : 'viewer-desktop'
  }, [])
  const onboarding = useOnboarding({
    context: viewerContext ?? 'viewer-desktop',
    disabled: viewerContext === null,
  })

  // Follow live presenter — when the deck owner toggles "go live", viewers can
  // tap the radio-tower to mirror the presenter's slide cursor in real time.
  const {
    isFollowing,
    presenterLive,
    presenterStale,
    presenterSlide,
    activeSession,
    toggleFollow,
    breakFollow,
  } = useFollowPresenter(deckId, {
    onFollowSlideChange: (slideIndex) => {
      if (slideIndex === currentSlide) return
      setDirection(slideIndex > currentSlide ? 1 : -1)
      setCurrentSlide(slideIndex)
    },
  })

  // Vercel Analytics: slide_viewed on advance
  useEffect(() => {
    const slide = slides[currentSlide]
    if (slide) trackSlideViewed(deckId, slide.id, currentSlide)
  }, [deckId, currentSlide, slides])

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      breakFollow()
      setDirection(1)
      setCurrentSlide(currentSlide + 1)
    }
  }, [currentSlide, slides.length, breakFollow])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      breakFollow()
      setDirection(-1)
      setCurrentSlide(currentSlide - 1)
    }
  }, [currentSlide, breakFollow])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showSearch) return

      // Don't intercept keys while the user is typing in any input (feedback modal, share dialog, etc.)
      const target = e.target as HTMLElement | null
      if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable)) return

      if (showOverview) {
        if (e.key === 'Escape') setShowOverview(false)
        return
      }

      if (showHelp) {
        setShowHelp(false)
        return
      }

      if (feedbackMode) {
        if (e.key === 'Escape') setFeedbackMode(false)
        return
      }

      if (e.key === 'Escape') {
        setShowOverview(false)
        setFeedbackMode(false)
        return
      }

      // Vim navigation
      if (e.key === 'j' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); goNext()
      } else if (e.key === 'k' || e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault(); goPrev()
      } else if (e.key === 'g') {
        const now = Date.now()
        if (lastKeyRef.current.key === 'g' && now - lastKeyRef.current.time < 500) {
          e.preventDefault(); setDirection(-1); setCurrentSlide(0)
        }
      } else if (e.key === 'G') {
        e.preventDefault(); setDirection(1); setCurrentSlide(slides.length - 1)
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault(); setShowOverview(true)
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault(); setFeedbackMode(true)
      } else if (e.key === '/') {
        e.preventDefault(); setSearchInitialQuery(''); setShowSearch(true)
      } else if (e.key === ':') {
        e.preventDefault(); setSearchInitialQuery(':'); setShowSearch(true)
      } else if (e.key === '?') {
        e.preventDefault(); setShowHelp(true)
      } else if (e.key === 'Home') {
        setDirection(-1); setCurrentSlide(0)
      } else if (e.key === 'End') {
        setDirection(1); setCurrentSlide(slides.length - 1)
      }

      lastKeyRef.current = { key: e.key, time: Date.now() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, showOverview, showSearch, showHelp, feedbackMode, slides.length])

  useSwipe({ onSwipeLeft: goNext, onSwipeRight: goPrev, target: viewportRef })

  const anyOverlayOpen = showOverview || showSearch || showHelp || feedbackMode

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
      ref={viewportRef}
      className="slide-viewport overflow-hidden touch-pan-y"
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

      {isInstantDBConfigured && (
        <FeedbackOverlay
          deckId={deckId}
          slideId={slide.id}
          feedbackMode={feedbackMode}
          onExitFeedbackMode={() => setFeedbackMode(false)}
        />
      )}

      {/* Remote laser pointer — mirror of the presenter's cursor when following */}
      {isInstantDBConfigured && (
        <RemoteLaserPointer
          active={isFollowing && !!activeSession?.cursorActive}
          normX={activeSession?.cursorX ?? null}
          normY={activeSession?.cursorY ?? null}
          cursorTs={activeSession?.cursorTs ?? null}
          cursorClickTs={activeSession?.cursorClickTs ?? null}
        />
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <SlideSearch
            slides={slides}
            initialQuery={searchInitialQuery}
            starredSlideIds={[]}
            hiddenSlideIds={[]}
            onSelect={(i: number) => {
              setDirection(i > currentSlide ? 1 : -1)
              setCurrentSlide(i)
              setShowSearch(false)
            }}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>

      {/* Help Overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/95 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="bg-background-elevated rounded-xl p-6 sm:p-8 shadow-2xl max-w-md mx-4 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-text text-xl font-semibold mb-6">{isTouch ? 'Gestures' : 'Keyboard Shortcuts'}</h2>
              <div className="space-y-3 text-text-muted">
                {isTouch ? (
                  <>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Swipe &larr;</span>
                      <span>Next slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Swipe &rarr;</span>
                      <span>Previous slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Tap left edge</span>
                      <span>Previous slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Tap right edge</span>
                      <span>Next slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Comment icon</span>
                      <span>Enter / exit feedback mode</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Tap slide</span>
                      <span>Add reaction (in feedback mode)</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Long-press slide</span>
                      <span>Comment or ask a question</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Grid icon</span>
                      <span>Slide overview</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">Search icon</span>
                      <span>Search / jump to slide</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">j / k</span>
                      <span>Next / Previous slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">&rarr; / &larr;</span>
                      <span>Next / Previous slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">gg</span>
                      <span>First slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">G</span>
                      <span>Last slide</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">/</span>
                      <span>Search / Table of contents</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">:N</span>
                      <span>Jump to slide N</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">i</span>
                      <span>Feedback mode (add reactions)</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">o</span>
                      <span>Slide overview</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="font-mono text-brand-red">?</span>
                      <span>Show this help</span>
                    </div>
                  </>
                )}
                <div className="border-t border-border my-2" />
                <div className="flex items-center justify-between gap-8">
                  <span className="text-sm">Found a bug or have feedback?</span>
                  <ReportIssueLink
                    variant="inline"
                    className="text-sm text-brand-red"
                    getContext={() => {
                      const slide = slides[currentSlide]
                      return {
                        context: 'viewer',
                        deckSlug: deckId,
                        slideId: slide?.id,
                        slideIndex: currentSlide,
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-text-muted/60 text-sm mt-6">{isTouch ? 'Tap outside to close' : 'Press any key to close'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edge tap zones — touch-only, hidden when any overlay is open so they
          don't fight modals or feedback-mode reactions. Sit at z-[5] so the
          nav cluster (z-10) and FeedbackOverlay (z-20) always win. */}
      {isTouch && !anyOverlayOpen && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={currentSlide === 0}
            aria-label="Previous slide (tap left edge)"
            className="absolute left-0 top-0 z-[5] w-[28%] bg-transparent disabled:cursor-not-allowed"
            style={{ bottom: '5rem' }}
          />
          <button
            type="button"
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            aria-label="Next slide (tap right edge)"
            className="absolute right-0 top-0 z-[5] w-[28%] bg-transparent disabled:cursor-not-allowed"
            style={{ bottom: '5rem' }}
          />
        </>
      )}

      {/* Navigation controls — desktop sits bottom-left; touch devices get a
          bottom-center cluster with bigger tap targets and extra buttons for
          the keyboard-only actions (feedback / overview / search). */}
      <div className={`absolute bottom-4 z-10 flex flex-col gap-0 rounded-lg overflow-hidden bg-nav-bg/80 backdrop-blur-md border border-border shadow-lg ${isTouch ? 'left-1/2 -translate-x-1/2' : 'left-4'}`}>
        <div className={`relative w-full bg-border/50 ${isTouch ? 'h-1.5' : 'h-1'}`}>
          <motion.div
            className="absolute inset-y-0 left-0 right-0 origin-left"
            style={{
              background: 'var(--accent-primary)',
              boxShadow: '0 0 8px var(--accent-primary-30)',
            }}
            animate={{ scaleX: currentSlide / Math.max(slides.length - 1, 1) }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          />
        </div>
        <div className={`flex items-center ${isTouch ? 'gap-1.5 px-2 py-1.5' : 'gap-1 px-1.5 py-1'}`}>
          <motion.button
            animate={{ opacity: currentSlide > 0 ? 0.6 : 0.2 }}
            whileHover={currentSlide > 0 ? { opacity: 1 } : {}}
            whileTap={currentSlide > 0 ? { scale: 0.9 } : {}}
            onClick={goPrev}
            disabled={currentSlide === 0}
            className={`rounded text-nav-text disabled:cursor-not-allowed ${isTouch ? 'p-2.5' : 'p-1'}`}
            aria-label="Previous slide"
          >
            <ChevronLeft size={isTouch ? 22 : 14} />
          </motion.button>

          <div className={`text-nav-text font-medium flex items-center gap-1 select-none tabular-nums ${isTouch ? 'text-sm px-2' : 'text-tiny px-1.5'}`}>
            <span className="inline-flex">
              <span className="inline-block w-[1.1em] text-right">{currentSlide + 1}</span><span className="text-text-muted">/{slides.length}</span>
            </span>
          </div>

          <motion.button
            animate={{ opacity: currentSlide < slides.length - 1 ? 0.6 : 0.2 }}
            whileHover={currentSlide < slides.length - 1 ? { opacity: 1 } : {}}
            whileTap={currentSlide < slides.length - 1 ? { scale: 0.9 } : {}}
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className={`rounded text-nav-text disabled:cursor-not-allowed ${isTouch ? 'p-2.5' : 'p-1'}`}
            aria-label="Next slide"
          >
            <ChevronRight size={isTouch ? 22 : 14} />
          </motion.button>

          <div className={`w-px bg-border mx-0.5 ${isTouch ? 'h-6' : 'h-3.5'}`} />

          {/* Follow live presenter — only appears when a presenter is broadcasting */}
          {isInstantDBConfigured && (
            <FollowPresenterIcon
              presenterLive={presenterLive}
              presenterSlide={presenterSlide}
              totalSlides={slides.length}
              isFollowing={isFollowing}
              presenterStale={presenterStale}
              onToggleFollow={toggleFollow}
            />
          )}

          {/* Touch-only: feedback / overview / search buttons surface the
              keyboard-only actions (i / o / /) without requiring a keyboard. */}
          {isTouch && isInstantDBConfigured && (
            <motion.button
              animate={{ opacity: feedbackMode ? 1 : 0.6 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFeedbackMode(!feedbackMode)}
              className={`rounded p-2.5 ${feedbackMode ? 'text-brand-red' : 'text-nav-text'}`}
              aria-label={feedbackMode ? 'Exit feedback mode' : 'Enter feedback mode'}
              aria-pressed={feedbackMode}
            >
              <MessageSquare size={22} />
            </motion.button>
          )}

          {isTouch && (
            <motion.button
              animate={{ opacity: 0.6 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowOverview(true)}
              className="p-2.5 rounded text-nav-text"
              aria-label="Show slide overview"
            >
              <LayoutGrid size={22} />
            </motion.button>
          )}

          {isTouch && (
            <motion.button
              animate={{ opacity: 0.6 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setSearchInitialQuery(''); setShowSearch(true) }}
              className="p-2.5 rounded text-nav-text"
              aria-label="Search slides or jump to slide number"
            >
              <Search size={22} />
            </motion.button>
          )}

          <motion.button
            animate={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`rounded text-nav-text ${isTouch ? 'p-2.5' : 'p-1'}`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Moon size={isTouch ? 22 : 14} /> : <Sun size={isTouch ? 22 : 14} />}
          </motion.button>

          <motion.button
            animate={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowHelp(true)}
            className={`rounded text-nav-text ${isTouch ? 'p-2.5' : 'p-1'}`}
            aria-label={isTouch ? 'Show gestures' : 'Show help and keyboard shortcuts'}
          >
            <HelpCircle size={isTouch ? 22 : 14} />
          </motion.button>
        </div>
      </div>

      {/* Viewer cold-land guide — mounts in the verified state so it never
          fights with the password prompt. The useOnboarding hook gates on
          localStorage flags so it doesn't reopen after the visitor finishes
          or dismisses. */}
      {viewerContext !== null && (
        <OnboardingOverlay controller={onboarding} context={viewerContext} />
      )}
    </div>
  )
}
