import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
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
  ExternalLink,
  Copy,
  Download,
  MoreVertical,
  User,
  Calendar,
  Eye,
  BarChart3,
  BookTemplate,
  RefreshCw,
  FolderOpen,
  LogOut,
  Share2,
  Presentation,
} from 'lucide-react'
import { fetchDeckManifest, type DeckManifestEntry } from '../lib/deckLoader'
import { getAllDeckStats } from '../lib/analytics'
import { prefetchDeck } from '../lib/prefetch'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import DeckAnalytics from './DeckAnalytics'
import ShareDialog from './ShareDialog'
import TemplateGallery from './TemplateGallery'
import OnboardingOverlay from './OnboardingOverlay'
import { useOnboarding } from '../hooks/useOnboarding'
import ThreadMark from './onboarding/ThreadMark'
import ReportIssueLink from './ReportIssueLink'

type SortMode = 'recent' | 'alpha' | 'slides' | 'views'

interface DeckCardProps {
  deck: DeckManifestEntry
  index: number
  viewCount?: number
  lastViewedAt?: string | null
  focused?: boolean
  shareCount?: number
  onShowAnalytics: (deckId: string, title: string) => void
  onShare: (slug: string, title: string) => void
}

/** Shorten a path for display — show ~/ for home dir, last 2 segments otherwise */
function shortenPath(p: string): string {
  const shortened = p.replace(/^\/Users\/[^/]+/, '~').replace(/^\/home\/[^/]+/, '~')
  return shortened
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

function DeckCard({ deck, index, viewCount, lastViewedAt, focused, shareCount, onShowAnalytics, onShare }: DeckCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [focused])

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

  const handleOpenSpeakerView = useCallback(() => {
    setShowMenu(false)
    window.open(`/decks/${encodeURIComponent(deck.id)}/presenter`, '_blank', 'noopener,noreferrer')
  }, [deck.id])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group relative ${focused ? 'ring-2 ring-accent-primary rounded-xl' : ''}`}
    >
      <div
        onClick={handleOpen}
        onPointerEnter={() => prefetchDeck(deck.id)}
        className="cursor-pointer rounded-xl border border-chrome-border bg-chrome-card overflow-hidden transition-all duration-200 hover:border-chrome-border-hover hover:shadow-lg hover:shadow-accent-primary/10 hover:-translate-y-0.5"
      >
        {/* Thumbnail area — diamond-anchored placeholder when no deck image */}
        <div className="relative aspect-video bg-chrome-surface overflow-hidden">
          {deck.thumbnail ? (
            <img
              src={deck.thumbnail}
              alt={deck.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 opacity-60">
                <ThreadMark size={40} color="var(--accent-primary)" staticMark />
                <span className="text-tiny font-mono tracking-wide text-chrome-ink-muted">
                  {deck.slideCount ? `${deck.slideCount} slides` : 'deck'}
                </span>
              </div>
            </div>
          )}
          {/* Hover overlay with quick actions */}
          <div className="absolute inset-0 bg-chrome-base/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-caption font-medium shadow-md"
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
          <h3 className="font-display text-chrome-ink font-semibold text-body-sm truncate">
            {deck.title}
          </h3>
          {deck.description && (
            <p className="text-chrome-ink-muted text-caption mt-1 line-clamp-2 leading-relaxed">
              {deck.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-tiny text-chrome-ink-muted">
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
            {(viewCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {viewCount}
              </span>
            )}
            {(shareCount ?? 0) > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(deck.id, deck.title)
                }}
                className="flex items-center gap-1 hover:text-accent-primary transition-colors"
              >
                <Share2 size={11} />
                {shareCount}
              </button>
            )}
            {deck.updatedAt && (
              <span className="flex items-center gap-1 ml-auto">
                <Calendar size={11} />
                {formatDate(lastViewedAt ?? deck.updatedAt)}
              </span>
            )}
          </div>
          {deck.sourcePath && (
            <div className="flex items-center gap-1 mt-1.5 text-tiny text-chrome-ink-muted/70 truncate" title={deck.sourcePath}>
              <FolderOpen size={10} className="flex-shrink-0" />
              <span className="truncate">{shortenPath(deck.sourcePath)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Context menu button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1.5 rounded-lg bg-chrome-base/70 backdrop-blur-sm text-chrome-ink-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-chrome-base hover:text-chrome-ink"
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
                className="absolute right-0 top-8 z-20 w-40 rounded-lg bg-chrome-card border border-chrome-border shadow-xl py-1"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpen()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                >
                  <ExternalLink size={13} />
                  Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                >
                  <Copy size={13} />
                  Copy link
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExport()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                >
                  <Download size={13} />
                  Open in new tab
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenSpeakerView()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                >
                  <Presentation size={13} />
                  Speaker View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onShare(deck.id, deck.title)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                >
                  <Share2 size={13} />
                  Share…
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onShowAnalytics(deck.id, deck.title)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-caption text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                >
                  <BarChart3 size={13} />
                  Analytics
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
  const { user, logout } = useAuth()
  const [decks, setDecks] = useState<DeckManifestEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [analyticsTarget, setAnalyticsTarget] = useState<{ deckId: string; title: string } | null>(null)
  const [shareTarget, setShareTarget] = useState<{ slug: string; title: string } | null>(null)
  const [shareCounts, setShareCounts] = useState<Map<string, number>>(new Map())
  const [view, setView] = useState<'decks' | 'templates'>('decks')
  const [refreshing, setRefreshing] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const [showHelp, setShowHelp] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const newDeckBtnRef = useRef<HTMLButtonElement>(null)

  const onboarding = useOnboarding({ context: 'dashboard', deckCount: decks.length })

  // Fetch view stats for all decks
  const deckStats = useMemo(() => getAllDeckStats(), [decks])

  const loadDecks = useCallback(() => {
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

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  useEffect(() => {
    if (decks.length === 0) return
    const apiBase = import.meta.env.VITE_DECK_API_URL || '/api/decks'
    decks.forEach(deck => {
      fetch(`${apiBase}/${encodeURIComponent(deck.id)}/share`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then((tokens: unknown[]) => {
          setShareCounts(prev => {
            const next = new Map(prev)
            next.set(deck.id, tokens.length)
            return next
          })
        })
        .catch(() => {})
    })
  }, [decks])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchDeckManifest()
      .then((manifest) => {
        setDecks(manifest.decks)
        setStatus('ready')
      })
      .catch((err) => {
        setError(String(err))
        setStatus('error')
      })
      .finally(() => {
        setTimeout(() => setRefreshing(false), 400)
      })
  }, [])

  // Fuse.js index for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(decks, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'description', weight: 1 },
          { name: 'author', weight: 0.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [decks],
  )

  const filtered = useMemo(() => {
    let result = decks

    // Fuzzy search via Fuse.js
    if (search.trim()) {
      result = fuse.search(search).map((r) => r.item)
    }

    // Sort (skip when searching — Fuse already ranks by relevance)
    if (!search.trim()) {
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
        if (sort === 'views') {
          const va = deckStats.get(a.id)?.totalViews ?? 0
          const vb = deckStats.get(b.id)?.totalViews ?? 0
          return vb - va
        }
        return 0
      })
    }

    return result
  }, [decks, search, sort, deckStats, fuse])

  // Reset focus index when the filtered list changes
  useEffect(() => {
    setFocusIndex(-1)
  }, [filtered.length, search])

  const sortOptions: { mode: SortMode; label: string; icon: typeof Clock }[] = [
    { mode: 'recent', label: 'Recent', icon: Clock },
    { mode: 'alpha', label: 'A-Z', icon: ArrowUpAZ },
    { mode: 'slides', label: 'Slides', icon: SortAsc },
    { mode: 'views', label: 'Views', icon: Eye },
  ]

  // Grid columns must match the Tailwind classes on the grid container
  const getGridCols = useCallback(() => {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth >= 1024) return 3
    if (window.innerWidth >= 640) return 2
    return 1
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (view !== 'decks') return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Help modal owns keyboard when open
      if (showHelp) {
        setShowHelp(false)
        e.preventDefault()
        return
      }

      // When search is focused, only handle Escape
      if (isInput) {
        if (e.key === 'Escape') {
          ;(target as HTMLInputElement).blur()
          setSearch('')
          e.preventDefault()
        }
        return
      }

      // `/` — focus search
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // `?` — show help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowHelp(true)
        return
      }

      // Escape — clear focus
      if (e.key === 'Escape') {
        setFocusIndex(-1)
        return
      }

      const cols = getGridCols()
      const total = filtered.length
      if (total === 0) return

      // vim-style and arrow navigation
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((prev) => (prev < 0 ? 0 : Math.min(prev + cols, total - 1)))
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((prev) => (prev < 0 ? 0 : Math.max(prev - cols, 0)))
      } else if (e.key === 'l' || e.key === 'ArrowRight') {
        e.preventDefault()
        setFocusIndex((prev) => (prev < 0 ? 0 : Math.min(prev + 1, total - 1)))
      } else if (e.key === 'h' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setFocusIndex((prev) => (prev < 0 ? 0 : Math.max(prev - 1, 0)))
      } else if (e.key === 'g') {
        // gg — first card (handled via double-tap like App.tsx)
        setFocusIndex(0)
      } else if (e.key === 'G') {
        e.preventDefault()
        setFocusIndex(total - 1)
      } else if (e.key === 'Enter') {
        if (focusIndex >= 0 && focusIndex < total) {
          window.location.href = `/decks/${encodeURIComponent(filtered[focusIndex].id)}`
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [view, showHelp, filtered, focusIndex, getGridCols])

  return (
    <div className="warp-surface w-full h-full overflow-y-auto text-chrome-ink">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header — Throughline lockup: thread mark + mono wordmark */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ThreadMark size={28} color="var(--accent-primary)" />
            <div className="flex flex-col">
              <span
                className="font-mono font-bold text-[20px] lowercase leading-none text-chrome-ink"
                style={{ letterSpacing: '-0.01em' }}
              >
                throughline
              </span>
              <span className="text-tiny font-mono text-chrome-ink-muted mt-1 tracking-wide">
                decks as code · argument as craft
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-chrome-ink-muted hover:text-chrome-ink hover:bg-chrome-nav-bg transition-colors disabled:opacity-50"
              aria-label="Refresh decks"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-chrome-ink-muted hover:text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </motion.button>
            {user && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => logout().then(() => window.location.reload())}
                className="p-2 rounded-lg text-chrome-ink-muted hover:text-chrome-ink hover:bg-chrome-nav-bg transition-colors"
                aria-label="Sign out"
                title={`Signed in as ${user.name}`}
              >
                <LogOut size={18} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('templates')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-caption font-semibold border border-chrome-border text-chrome-ink hover:bg-chrome-nav-bg hover:border-chrome-border-hover transition-colors"
            >
              <BookTemplate size={15} />
              Templates
            </motion.button>
            <motion.button
              ref={newDeckBtnRef}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white rounded-lg text-caption font-semibold hover:bg-accent-primary-hover transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-primary/30"
            >
              <Plus size={15} />
              New deck
            </motion.button>
          </div>
        </div>

        {/* Template Gallery view */}
        {view === 'templates' && (
          <TemplateGallery
            onBack={() => setView('decks')}
            onUseTemplate={(deckId) => {
              window.location.href = `/decks/${encodeURIComponent(deckId)}`
            }}
          />
        )}

        {/* Decks view */}
        {view === 'decks' && <>
        {/* Search & Sort bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-ink-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search decks…  (press /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-chrome-surface border border-chrome-border text-chrome-ink text-caption placeholder:text-chrome-ink-muted/70 focus:outline-none focus:border-chrome-border-hover focus:ring-1 focus:ring-chrome-border-hover transition-colors"
            />
          </div>
          <div className="flex items-center rounded-lg bg-chrome-surface border border-chrome-border overflow-hidden">
            {sortOptions.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`flex items-center gap-1 px-3 py-2 text-tiny font-medium transition-colors ${
                  sort === mode
                    ? 'bg-chrome-nav-bg text-chrome-ink'
                    : 'text-chrome-ink-muted hover:text-chrome-ink hover:bg-chrome-nav-bg/60'
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
            <Loader2 size={28} className="text-accent-primary animate-spin" />
            <p className="text-chrome-ink-muted text-caption">Loading decks...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <AlertCircle size={36} className="text-red-500" />
            <p className="text-chrome-ink text-body-sm font-semibold">Failed to load decks</p>
            <p className="text-chrome-ink-muted text-caption max-w-md text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-caption hover:bg-accent-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            {search ? (
              <>
                <Search size={36} className="text-chrome-ink-muted/40" />
                <p className="text-chrome-ink text-body-sm font-semibold">No decks match "{search}"</p>
                <button
                  onClick={() => setSearch('')}
                  className="text-accent-primary text-caption hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="opacity-70">
                  <ThreadMark size={64} color="var(--accent-primary)" staticMark />
                </div>
                <p className="text-chrome-ink text-body-sm font-semibold mt-1">No decks yet</p>
                <p className="text-chrome-ink-muted text-caption font-mono tracking-wide">
                  run <span className="text-chrome-ink">throughline onboard</span> to make your first deck.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white rounded-lg text-caption font-semibold hover:bg-accent-primary-hover transition-colors"
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
            <p className="text-chrome-ink-muted text-tiny mb-4 font-mono">
              {filtered.length} {filtered.length === 1 ? 'deck' : 'decks'}
              {search && ` matching "${search}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((deck, i) => {
                const stats = deckStats.get(deck.id)
                return (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    index={i}
                    viewCount={stats?.totalViews}
                    lastViewedAt={stats?.lastViewedAt}
                    focused={focusIndex === i}
                    shareCount={shareCounts.get(deck.id)}
                    onShowAnalytics={(id, title) => setAnalyticsTarget({ deckId: id, title })}
                    onShare={(slug, title) => setShareTarget({ slug, title })}
                  />
                )
              })}
            </div>
          </>
        )}

        </>}

        {/* Footer with keyboard hints */}
        <div className="mt-16 pb-4 text-center text-tiny text-chrome-ink-muted/60 space-y-1">
          <div>
            <span className="font-mono">/</span> search
            <span className="mx-2">·</span>
            <span className="font-mono">j k h l</span> navigate
            <span className="mx-2">·</span>
            <span className="font-mono">Enter</span> open
            <span className="mx-2">·</span>
            <span className="font-mono">?</span> help
            <span className="mx-2">·</span>
            <button
              type="button"
              onClick={onboarding.resumeFromStored}
              className="underline-offset-4 hover:underline hover:text-chrome-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 rounded"
            >
              Guide
            </button>
            <span className="mx-2">·</span>
            <ReportIssueLink
              variant="inline"
              className="hover:text-chrome-ink"
              getContext={() => ({ context: 'dashboard' })}
            />
          </div>
          <div
            className="font-mono tracking-wide lowercase text-chrome-ink-muted/80"
            style={{ letterSpacing: '-0.01em' }}
          >
            throughline
          </div>
        </div>
      </div>

      {/* Help modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-chrome-base/95 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-chrome-card rounded-xl p-8 shadow-2xl max-w-md border border-chrome-border"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-mono text-chrome-ink text-xl font-bold lowercase mb-6" style={{ letterSpacing: '-0.01em' }}>
                overview shortcuts
              </h2>
              <div className="space-y-3 text-chrome-ink-secondary">
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">/</span>
                  <span>Focus search (fuzzy)</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">Escape</span>
                  <span>Clear search / unfocus</span>
                </div>
                <div className="border-t border-chrome-border my-2" />
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">j / k</span>
                  <span>Down / Up</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">h / l</span>
                  <span>Left / Right</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">&darr; &uarr; &larr; &rarr;</span>
                  <span>Arrow navigation</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">gg</span>
                  <span>First deck</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">G</span>
                  <span>Last deck</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">Enter</span>
                  <span>Open selected deck</span>
                </div>
                <div className="border-t border-chrome-border my-2" />
                <div className="flex justify-between gap-8">
                  <span className="font-mono text-accent-primary">?</span>
                  <span>Show this help</span>
                </div>
                <div className="border-t border-chrome-border my-2" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowHelp(false)
                    onboarding.replayFromStart()
                  }}
                  className="w-full text-left text-caption text-chrome-ink-muted hover:text-chrome-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 rounded"
                >
                  Replay guide from start
                </button>
              </div>
              <p className="text-chrome-ink-muted/70 text-sm mt-6">Press any key or click to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics modal */}
      <AnimatePresence>
        {analyticsTarget && (
          <DeckAnalytics
            deckId={analyticsTarget.deckId}
            deckTitle={analyticsTarget.title}
            onClose={() => setAnalyticsTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Share dialog */}
      <AnimatePresence>
        {shareTarget && (
          <ShareDialog
            slug={shareTarget.slug}
            deckTitle={shareTarget.title}
            onClose={() => setShareTarget(null)}
            onShareCountChange={(count) => {
              setShareCounts(prev => {
                const next = new Map(prev)
                next.set(shareTarget.slug, count)
                return next
              })
            }}
          />
        )}
      </AnimatePresence>

      {/* First-run / re-entry onboarding guide */}
      <OnboardingOverlay
        controller={onboarding}
        context="dashboard"
        returnFocusRef={newDeckBtnRef}
      />
    </div>
  )
}
