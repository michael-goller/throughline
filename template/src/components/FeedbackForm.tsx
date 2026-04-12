/**
 * Form modal for comments and questions
 */

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send } from 'lucide-react'
import type { Identity } from '../hooks/useIdentity'

interface FeedbackFormProps {
  type: 'comment' | 'question'
  identity: Identity | null
  onSubmit: (text: string, identity: Identity | null, isAnonymous: boolean) => void
  onSaveIdentity: (identity: Identity) => void
  onClose: () => void
}

export default function FeedbackForm({
  type,
  identity,
  onSubmit,
  onSaveIdentity,
  onClose,
}: FeedbackFormProps) {
  const [text, setText] = useState('')
  const [name, setName] = useState(identity?.name ?? '')
  const [email, setEmail] = useState(identity?.email ?? '')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isQuestion = type === 'question'
  const needsIdentity = !identity && !isAnonymous

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) return

    // For comments, always need identity
    // For questions, can be anonymous
    if (!isAnonymous && needsIdentity) {
      if (!name.trim() || !email.trim()) return

      // Save identity for future
      const newIdentity = { name: name.trim(), email: email.trim() }
      onSaveIdentity(newIdentity)
      onSubmit(text.trim(), newIdentity, false)
    } else if (isAnonymous) {
      onSubmit(text.trim(), null, true)
    } else {
      onSubmit(text.trim(), identity, false)
    }
  }

  const canSubmit = text.trim() && (identity || isAnonymous || (name.trim() && email.trim()))

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {isQuestion ? 'Ask a question' : 'Add a comment'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isQuestion ? 'What would you like to ask?' : 'Share your thoughts...'}
              className="w-full h-24 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-indigo text-gray-900 dark:text-white placeholder:text-gray-400"
            />

            {/* Identity fields - only show if not identified */}
            {needsIdentity && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-indigo text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-indigo text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Anonymous option - only for questions, always show */}
            {isQuestion && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-accent-indigo focus:ring-accent-indigo"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Ask anonymously
                </span>
              </label>
            )}

            {/* Show current identity if identified and not anonymous */}
            {identity && !isAnonymous && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Posting as <span className="font-medium">{identity.name}</span>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-indigo text-white rounded-lg hover:bg-accent-indigo-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={14} />
              {isQuestion ? 'Ask' : 'Comment'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}
