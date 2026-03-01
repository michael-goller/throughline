/**
 * ReactionOverlay - Display and add reactions on slides
 *
 * Shows aggregated reactions as floating badges.
 * In feedback mode, clicking shows an emoji picker to add reactions.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReactions } from '../hooks/useReactions'
import { REACTION_EMOJIS, type ReactionEmoji } from '../lib/instantdb'

interface ReactionOverlayProps {
  deckId: string
  slideId: string
  feedbackMode: boolean
}

interface EmojiPickerPosition {
  x: number
  y: number
  clickX: number  // pixel position for picker
  clickY: number
}

export default function ReactionOverlay({ deckId, slideId, feedbackMode }: ReactionOverlayProps) {
  const { aggregatedReactions, addReaction, isConfigured } = useReactions(deckId, slideId)
  const [pickerPosition, setPickerPosition] = useState<EmojiPickerPosition | null>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!feedbackMode) return

    // Don't open new picker if one is already open
    if (pickerPosition) return

    // Get click position relative to the overlay (0-1)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setPickerPosition({
      x,
      y,
      clickX: e.clientX,
      clickY: e.clientY,
    })
  }, [feedbackMode, pickerPosition])

  const handleEmojiSelect = useCallback((emoji: ReactionEmoji) => {
    if (pickerPosition) {
      addReaction(slideId, emoji, pickerPosition.x, pickerPosition.y)
      setPickerPosition(null)
    }
  }, [addReaction, slideId, pickerPosition])

  // Close picker on Escape
  useEffect(() => {
    if (!pickerPosition) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setPickerPosition(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pickerPosition])

  // Don't render anything if InstantDB is not configured
  if (!isConfigured) {
    return null
  }

  return (
    <div
      className={`absolute inset-0 z-20 ${feedbackMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onClick={feedbackMode ? handleClick : undefined}
    >
      {/* Aggregated Reactions */}
      {aggregatedReactions.map((reaction, idx) => (
        <motion.div
          key={`${reaction.emoji}-${idx}`}
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

      {/* Emoji Picker */}
      <AnimatePresence>
        {pickerPosition && (
          <>
            {/* Backdrop to close picker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={(e) => {
                e.stopPropagation()
                setPickerPosition(null)
              }}
            />

            {/* Picker */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed z-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2"
              style={{
                left: pickerPosition.clickX,
                top: pickerPosition.clickY,
                transform: 'translate(-50%, -100%) translateY(-8px)',
              }}
            >
              <div className="flex gap-1">
                {REACTION_EMOJIS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEmojiSelect(emoji)
                    }}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Arrow pointing down */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feedback Mode Indicator */}
      {feedbackMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#21215C] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
        >
          Feedback Mode - Click to react • Press <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded">Esc</kbd> to exit
        </motion.div>
      )}
    </div>
  )
}
