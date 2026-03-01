/**
 * Context menu for right-click actions
 */

import { motion } from 'framer-motion'
import { MessageCircle, HelpCircle, Smile } from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  onAddReaction: () => void
  onAddComment: () => void
  onAddQuestion: () => void
  onClose: () => void
}

export default function ContextMenu({
  x,
  y,
  onAddReaction,
  onAddComment,
  onAddQuestion,
  onClose,
}: ContextMenuProps) {
  const menuItems = [
    { icon: Smile, label: 'Add reaction', onClick: onAddReaction },
    { icon: MessageCircle, label: 'Add comment', onClick: onAddComment },
    { icon: HelpCircle, label: 'Ask question', onClick: onAddQuestion },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
        style={{
          left: x,
          top: y,
        }}
      >
        {menuItems.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon size={16} className="text-gray-500 dark:text-gray-400" />
            {label}
          </button>
        ))}
      </motion.div>
    </>
  )
}
