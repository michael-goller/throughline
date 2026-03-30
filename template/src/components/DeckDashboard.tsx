import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  SortAsc,
  Clock,
  ArrowUpAZ,
  Layers,
  Plus,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  LayoutGrid,
  ExternalLink,
  Copy,
  Download,
  MoreVertical,
  User,
  Calendar,
} from 'lucide-react'
import { fetchDeckManifest, type DeckManifestEntry } from '../lib/deckLoader'
import { useTheme } from '../hooks/useTheme'

type SortMode = 'recent' | 'alpha' | 'slides'

interface DeckCardProps {
  deck: DeckManifestEntry
  index: number
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function DeckCard({ deck, index }: DeckCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleOpen = useCallback(() => {
    window.location.href = `/decks/${encodeURIComponent(deck.id)}`
  }, [deck.id])

  const handleDuplicate = useCallback(() => {
    setShowMenu(false)
    // Copy deck URL to clipboard as a starting point
    navigator.clipboard?.writeText(`${window.location.origin}/decks/${encodeURIComponent(deck.id)}`)
  }, [deck.id])

  const handleExport = useCallback(() => {
    setShowMenu(false)
    // Open deck in new tab (for now — full export would need the export script)
    window.open(`/decks/${encodeURIComponent(deck.id)}`, '_blank')
  }, [deck.id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      <div
        onClick={handleOpen}
        className="cursor-pointer rounded-xl border border-border bg-background-elevated overflow-hidden transition-all duration-200 hover:border-border-accent hover:shadow-lg hover:shadow-brand-red/5 hover:-translate-y-0.5"
      >
        {/* Thumbnail area */}
        <div className="relative aspect-video bg-background-accent overflow-hidden">
          {deck.thumbnail ? (
            <img
              src={deck.thumbnail}
              alt={deck.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-text-muted/40">
                <Layers size={32} />
                <span className="text-tiny font-medium">
                  {deck.slideCount ? `${deck.slideCount} slides` : 'Deck'}
                </span>
              </div>
            </div>
          )}
          {/* Hover overlay with quick actions */}
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white rounded-lg text-caption font-medium shadow-md"
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
            >
              <ExternalLink size={14} />
              Open
            </motion.button>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <h3 className="font-display text-text font-semibold text-body-sm truncate">
            {deck.title}
          </h3>
          {deck.description && (
            <p className="text-text-muted text-caption mt-1 line-clamp-2 leading-relaxed">
              {deck.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-tiny text-text-muted">
            {deck.author && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {deck.author}
              </span>
            )}
            {deck.slideCount != null && (
              <span className="flex items-center gap-1">
                <Layers size={11} />
                {deck.slideCount}
              </span>
            )}
            {deck.updatedAt && (
              <span className="flex items-center gap-1 ml-auto">
                <Calendar size={11} />
                {formatDate(deck.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Context menu button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1.5 rounded-lg bg-background/70 backdrop-blur-sm text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:text-text"
        >
          <MoreVertical size={14} />
        </button>
        <AnimatePresence>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-8 z-20 w-40 rounded-lg bg-background-elevated border border-border shadow-xl py-1"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpen()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-text hover:bg-nav-bg transition-colors"
                >
                  <ExternalLink size={13} />
                  Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-text hover:bg-nav-bg transition-colors"
                >
                  <Copy size={13} />
                  Copy link
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExport()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-text hover:bg-nav-bg transition-colors"
                >
                  <Download size={13} />
                  Open in new tab
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function DeckDashboard() {
  const { theme, toggleTheme } = useTheme()
  const [decks, setDecks] = useState<DeckManifestEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')

  useEffect(() => {
    fetchDeckManifest()
      .then((manifest) => {
        setDecks(manifest.decks)
        setStatus('ready')
      })
      .catch((err) => {
        setError(String(err))
        setStatus('error')
      })
  }, [])

  const filtered = useMemo(() => {
    let result = decks

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.author?.toLowerCase().includes(q)
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sort === 'recent') {
        const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return db - da
      }
      if (sort === 'alpha') {
        return a.title.localeCompare(b.title)
      }
      if (sort === 'slides') {
        return (b.slideCount ?? 0) - (a.slideCount ?? 0)
      }
      return 0
    })

    return result
  }, [decks, search, sort])

  const sortOptions: { mode: SortMode; label: string; icon: typeof Clock }[] = [
    { mode: 'recent', label: 'Recent', icon: Clock },
    { mode: 'alpha', label: 'A-Z', icon: ArrowUpAZ },
    { mode: 'slides', label: 'Slides', icon: SortAsc },
  ]

  return (
    <div className="w-full h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
              <LayoutGrid size={16} className="text-white" />
            </div>
            <h1 className="font-display text-text text-h3 font-bold tracking-tight">
              Shine
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white rounded-lg text-caption font-semibold hover:bg-brand-red-dark transition-colors shadow-sm"
            >
              <Plus size={15} />
              New deck
            </motion.button>
          </div>
        </div>

        {/* Search & Sort bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search decks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-background-accent border border-border text-text text-caption placeholder:text-text-muted/60 focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-border-accent transition-colors"
            />
          </div>
          <div className="flex items-center rounded-lg bg-background-accent border border-border overflow-hidden">
            {sortOptions.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`flex items-center gap-1 px-3 py-2 text-tiny font-medium transition-colors ${
                  sort === mode
                    ? 'bg-nav-bg text-text'
                    : 'text-text-muted hover:text-text hover:bg-nav-bg/50'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={28} className="text-brand-red animate-spin" />
            <p className="text-text-muted text-caption">Loading decks...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <AlertCircle size={36} className="text-red-500" />
            <p className="text-text text-body-sm font-semibold">Failed to load decks</p>
            <p className="text-text-muted text-caption max-w-md text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-brand-red text-white rounded-lg text-caption hover:bg-brand-red-dark transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            {search ? (
              <>
                <Search size={36} className="text-text-muted/40" />
                <p className="text-text text-body-sm font-semibold">No decks match "{search}"</p>
                <button
                  onClick={() => setSearch('')}
                  className="text-brand-red text-caption hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Layers size={36} className="text-text-muted/40" />
                <p className="text-text text-body-sm font-semibold">No decks yet</p>
                <p className="text-text-muted text-caption">Create your first presentation to get started.</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white rounded-lg text-caption font-semibold hover:bg-brand-red-dark transition-colors"
                >
                  <Plus size={15} />
                  New deck
                </motion.button>
              </>
            )}
          </div>
        )}

        {status === 'ready' && filtered.length > 0 && (
          <>
            <p className="text-text-muted text-tiny mb-4">
              {filtered.length} {filtered.length === 1 ? 'deck' : 'decks'}
              {search && ` matching "${search}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((deck, i) => (
                <DeckCard key={deck.id} deck={deck} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 pb-4 text-center text-tiny text-text-muted/40">
          Shine Presentations
        </div>
      </div>
    </div>
  )
}
