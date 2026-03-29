import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, EyeOff, Sun, Moon, Loader2, AlertCircle, FileQuestion } from 'lucide-react'
import SlideRenderer from './templates'
import staticSlides from '@deck/slides'
import type { SlideConfig } from './types'
import { SlideSearch } from './components'
import SlideOverview from './components/SlideOverview'
import FeedbackOverlay from './components/FeedbackOverlay'
import LaserPointer from './components/LaserPointer'
import PresenterView from './components/PresenterView'
import { useTheme } from './hooks/useTheme'
import { usePresenterSync } from './hooks/usePresenterSync'
import { useSlideState } from './hooks/useSlideState'
import { useDeck } from './hooks/useDeck'
// import { useViewerPresence } from './hooks/useViewerPresence'
import './index.css'

// Check if we're in presenter mode
function isPresenterMode(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.has('presenter')
}

/**
 * Parse the URL to determine deck loading mode.
 *
 * - `/decks/:deckId` → dynamic mode (load from API/JSON at runtime)
 * - anything else     → static mode (use compile-time @deck/slides import)
 */
function parseDeckRoute(): { mode: 'static' | 'dynamic'; deckId: string } {
  const path = window.location.pathname

  // Match /decks/:deckId (with optional trailing slash and presenter query)
  const dynamicMatch = path.match(/^\/decks\/([^/]+)\/?$/)
  if (dynamicMatch) {
    return { mode: 'dynamic', deckId: decodeURIComponent(dynamicMatch[1]) }
  }

  // Static mode: extract deck name from path for identity (starred/hidden state, etc.)
  const match = path.match(/\/([^/]+)/)
  return { mode: 'static', deckId: match ? match[1] : 'default-deck' }
}

const slideVariants = {
  enter: (direction: number) => direction === 0
    ? { x: 0, opacity: 1, scale: 1 }
    : { x: direction > 0 ? '100%' : '-60%', opacity: 0, scale: 0.97 },
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => direction === 0
    ? { x: 0, opacity: 1, scale: 1 }
    : { x: direction < 0 ? '60%' : '-60%', opacity: 0, scale: 0.95 },
}

const transition = {
  x: { type: 'spring' as const, stiffness: 500, damping: 38, mass: 0.8 },
  opacity: { duration: 0.15 },
  scale: { type: 'spring' as const, stiffness: 500, damping: 38, mass: 0.8 },
}


// Calculate animation delay based on slide type and content
function getAnimationDelay(slide: SlideConfig): number {
  const baseDelay = 1000 // Base transition time
  const buffer = 500 // Extra buffer for rendering

  if (slide.type === 'gantt') {
    // Gantt: staggerChildren(0.08) * taskCount + bar animation(0.5s) + generous buffer
    const taskCount = slide.tasks?.length ?? 15
    return baseDelay + (taskCount * 100) + 1000 + buffer
  }

  if (slide.type === 'steps') {
    const stepCount = slide.steps?.length ?? 5
    return baseDelay + (stepCount * 120) + buffer
  }

  if (slide.type === 'timeline') {
    const nodeCount = slide.nodes?.length ?? 5
    return baseDelay + (nodeCount * 120) + buffer
  }

  if (slide.type === 'title' || slide.type === 'title-digital' || slide.type === 'divider') {
    return baseDelay + 800 + buffer
  }

  // Default for other slide types
  return baseDelay + 1000 + buffer
}

function App() {
  const route = useMemo(() => parseDeckRoute(), [])
  const presenterMode = useMemo(() => isPresenterMode(), [])

  if (route.mode === 'dynamic') {
    return <DynamicDeckLoader deckId={route.deckId} presenterMode={presenterMode} />
  }

  // Static mode: use compile-time slides from @deck/slides
  if (presenterMode) {
    return <PresenterView slides={staticSlides} deckId={route.deckId} />
  }

  return <MainPresentation slides={staticSlides} deckId={route.deckId} />
}

/**
 * Dynamic deck loader — fetches deck JSON at runtime and renders once ready.
 */
