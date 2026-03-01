import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SlideRenderer from './templates'
import slides from '@deck/slides'
import { ThemeToggle, SlideSearch } from './components'
import FeedbackOverlay from './components/FeedbackOverlay'
import PresenterView from './components/PresenterView'
import { useTheme } from './hooks/useTheme'
import { usePresenterSync } from './hooks/usePresenterSync'
// import { useViewerPresence } from './hooks/useViewerPresence'
import './index.css'

// Check if we're in presenter mode
function isPresenterMode(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.has('presenter')
}

// Get deck ID from URL path or use a default
function getDeckId(): string {
  const path = window.location.pathname
  // Extract deck name from path like /deck-name or /deck-name/
  const match = path.match(/\/([^/]+)/)
  return match ? match[1] : 'default-deck'
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.98,
  }),
}

const transition = {
  x: { type: 'tween' as const, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  opacity: { duration: 0.3 },
  scale: { duration: 0.3 },
}

// Generate windowed dots with ellipsis for many slides
function getVisibleDots(current: number, total: number, windowSize: number = 3) {
  if (total <= windowSize * 2 + 1) {
    // Show all dots if not too many
    return Array.from({ length: total }, (_, i) => i)
  }

  const dots: (number | 'ellipsis-start' | 'ellipsis-end')[] = []
  const start = Math.max(0, current - windowSize)
  const end = Math.min(total - 1, current + windowSize)

  // Always show first dot
  if (start > 0) {
    dots.push(0)
    if (start > 1) dots.push('ellipsis-start')
  }

  // Window around current
  for (let i = start; i <= end; i++) {
    if (i !== 0 && i !== total - 1) dots.push(i)
  }

  // Always show last dot
  if (end < total - 1) {
    if (end < total - 2) dots.push('ellipsis-end')
    dots.push(total - 1)
  }

  return dots
}

// Calculate animation delay based on slide type and content
function getAnimationDelay(slide: typeof slides[number]): number {
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
  const deckId = useMemo(() => getDeckId(), [])
  const presenterMode = useMemo(() => isPresenterMode(), [])

  // If in presenter mode, render the presenter view
  if (presenterMode) {
    return <PresenterView slides={slides} deckId={deckId} />
  }

  return <MainPresentation deckId={deckId} />
}

function MainPresentation({ deckId }: { deckId: string }) {
  const [[currentSlide, direction], setSlide] = useState([0, 0])
  const { theme, toggleTheme } = useTheme()
  const [showHelp, setShowHelp] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchInitialQuery, setSearchInitialQuery] = useState('')
  const [feedbackMode, setFeedbackMode] = useState(false)
  const [animationsComplete, setAnimationsComplete] = useState(false)
  const lastKeyTime = useRef(0)
  const lastKey = useRef('')

  // Listen for navigation commands from presenter view
  usePresenterSync(currentSlide, slides.length, {
    onSlideChange: (slide) => {
      const dir = slide > currentSlide ? 1 : -1
      setSlide([slide, dir])
    },
  })

  // Track viewer presence (disabled for now - needs InstantDB rooms setup)
  // useViewerPresence(deckId, false)

  const paginate = useCallback((newDirection: number) => {
    const newSlide = currentSlide + newDirection
    if (newSlide >= 0 && newSlide < slides.length) {
      setSlide([newSlide, newDirection])
    }
  }, [currentSlide])

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return
    if (index === currentSlide) return  // Already on this slide
    const dir = index > currentSlide ? 1 : -1
    setSlide([index, dir])
  }, [currentSlide])

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
  }, [currentSlide])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search handles its own keyboard events
      if (showSearch) {
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
      if (e.key === 'i') {
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
  }, [paginate, goToFirst, goToLast, showHelp, showSearch, feedbackMode])

  const currentSlideConfig = slides[currentSlide]
  const visibleDots = getVisibleDots(currentSlide, slides.length)

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
          transition={transition}
          className="absolute inset-0 flex items-center justify-center"
        >
          <SlideRenderer slide={currentSlideConfig} />
        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay (reactions, comments, questions) */}
      <FeedbackOverlay
        deckId={deckId}
        slideId={currentSlideConfig.id}
        feedbackMode={feedbackMode}
      />

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
        {/* Left Arrow */}
        <motion.button
          initial={{ opacity: 0.3 }}
          animate={{ opacity: currentSlide > 0 ? 0.3 : 0.1 }}
          whileHover={currentSlide > 0 ? { opacity: 1, scale: 1.1 } : {}}
          whileTap={currentSlide > 0 ? { scale: 0.95 } : {}}
          onClick={() => paginate(-1)}
          disabled={currentSlide === 0}
          className="p-2 rounded-full bg-nav-bg text-nav-text transition-colors hover:bg-nav-bg-hover disabled:cursor-not-allowed"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </motion.button>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {visibleDots.map((item, idx) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <span key={item} className="text-text-muted text-sm px-1">
                  ...
                </span>
              )
            }
            const index = item as number
            return (
              <motion.button
                key={idx}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide
                    ? 'bg-brand-red'
                    : 'bg-nav-bg hover:bg-nav-bg-hover'
                }`}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                animate={index === currentSlide ? { scale: 1.2 } : { scale: 1 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            )
          })}
        </div>

        {/* Right Arrow */}
        <motion.button
          initial={{ opacity: 0.3 }}
          animate={{ opacity: currentSlide < slides.length - 1 ? 0.3 : 0.1 }}
          whileHover={currentSlide < slides.length - 1 ? { opacity: 1, scale: 1.1 } : {}}
          whileTap={currentSlide < slides.length - 1 ? { scale: 0.95 } : {}}
          onClick={() => paginate(1)}
          disabled={currentSlide === slides.length - 1}
          className="p-2 rounded-full bg-nav-bg text-nav-text transition-colors hover:bg-nav-bg-hover disabled:cursor-not-allowed"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </motion.button>

        {/* Slide Counter */}
        <div className="text-text-muted text-caption ml-2">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-8 z-10">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <SlideSearch
            slides={slides}
            initialQuery={searchInitialQuery}
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

      {/* Help Overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/90"
            onClick={() => setShowHelp(false)}
          >
            <div className="bg-nav-bg rounded-xl p-8 shadow-2xl max-w-md">
              <h2 className="text-text text-xl font-semibold mb-6">Keyboard Shortcuts</h2>
              <div className="space-y-3 text-text-muted">
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-brand-red">j / k</span>
                  <span>Next / Previous slide</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-brand-red">→ / ←</span>
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
                  <span className="font-mono text-brand-red">?</span>
                  <span>Show this help</span>
                </div>
              </div>
              <p className="text-text-muted/60 text-sm mt-6">Press any key to close</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
