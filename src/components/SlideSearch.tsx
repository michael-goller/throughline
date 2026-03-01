import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Fuse from 'fuse.js'
import type { SlideConfig } from '../types'

interface SlideSearchProps {
  slides: SlideConfig[]
  initialQuery?: string
  onSelect: (index: number) => void
  onClose: () => void
}

interface SearchableSlide {
  index: number
  type: string
  title: string
  content: string
}

/**
 * Extract searchable text from a slide config
 */
function extractSlideContent(slide: SlideConfig): string {
  const parts: string[] = []

  // Common fields
  if ('title' in slide && slide.title) parts.push(slide.title)
  if ('subtitle' in slide && slide.subtitle) parts.push(slide.subtitle)
  if ('body' in slide && slide.body) parts.push(slide.body)
  if ('tagline' in slide && slide.tagline) parts.push(slide.tagline)

  // Bullets
  if ('bullets' in slide && slide.bullets) {
    parts.push(...slide.bullets)
  }

  // Type-specific content
  switch (slide.type) {
    case 'quote':
      parts.push(slide.quote, slide.author)
      if (slide.authorTitle) parts.push(slide.authorTitle)
      break

    case 'steps':
      slide.steps.forEach(s => {
        parts.push(s.title, s.description)
      })
      break

    case 'two-column':
      parts.push(slide.left.title, slide.left.body)
      parts.push(slide.right.title, slide.right.body)
      if (slide.left.bullets) parts.push(...slide.left.bullets)
      if (slide.right.bullets) parts.push(...slide.right.bullets)
      break

    case 'three-column':
      slide.columns.forEach(c => {
        parts.push(c.title, c.description)
      })
      break

    case 'stats':
      slide.stats.forEach(s => parts.push(s.label))
      break

    case 'timeline':
      slide.nodes.forEach(n => {
        parts.push(n.title, n.date)
        if (n.description) parts.push(n.description)
      })
      break

    case 'comparison':
      parts.push(...slide.leftItems, ...slide.rightItems)
      if (slide.leftLabel) parts.push(slide.leftLabel)
      if (slide.rightLabel) parts.push(slide.rightLabel)
      break

    case 'gantt':
      if (slide.tasks) {
        slide.tasks.forEach(t => {
          parts.push(t.name)
          if (t.section) parts.push(t.section)
        })
      }
      break

    case 'matrix':
      const allQuadrants = [
        ...slide.quadrants.topLeft,
        ...slide.quadrants.topRight,
        ...slide.quadrants.bottomLeft,
        ...slide.quadrants.bottomRight,
      ]
      allQuadrants.forEach(item => {
        parts.push(item.label)
        if (item.description) parts.push(item.description)
      })
      break

    case 'org-chart':
      const extractOrgNames = (node: { name: string; role: string; children?: any[] }): string[] => {
        const names = [node.name, node.role]
        if (node.children) {
          node.children.forEach(c => names.push(...extractOrgNames(c)))
        }
        return names
      }
      parts.push(...extractOrgNames(slide.root))
      break

    case 'feature-grid':
      slide.columns.forEach(c => parts.push(c.header))
      slide.rows.forEach(r => {
        parts.push(r.feature)
        r.values.forEach(v => {
          if (typeof v === 'string') parts.push(v)
        })
      })
      break

    case 'fishbone':
      parts.push(slide.problem)
      slide.branches.forEach(b => {
        parts.push(b.category)
        parts.push(...b.causes)
      })
      break

    case 'force-field':
      parts.push(slide.subject)
      slide.driving.forEach(d => parts.push(d.label))
      slide.restraining.forEach(r => parts.push(r.label))
      break

    case 'pricing':
      slide.tiers.forEach(t => {
        parts.push(t.name, t.price)
        if (t.description) parts.push(t.description)
        parts.push(...t.features)
      })
      break

    case 'icon-grid':
      slide.items.forEach(i => {
        parts.push(i.title)
        if (i.description) parts.push(i.description)
      })
      break

    case 'closing':
      if (slide.contactEmail) parts.push(slide.contactEmail)
      break
  }

  return parts.filter(Boolean).join(' ')
}

/**
 * Get display title for a slide
 */
function getSlideTitle(slide: SlideConfig): string {
  if ('title' in slide && slide.title) return slide.title
  if (slide.type === 'quote') return `"${slide.quote.slice(0, 40)}..."`
  if (slide.type === 'qa') return 'Q&A'
  if (slide.type === 'closing') return slide.tagline || 'Closing'
  return slide.type
}

