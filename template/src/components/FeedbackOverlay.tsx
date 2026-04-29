/**
 * FeedbackOverlay - Display and add reactions, comments, and questions on slides
 *
 * Desktop:
 * - Left-click: Add reaction (emoji picker)
 * - Right-click: Context menu for reaction / comment / question
 *
 * Touch:
 * - Tap: Add reaction (emoji picker)
 * - Comments and questions are intentionally not creatable on touch — the
 *   form-modal-on-top-of-feedback-mode UX is too cramped on a phone. Existing
 *   comment / question markers are still tappable to read what others wrote
 *   (reply input is hidden on touch).
 *
 * Tap the indicator banner (or press Esc) to exit feedback mode.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, HelpCircle, Send, X } from 'lucide-react'
import { useReactions } from '../hooks/useReactions'
import { useComments } from '../hooks/useComments'
import { useIdentity, type Identity } from '../hooks/useIdentity'
import { useIsTouch } from '../hooks/useIsTouch'
import { REACTION_EMOJIS, type ReactionEmoji, type Comment } from '../lib/instantdb'
import ContextMenu from './ContextMenu'
import FeedbackForm from './FeedbackForm'

interface FeedbackOverlayProps {
  deckId: string
  slideId: string
  feedbackMode: boolean
  onModalOpenChange?: (open: boolean) => void
  onExitFeedbackMode?: () => void
}

interface ClickPosition {
  x: number      // 0-1 relative
  y: number      // 0-1 relative
  clickX: number // pixel position
  clickY: number
}

type ModalType = 'emoji' | 'context' | 'comment' | 'question' | 'reply' | null

export default function FeedbackOverlay({ deckId, slideId, feedbackMode, onModalOpenChange, onExitFeedbackMode }: FeedbackOverlayProps) {
  const { aggregatedReactions, addReaction, isConfigured } = useReactions(deckId, slideId)
  const { comments, questions, addComment, addQuestion, addReply } = useComments(deckId, slideId)
  const { identity, setIdentity } = useIdentity()
  const isTouch = useIsTouch()

  const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [replyText, setReplyText] = useState('')

  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const replyIdentityInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onModalOpenChange?.(activeModal !== null)
  }, [activeModal, onModalOpenChange])

  // Focus the right reply field once the modal mounts (autoFocus can lose
  // races with framer-motion + slide-change animations).
  useEffect(() => {
    if (activeModal !== 'reply') return
    const id = requestAnimationFrame(() => {
      const target = identity ? replyTextareaRef.current : replyIdentityInputRef.current
      target?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [activeModal, identity])

  // Left-click / tap: open emoji picker.
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!feedbackMode) return
    if (activeModal) return

    const rect = e.currentTarget.getBoundingClientRect()
    setClickPosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      clickX: e.clientX,
      clickY: e.clientY,
    })
    setActiveModal('emoji')
  }, [feedbackMode, activeModal])

  // Right-click: open context menu (desktop only — no touch equivalent on
  // purpose; see file header).
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!feedbackMode) return
    if (isTouch) return

    const rect = e.currentTarget.getBoundingClientRect()
    setClickPosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      clickX: e.clientX,
      clickY: e.clientY,
    })
    setActiveModal('context')
  }, [feedbackMode, isTouch])

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setClickPosition(null)
    setReplyingTo(null)
    setReplyText('')
  }, [])

  // Open reply modal for a comment or question
  const openReplyModal = useCallback((item: Comment, e: React.MouseEvent) => {
    e.stopPropagation()
    setReplyingTo(item)
    setReplyText('')
    setActiveModal('reply')
  }, [])

  // Submit reply
  const handleReplySubmit = useCallback(() => {
    if (replyingTo && replyText.trim() && identity) {
      addReply(replyingTo, replyText.trim(), identity)
      closeModal()
    }
  }, [replyingTo, replyText, identity, addReply, closeModal])

  const handleEmojiSelect = useCallback((emoji: ReactionEmoji) => {
    if (clickPosition) {
      addReaction(slideId, emoji, clickPosition.x, clickPosition.y)
      closeModal()
    }
  }, [addReaction, slideId, clickPosition, closeModal])

  const handleCommentSubmit = useCallback((text: string, author: Identity | null) => {
    if (clickPosition && author) {
      addComment(slideId, text, clickPosition.x, clickPosition.y, author)
      closeModal()
    }
  }, [addComment, slideId, clickPosition, closeModal])

  const handleQuestionSubmit = useCallback((text: string, author: Identity | null, isAnonymous: boolean) => {
    if (clickPosition) {
      addQuestion(slideId, text, clickPosition.x, clickPosition.y, isAnonymous ? null : author)
      closeModal()
    }
  }, [addQuestion, slideId, clickPosition, closeModal])

  // Escape to close modals
  useEffect(() => {
    if (!activeModal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, closeModal])

  if (!isConfigured) {
    return null
  }

  return (
    <div
      className={`absolute inset-0 z-20 ${feedbackMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onClick={feedbackMode ? handleClick : undefined}
      onContextMenu={feedbackMode ? handleContextMenu : undefined}
      style={feedbackMode ? { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' } : undefined}
    >
      {/* Aggregated Reactions */}
      {aggregatedReactions.map((reaction, idx) => (
        <motion.div
          key={`reaction-${reaction.emoji}-${idx}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          transition={{ delay: 0.8, duration: 0.2 }}
          className="absolute pointer-events-auto cursor-default"
          style={{
            left: `${reaction.x * 100}%`,
            top: `${reaction.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex items-center gap-0.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-md border border-gray-200/50 dark:border-gray-700/50">
            <span className="text-sm">{reaction.emoji}</span>
            {reaction.count > 1 && (
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {reaction.count}
              </span>
            )}
          </div>
        </motion.div>
      ))}

      {/* Comments */}
      {comments.map((comment) => (
        <motion.div
          key={`comment-${comment.id}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          transition={{ delay: 0.8, duration: 0.2 }}
          className="absolute pointer-events-auto cursor-pointer group"
          style={{
            left: `${comment.x * 100}%`,
            top: `${comment.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => openReplyModal(comment, e)}
        >
          <div className={`flex items-center justify-center w-7 h-7 rounded-full shadow-md ${
            comment.resolved ? 'bg-green-500' : 'bg-accent-indigo'
          } text-white`}>
            <MessageCircle size={14} />
          </div>
          {/* Tooltip on hover */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
            comment.replies?.length ? 'w-64' : 'w-48'
          }`}>
            <p className="text-xs text-gray-900 dark:text-white line-clamp-3">{comment.text}</p>
            <p className="text-[10px] text-gray-500 mt-1">— {comment.authorName}</p>
            {comment.replies?.length ? (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <p className="text-[10px] text-accent-indigo dark:text-blue-400 font-medium">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}:
                </p>
                {comment.replies.slice(-2).map((reply) => (
                  <div key={reply.id}>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{reply.text}</p>
                    <p className="text-[10px] text-gray-500">— {reply.authorName}</p>
                  </div>
                ))}
                {comment.replies.length > 2 && (
                  <p className="text-[10px] text-gray-400 italic">+ {comment.replies.length - 2} more</p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-accent-indigo dark:text-blue-400 mt-2 italic">Click to reply</p>
            )}
          </div>
        </motion.div>
      ))}

      {/* Questions */}
      {questions.map((question) => (
        <motion.div
          key={`question-${question.id}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          transition={{ delay: 0.8, duration: 0.2 }}
          className="absolute pointer-events-auto cursor-pointer group"
          style={{
            left: `${question.x * 100}%`,
            top: `${question.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => openReplyModal(question, e)}
        >
          <div className={`flex items-center justify-center w-7 h-7 rounded-full shadow-md ${
            question.resolved ? 'bg-green-500' : 'bg-amber-500'
          } text-white`}>
            <HelpCircle size={14} />
          </div>
          {/* Tooltip on hover */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
            question.replies?.length ? 'w-64' : 'w-48'
          }`}>
            <p className="text-xs text-gray-900 dark:text-white line-clamp-3">{question.text}</p>
            <p className="text-[10px] text-gray-500 mt-1">— {question.authorName}</p>
            {question.replies?.length ? (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                  {question.replies.length} {question.replies.length === 1 ? 'answer' : 'answers'}:
                </p>
                {question.replies.slice(-2).map((reply) => (
                  <div key={reply.id}>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{reply.text}</p>
                    <p className="text-[10px] text-gray-500">— {reply.authorName}</p>
                  </div>
                ))}
                {question.replies.length > 2 && (
                  <p className="text-[10px] text-gray-400 italic">+ {question.replies.length - 2} more</p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 italic">Click to answer</p>
            )}
          </div>
        </motion.div>
      ))}

      {/* Emoji Picker */}
      <AnimatePresence>
        {activeModal === 'emoji' && clickPosition && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={(e) => { e.stopPropagation(); closeModal() }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed z-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2"
              style={{
                left: clickPosition.clickX,
                top: clickPosition.clickY,
                transform: 'translate(-50%, -100%) translateY(-8px)',
              }}
            >
              <div className="flex gap-1">
                {REACTION_EMOJIS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={(e) => { e.stopPropagation(); handleEmojiSelect(emoji) }}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {activeModal === 'context' && clickPosition && (
          <ContextMenu
            x={clickPosition.clickX}
            y={clickPosition.clickY}
            onAddReaction={() => setActiveModal('emoji')}
            onAddComment={() => setActiveModal('comment')}
            onAddQuestion={() => setActiveModal('question')}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* Comment Form */}
      <AnimatePresence>
        {activeModal === 'comment' && (
          <FeedbackForm
            type="comment"
            identity={identity}
            onSubmit={(text, author) => handleCommentSubmit(text, author)}
            onSaveIdentity={setIdentity}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* Question Form */}
      <AnimatePresence>
        {activeModal === 'question' && (
          <FeedbackForm
            type="question"
            identity={identity}
            onSubmit={handleQuestionSubmit}
            onSaveIdentity={setIdentity}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {activeModal === 'reply' && replyingTo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 pointer-events-auto"
              onClick={closeModal}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(24rem,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 pointer-events-auto"
            >
              {isTouch && (
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="absolute top-2 right-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={18} />
                </button>
              )}

              {/* Original message */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {replyingTo.type === 'comment' ? (
                    <MessageCircle size={14} className="text-accent-indigo" />
                  ) : (
                    <HelpCircle size={14} className="text-amber-500" />
                  )}
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {replyingTo.type === 'comment' ? 'Comment' : 'Question'} from {replyingTo.authorName}
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{replyingTo.text}</p>
              </div>

              {/* Existing replies */}
              {replyingTo.replies && replyingTo.replies.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {replyingTo.replies.length} {replyingTo.replies.length === 1 ? 'reply' : 'replies'}:
                  </p>
                  {replyingTo.replies.map((reply) => (
                    <div key={reply.id} className="pl-3 border-l-2 border-green-500 py-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{reply.text}</p>
                      <p className="text-[10px] text-gray-500">— {reply.authorName}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* On touch the reply UX (form modal layered over feedback mode)
                  is too cramped, so we render replies read-only. Tap the
                  backdrop or the X to close. */}
              {isTouch ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                  Open this deck on desktop to reply.
                </p>
              ) : !identity ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter your name to reply:</p>
                  <input
                    ref={replyIdentityInputRef}
                    type="text"
                    placeholder="Your name"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-indigo text-gray-900 dark:text-white placeholder:text-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setIdentity({ name: e.currentTarget.value.trim(), email: '' })
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Press Enter to continue</p>
                </div>
              ) : (
                /* Reply input */
                <div className="space-y-3">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleReplySubmit()
                      }
                      if (e.key === 'Escape') closeModal()
                    }}
                    placeholder="Write your reply..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-indigo resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Replying as {identity.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={closeModal}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReplySubmit}
                        disabled={!replyText.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent-indigo text-white rounded-lg hover:bg-accent-indigo-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={14} />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feedback Mode Indicator — also the primary exit affordance. On touch
          the nav cluster (z-10) sits behind this overlay (z-20) and isn't
          tappable, so tapping the indicator is the only way to leave feedback
          mode without a keyboard. */}
      {feedbackMode && !activeModal && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); onExitFeedbackMode?.() }}
          aria-label="Exit feedback mode"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-accent-indigo text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-auto"
        >
          {isTouch ? (
            <>
              <span>Feedback Mode • Tap to react</span>
              <span className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <X size={12} />
                <span className="text-xs">Exit</span>
              </span>
            </>
          ) : (
            <span>Feedback Mode • Click to react • Right-click for more • <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded">Esc</kbd> to exit</span>
          )}
        </motion.button>
      )}
    </div>
  )
}
