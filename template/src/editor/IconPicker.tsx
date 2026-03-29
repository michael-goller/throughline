import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { X, Search } from 'lucide-react'

interface IconPickerProps {
  currentIcon?: string
  onSelect: (iconName: string) => void
  onClose: () => void
}

// Build icon list once
const allIcons: { name: string; Icon: LucideIcon }[] = []
for (const [name, value] of Object.entries(icons)) {
  if (typeof value === 'function' && /^[A-Z]/.test(name) && name !== 'createLucideIcon') {
    allIcons.push({ name, Icon: value as LucideIcon })
  }
}

export default function IconPicker({ currentIcon, onSelect, onClose }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return allIcons.slice(0, 120) // Show first 120 by default
    const q = query.toLowerCase()
    return allIcons.filter(i => i.name.toLowerCase().includes(q)).slice(0, 120)
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="bg-background-elevated rounded-xl border border-border shadow-2xl w-[520px] max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search icons..."
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-muted/50"
          />
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-8 gap-1">
            {filtered.map(({ name, Icon }) => (
              <button
                key={name}
                onClick={() => onSelect(name)}
                title={name}
                className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-background-accent transition-colors ${
                  name === currentIcon
                    ? 'bg-brand-red/20 text-brand-red ring-1 ring-brand-red/40'
                    : 'text-text-secondary'
                }`}
              >
                <Icon size={20} />
                <span className="text-[9px] mt-1 truncate w-full text-center opacity-60">
                  {name}
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">No icons match "{query}"</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