function DynamicDeckLoader({ deckId, presenterMode }: { deckId: string; presenterMode: boolean }) {
  const { status, slides, deck, error } = useDeck(deckId)

  // Update page title when deck loads
  useEffect(() => {
    if (deck?.title) {
      document.title = deck.title
    }
  }, [deck?.title])

  if (status === 'loading') {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="text-brand-red animate-spin" />
        <p className="text-text-muted text-sm">Loading deck...</p>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-4">
        <FileQuestion size={48} className="text-text-muted" />
        <h1 className="text-text text-xl font-semibold">Deck not found</h1>
        <p className="text-text-muted text-sm max-w-md text-center">
          No deck with ID "<span className="font-mono text-brand-red">{deckId}</span>" exists.
        </p>
        <a href="/" className="mt-4 text-brand-red hover:underline text-sm">
          Go home
        </a>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h1 className="text-text text-xl font-semibold">Failed to load deck</h1>
        <p className="text-text-muted text-sm max-w-md text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red-dark text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (presenterMode) {
    return <PresenterView slides={slides} deckId={deckId} />
  }

  return <MainPresentation slides={slides} deckId={deckId} />
}

function MainPresentation({ slides, deckId }: { slides: SlideConfig[]; deckId: string }) {
  const [[currentSlide, direction], setSlide] = useState([0, 0])
  const { theme, toggleTheme } = useTheme()
  const [showHelp, setShowHelp] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchInitialQuery, setSearchInitialQuery] = useState('')
  const [feedbackMode, setFeedbackMode] = useState(false)
  const [animationsComplete, setAnimationsComplete] = useState(false)
  const [laserActive, setLaserActive] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const [materialize, setMaterialize] = useState(false)
  const overviewSelected = useRef(false)
  const [toast, setToast] = useState<{ message: string; icon: 'star' | 'hide' } | null>(null)
  const lastKeyTime = useRef(0)
  const lastKey = useRef('')

  // Slide state (starred/hidden)
  const {
    isStarred,
    isHidden,
    toggleStar,
    toggleHidden,
    starredSlideIds,
    hiddenSlideIds,
  } = useSlideState(deckId)

  // Listen for navigation commands from presenter view
  usePresenterSync(currentSlide, slides.length, {
    onSlideChange: (slide) => {
      const dir = slide > currentSlide ? 1 : -1
      setSlide([slide, dir])
    },
  })

  // Show toast notification
  const showToast = useCallback((message: string, icon: 'star' | 'hide') => {
    setToast({ message, icon })
    setTimeout(() => setToast(null), 1500)
  }, [])

  // Track viewer presence (disabled for now - needs InstantDB rooms setup)
  // useViewerPresence(deckId, false)

  const paginate = useCallback((newDirection: number) => {
    // Find next visible slide in the given direction
    let newSlide = currentSlide + newDirection
    while (newSlide >= 0 && newSlide < slides.length) {
      if (!isHidden(slides[newSlide].id)) {
        setSlide([newSlide, newDirection])
        return
      }
      newSlide += newDirection
    }
  }, [currentSlide, slides, isHidden])

  const goToFirst = useCallback(() => {
    if (currentSlide !== 0) {
      setSlide([0, -1])
    }
  }, [currentSlide])

  const goToLast = useCallback(() => {
    const last = slides.length - 1
    if (currentSlide !== last) {
      setSlide([last, 1])
    }
  }, [currentSlide, slides.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search and overview handle their own keyboard events
      if (showSearch || showOverview) {
        return
      }

      // Feedback mode: only Escape exits
      if (feedbackMode) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setFeedbackMode(false)
        }
        return
      }

      // Close help on any key
      if (showHelp) {
        setShowHelp(false)
        return
      }

      const now = Date.now()

      // Vim-style navigation
      if (e.key === 's') {
        // Toggle star on current slide
        e.preventDefault()
        const slideId = slides[currentSlide].id
        toggleStar(slideId)
        const nowStarred = !isStarred(slideId)
        showToast(nowStarred ? 'Slide starred' : 'Star removed', 'star')
      } else if (e.key === 'h') {
        // Toggle hidden on current slide
        e.preventDefault()
        const slideId = slides[currentSlide].id
        toggleHidden(slideId)
        const nowHidden = !isHidden(slideId)
        showToast(nowHidden ? 'Slide hidden' : 'Slide visible', 'hide')
      } else if (e.key === 'p') {
        e.preventDefault()
        setLaserActive((prev) => !prev)
      } else if (e.key === 'o') {
        e.preventDefault()
        setShowOverview(true)
      } else if (e.key === 'i') {
        // Enter feedback mode (like vim's insert mode)
        e.preventDefault()
        setFeedbackMode(true)
      } else if (e.key === 'j') {
        e.preventDefault()
        paginate(1)
      } else if (e.key === 'k') {
        e.preventDefault()
        paginate(-1)
      } else if (e.key === 'g') {
        e.preventDefault()
        // Check for gg (double g within 500ms)
        if (lastKey.current === 'g' && now - lastKeyTime.current < 500) {
          goToFirst()
          lastKey.current = ''
        } else {
          lastKey.current = 'g'
          lastKeyTime.current = now
        }
      } else if (e.key === 'G') {
        e.preventDefault()
        goToLast()
      } else if (e.key === ':') {
        e.preventDefault()
        setSearchInitialQuery(':')
        setShowSearch(true)
      } else if (e.key === '/') {
        e.preventDefault()
        setSearchInitialQuery('')
        setShowSearch(true)
      } else if (e.key === '?') {
        e.preventDefault()
        setShowHelp(true)
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        paginate(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        paginate(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [paginate, goToFirst, goToLast, showHelp, showSearch, showOverview, feedbackMode, currentSlide, slides, toggleStar, toggleHidden, isStarred, isHidden, showToast])

  const currentSlideConfig = slides[currentSlide]

  // Track animation completion for export
  const animationDelay = useMemo(
    () => getAnimationDelay(currentSlideConfig),
    [currentSlideConfig]
  )

  useEffect(() => {
    setAnimationsComplete(false)
    const timer = setTimeout(() => {
      setAnimationsComplete(true)
    }, animationDelay)
    return () => clearTimeout(timer)
  }, [currentSlide, animationDelay])

  return (
    <div
      className="relative w-full h-full bg-background overflow-hidden"
      data-slide-current={currentSlide + 1}
      data-slide-total={slides.length}
      data-animations-complete={animationsComplete}
    >
      {/* Slide Container */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={direction === 0 ? { duration: 0 } : transition}
          className="absolute inset-0 flex items-center justify-center"
        >
          <SlideRenderer slide={currentSlideConfig} />
        </motion.div>
      </AnimatePresence>

      {/* Pixel-materialize effect after overview zoom-dive */}
      <AnimatePresence>
        {materialize && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => setMaterialize(false)}
            style={{
              backdropFilter: 'blur(14px) brightness(1.08)',
              WebkitBackdropFilter: 'blur(14px) brightness(1.08)',
              backgroundImage: [
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
                'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
              ].join(', '),
            }}
          />
        )}
      </AnimatePresence>

      {/* Feedback Overlay (reactions, comments, questions) */}
      <FeedbackOverlay
        deckId={deckId}
        slideId={currentSlideConfig.id}
        feedbackMode={feedbackMode}
      />

      {/* Laser Pointer */}
      <LaserPointer
        active={laserActive}
        onDeactivate={() => setLaserActive(false)}
      />

      {/* Bottom-left Navigation Pill */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-0 rounded-lg overflow-hidden bg-nav-bg/80 backdrop-blur-md border border-border shadow-lg">
        {/* Progress bar track */}
        <div className="relative h-1 w-full bg-border/50">
          <motion.div
            className="absolute inset-y-0 left-0 right-0 origin-left"
            style={{
              background: 'linear-gradient(90deg, var(--brand-red-tint) 0%, var(--brand-red) 60%, var(--brand-red-dark) 100%)',
              boxShadow: '0 0 8px var(--brand-red)',
            }}
            animate={{ scaleX: currentSlide / Math.max(slides.length - 1, 1) }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          />
        </div>
        {/* Controls row */}
        <div className="flex items-center gap-1 px-1.5 py-1">
          {/* Left Arrow */}
          <motion.button
            animate={{ opacity: currentSlide > 0 ? 0.6 : 0.2 }}
            whileHover={currentSlide > 0 ? { opacity: 1 } : {}}
            whileTap={currentSlide > 0 ? { scale: 0.9 } : {}}
            onClick={() => paginate(-1)}
            disabled={currentSlide === 0}
            className="p-1 rounded text-nav-text disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <ChevronLeft size={14} />
          </motion.button>

          {/* Slide Counter */}
          <div className="text-nav-text text-tiny font-medium px-1.5 flex items-center gap-1 select-none tabular-nums">
            {isStarred(currentSlideConfig.id) && (
              <Star size={10} className="text-yellow-500 fill-current" />
            )}
            {isHidden(currentSlideConfig.id) && (
              <EyeOff size={10} className="text-text-muted" />
            )}
            <span className="inline-flex">
              <span className="inline-block w-[1.1em] text-right">{currentSlide + 1}</span><span className="text-text-muted">/{slides.length}</span>
            </span>
          </div>

          {/* Right Arrow */}
          <motion.button
            animate={{ opacity: currentSlide < slides.length - 1 ? 0.6 : 0.2 }}
            whileHover={currentSlide < slides.length - 1 ? { opacity: 1 } : {}}
            whileTap={currentSlide < slides.length - 1 ? { scale: 0.9 } : {}}
            onClick={() => paginate(1)}
            disabled={currentSlide === slides.length - 1}
            className="p-1 rounded text-nav-text disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <ChevronRight size={14} />
          </motion.button>

          {/* Divider */}
          <div className="w-px h-3.5 bg-border mx-0.5" />

          {/* Theme Toggle */}
          <motion.button
            animate={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-1 rounded text-nav-text"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          </motion.button>
        </div>
      </div>


      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <SlideSearch
            slides={slides}
            initialQuery={searchInitialQuery}
            starredSlideIds={starredSlideIds}
            hiddenSlideIds={hiddenSlideIds}
            onSelect={(index) => {
              // Navigate first, then close
              const targetSlide = index
              const dir = targetSlide > currentSlide ? 1 : (targetSlide < currentSlide ? -1 : 0)
              if (dir !== 0) {
                setSlide([targetSlide, dir])
              }
              setShowSearch(false)
            }}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>

      {/* Slide Overview */}
      <AnimatePresence>
        {showOverview && (
          <SlideOverview
            slides={slides}
            currentSlide={currentSlide}
            starredSlideIds={starredSlideIds}
            hiddenSlideIds={hiddenSlideIds}
            onSelect={(index) => {
              // Direction 0 = instant swap (zoom-dive replaces the transition)
              if (index !== currentSlide) setSlide([index, 0])
              overviewSelected.current = true
            }}
            onClose={() => {
              setShowOverview(false)
              if (overviewSelected.current) {
                overviewSelected.current = false
                setMaterialize(true)
              }
            }}
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
            <div className="bg-background-elevated rounded-xl p-8 shadow-2xl max-w-md border border-border">
              <h2 className="font-display text-text text-xl font-semibold mb-6">Keyboard Shortcuts</h2>
              <div className="space-y-3 text-text-muted">
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
                  <span className="font-mono text-brand-red">s</span>
                  <span>Star / unstar slide</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-brand-red">h</span>
                  <span>Hide / show slide</span>
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
                  <span className="font-mono text-brand-red">p</span>
                  <span>Laser pointer</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-brand-red">?</span>
                  <span>Show this help</span>
                </div>
              </div>
              <p className="text-text-muted/60 text-sm mt-6">Press any key to close</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-nav-bg rounded-lg shadow-lg border border-border"
          >
            {toast.icon === 'star' ? (
              <Star size={16} className="text-yellow-500 fill-current" />
            ) : (
              <EyeOff size={16} className="text-text-muted" />
            )}
            <span className="text-text text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