export default function SlideSearch({ slides, initialQuery = '', onSelect, onClose }: SlideSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Build searchable index
  const searchableSlides = useMemo<SearchableSlide[]>(() => {
    return slides.map((slide, index) => ({
      index,
      type: slide.type,
      title: getSlideTitle(slide),
      content: extractSlideContent(slide),
    }))
  }, [slides])

  // Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(searchableSlides, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'type', weight: 0.5 },
      ],
      threshold: 0.3,           // Stricter matching
      ignoreLocation: true,     // Search anywhere in the string
      minMatchCharLength: 2,    // Require at least 2 chars to match
      includeMatches: true,
    })
  }, [searchableSlides])

  // Parse query for direct slide jump (e.g., "5" or ":5")
  const directJumpSlide = useMemo(() => {
    const trimmed = query.trim()
    // Match ":N" or just "N"
    const match = trimmed.match(/^:?(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      // Valid slide number (1-indexed for user)
      if (num >= 1 && num <= slides.length) {
        return num - 1 // Convert to 0-indexed
      }
    }
    return null
  }, [query, slides.length])

  // Search results
  const results = useMemo(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      // Show all slides when no query
      return searchableSlides.map(s => ({ item: s, isJumpOption: false }))
    }

    // If it's a :N command, return just the jump option
    if (trimmed.startsWith(':') && directJumpSlide !== null) {
      return [{
        item: searchableSlides[directJumpSlide],
        isJumpOption: true,
      }]
    }

    // Get fuzzy search results
    const searchResults = fuse.search(trimmed).map(r => ({ ...r, isJumpOption: false }))

    // If input is a valid slide number, prepend jump option
    if (directJumpSlide !== null) {
      return [
        { item: searchableSlides[directJumpSlide], isJumpOption: true },
        ...searchResults.filter(r => r.item.index !== directJumpSlide), // Avoid duplicate
      ]
    }

    return searchResults
  }, [query, fuse, searchableSlides, directJumpSlide])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector('[data-selected="true"]')
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        e.stopPropagation()
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex].item.index)
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-start justify-center pt-[15vh] bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xl bg-background-elevated border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search slides..."
            className="flex-1 bg-transparent text-text text-lg outline-none placeholder:text-text-muted/50"
          />
          <span className="text-text-muted text-sm">
            {results.length} {results.length === 1 ? 'slide' : 'slides'}
          </span>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted">
              No slides found
            </div>
          ) : (
            results.map((result, idx) => {
              const isSection = result.item.type === 'title' || result.item.type === 'divider'
              const isTitle = result.item.type === 'title'

              return (
                <button
                  key={`${result.isJumpOption ? 'jump-' : ''}${result.item.index}`}
                  data-selected={idx === selectedIndex}
                  onClick={() => onSelect(result.item.index)}
                  className={`w-full flex items-center gap-4 py-3 text-left transition-colors ${
                    isSection ? 'px-4' : 'px-4 pl-8'
                  } ${
                    idx === selectedIndex
                      ? 'bg-[#21215C] text-white'
                      : isSection
                        ? 'bg-[#21215C]/5 hover:bg-[#21215C]/10'
                        : idx % 2 === 0
                          ? 'bg-background hover:bg-[#21215C]/10'
                          : 'bg-background-elevated hover:bg-[#21215C]/10'
                  }`}
                >
                  {/* Slide number or jump icon */}
                  <span className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-mono ${
                    idx === selectedIndex
                      ? 'bg-white/20 text-white'
                      : result.isJumpOption
                        ? 'bg-[#21215C] text-white'
                        : isSection
                          ? 'bg-[#21215C]/20 text-[#21215C]'
                          : 'bg-nav-bg text-text-muted'
                  }`}>
                    {result.item.index + 1}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`truncate ${
                      idx === selectedIndex
                        ? 'text-white'
                        : isSection
                          ? 'text-[#21215C]'
                          : 'text-text'
                    } ${isTitle ? 'font-semibold text-base' : isSection ? 'font-medium' : 'font-normal'}`}>
                      {result.isJumpOption ? `Jump to slide ${result.item.index + 1}` : result.item.title}
                    </div>
                    <div className={`text-sm truncate ${idx === selectedIndex ? 'text-white/70' : 'text-text-muted'}`}>
                      {result.isJumpOption ? result.item.title : result.item.type}
                    </div>
                  </div>

                  {/* Keyboard hint for selected */}
                  {idx === selectedIndex && (
                    <span className="text-white/70 text-xs font-mono">
                      enter
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex gap-4 text-text-muted text-xs">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">:N</kbd> jump to slide</span>
          <span><kbd className="font-mono">enter</kbd> select</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
