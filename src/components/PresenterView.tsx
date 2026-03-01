/**
 * PresenterView - Admin dashboard for presenting with live feedback
 *
 * Features:
 * - Current and next slide preview (actual thumbnails)
 * - Live feed of reactions, comments, questions
 * - Answer questions inline
 * - Navigation controls
 * - Admin actions (resolve, clear)
 * - Timer
 * - Viewer count
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  HelpCircle,
  Trash2,
  Check,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Users,
  Send,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useReactions } from '../hooks/useReactions'
import { useComments } from '../hooks/useComments'
import { usePresenterSync } from '../hooks/usePresenterSync'
import { useTheme } from '../hooks/useTheme'
import { useIdentity } from '../hooks/useIdentity'
// import { useViewerPresence } from '../hooks/useViewerPresence'
import SlideThumbnail from './SlideThumbnail'
import SlideSearch from './SlideSearch'
import type { SlideConfig } from '../types'
import type { Comment } from '../lib/instantdb'

interface PresenterViewProps {
  slides: SlideConfig[]
  deckId: string
  initialSlide?: number
}

// Simple slide title extraction
function getSlideTitle(slide: SlideConfig): string {
  if ('title' in slide && slide.title) return slide.title
  if (slide.type === 'qa') return 'Q&A'
  return slide.type
}

export default function PresenterView({ slides, deckId, initialSlide = 0 }: PresenterViewProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchInitialQuery, setSearchInitialQuery] = useState('')

  const currentSlideConfig = slides[currentSlide]
  const nextSlideConfig = slides[currentSlide + 1]

  // Feedback hooks
  const { reactions } = useReactions(deckId)
  const { comments, questions, addReply, resolveItem, deleteItem, clearSlide, clearAll } = useComments(deckId)
  const { identity } = useIdentity()

  // Viewer presence (disabled for now - needs InstantDB rooms setup)
  // const { viewerCount } = useViewerPresence(deckId, true)
  const viewerCount = 0 // placeholder

  // Theme
  const { theme, toggleTheme } = useTheme()

  // Presenter sync
  const { goToSlide: syncGoToSlide, requestSync } = usePresenterSync(
    currentSlide,
    slides.length,
    {
      onSlideChange: setCurrentSlide,
      onSyncResponse: (slide) => setCurrentSlide(slide),
    }
  )

  // Request sync on mount
  useEffect(() => {
    requestSync()
  }, [requestSync])

  // Timer
  useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Navigation
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index)
      syncGoToSlide(index)
    }
  }, [slides.length, syncGoToSlide])

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide])
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search handles its own keyboard events
      if (showSearch) return

      // Don't navigate if typing in reply field
      if (replyingTo) return

      if (e.key === '/') {
        e.preventDefault()
        setSearchInitialQuery('')
        setShowSearch(true)
      } else if (e.key === ':') {
        e.preventDefault()
        setSearchInitialQuery(':')
        setShowSearch(true)
      } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault()
        prevSlide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, replyingTo, showSearch])

  // Handle reply submission
  const handleReplySubmit = useCallback(() => {
    if (replyingTo && replyText.trim() && identity) {
      addReply(replyingTo, replyText.trim(), identity)
      setReplyingTo(null)
      setReplyText('')
    }
  }, [replyingTo, replyText, identity, addReply])

  // Combine and sort all feedback by timestamp
  const allFeedback = useMemo(() => {
    const items = [
      ...reactions.map((r) => ({ ...r, feedbackType: 'reaction' as const })),
      ...comments.map((c) => ({ ...c, feedbackType: 'comment' as const })),
      ...questions.map((q) => ({ ...q, feedbackType: 'question' as const })),
    ]
    return items.sort((a, b) => b.timestamp - a.timestamp)
  }, [reactions, comments, questions])

  // Current slide feedback
  const currentSlideFeedback = useMemo(() => {
    return allFeedback.filter((f) => f.slideId === currentSlideConfig.id)
  }, [allFeedback, currentSlideConfig.id])

  // Stats
  const unresolvedQuestions = questions.filter((q) => !q.resolved).length

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Presenter View</h1>
          <span className="text-gray-400">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          <span className="font-mono text-xl">{formatTime(timerSeconds)}</span>
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {timerRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => { setTimerSeconds(0); setTimerRunning(false) }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Stats & Controls */}
        <div className="flex items-center gap-4">
          {viewerCount > 0 && (
            <span className="flex items-center gap-1.5 text-gray-300">
              <Users size={16} />
              {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
            </span>
          )}
          {unresolvedQuestions > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <HelpCircle size={16} />
              {unresolvedQuestions} unresolved
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm transition-colors"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Slide previews */}
        <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
          {/* Current slide */}
          <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-gray-400">Current Slide</span>
              <span className="text-sm font-medium truncate ml-4">{getSlideTitle(currentSlideConfig)}</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 bg-gray-900/50 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <SlideThumbnail
                  slide={currentSlideConfig}
                  width={640}
                  height={360}
                  className="rounded-lg border border-gray-700 shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Next slide */}
          <div className="h-40 bg-gray-800 rounded-xl overflow-hidden flex flex-col flex-shrink-0">
            <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-400">Next Slide</span>
              {nextSlideConfig && (
                <span className="text-sm font-medium truncate ml-4">{getSlideTitle(nextSlideConfig)}</span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center p-2 bg-gray-900/50">
              {nextSlideConfig ? (
                <SlideThumbnail
                  slide={nextSlideConfig}
                  width={240}
                  height={135}
                  className="rounded border border-gray-700"
                />
              ) : (
                <span className="text-gray-500 text-sm">End of presentation</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 flex-shrink-0">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-[#21215C] hover:bg-[#2d2d7a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Right: Feedback panel */}
        <div className="w-96 border-l border-gray-700 flex flex-col flex-shrink-0">
          {/* Feedback header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="font-medium">Live Feedback</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => clearSlide(currentSlideConfig.id)}
                className="text-xs px-2 py-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="Clear this slide"
              >
                Clear slide
              </button>
              <button
                onClick={clearAll}
                className="text-xs px-2 py-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="Clear all feedback"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Current slide feedback count */}
          <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
            <span className="text-xs text-gray-400">
              On this slide: {currentSlideFeedback.length} items
            </span>
          </div>

          {/* Feedback list */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {allFeedback.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No feedback yet
                </div>
              ) : (
                allFeedback.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`px-4 py-3 border-b border-gray-700/50 ${
                      item.slideId === currentSlideConfig.id ? 'bg-[#21215C]/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        item.feedbackType === 'reaction'
                          ? 'bg-gray-700'
                          : item.feedbackType === 'comment'
                            ? 'bg-[#21215C]'
                            : (item as any).resolved
                              ? 'bg-green-600'
                              : 'bg-amber-500'
                      }`}>
                        {item.feedbackType === 'reaction' ? (
                          <span className="text-sm">{(item as any).emoji}</span>
                        ) : item.feedbackType === 'comment' ? (
                          <MessageCircle size={14} />
                        ) : (
                          <HelpCircle size={14} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {item.feedbackType === 'reaction' ? (
                          <p className="text-sm text-gray-300">
                            Reaction on slide {slides.findIndex((s) => s.id === item.slideId) + 1}
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-white">{(item as any).text}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {(item as any).authorName} • Slide {slides.findIndex((s) => s.id === item.slideId) + 1}
                            </p>
                            {/* Show replies if exist */}
                            {(item as any).replies?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {(item as any).replies.map((reply: any) => (
                                  <div key={reply.id} className="pl-3 border-l-2 border-green-500">
                                    <p className="text-sm text-green-300">{reply.text}</p>
                                    <p className="text-[10px] text-gray-500">— {reply.authorName}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Reply input */}
                            {replyingTo?.id === item.id && (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleReplySubmit()
                                    if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') }
                                  }}
                                  placeholder="Type your reply..."
                                  className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-[#21215C]"
                                  autoFocus
                                />
                                <button
                                  onClick={handleReplySubmit}
                                  className="p-1.5 bg-green-600 hover:bg-green-500 rounded transition-colors"
                                >
                                  <Send size={14} />
                                </button>
                                <button
                                  onClick={() => { setReplyingTo(null); setReplyText('') }}
                                  className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {item.feedbackType !== 'reaction' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Reply button - always show for comments and questions */}
                          <button
                            onClick={() => { setReplyingTo(item as Comment); setReplyText('') }}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-[#21215C] hover:bg-[#21215C]/10 rounded transition-colors"
                            title="Reply"
                          >
                            Reply
                          </button>
                          {/* Resolve button - for both comments and questions */}
                          {!(item as any).resolved && (
                            <button
                              onClick={() => resolveItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors"
                              title="Mark as resolved"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <SlideSearch
            slides={slides}
            initialQuery={searchInitialQuery}
            onSelect={(index) => {
              goToSlide(index)
              setShowSearch(false)
            }}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
