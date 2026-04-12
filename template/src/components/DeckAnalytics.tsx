import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Eye, Clock, TrendingUp, Users } from 'lucide-react'
import { getDeckViewStats, getViewEvents } from '../lib/analytics'

interface DeckAnalyticsProps {
  deckId: string
  deckTitle: string
  onClose: () => void
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DeckAnalytics({ deckId, deckTitle, onClose }: DeckAnalyticsProps) {
  const stats = useMemo(() => getDeckViewStats(deckId), [deckId])
  const recentViews = useMemo(() => {
    const views = getViewEvents(deckId)
    return views.sort((a, b) => b.viewedAt.localeCompare(a.viewedAt)).slice(0, 20)
  }, [deckId])

  const maxDayViews = useMemo(
    () => Math.max(1, ...stats.viewsByDay.map((d) => d.count)),
    [stats.viewsByDay]
  )

  // Unique viewers
  const uniqueViewers = useMemo(() => {
    const set = new Set(recentViews.map((v) => v.viewer ?? 'anonymous'))
    return set.size
  }, [recentViews])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background-elevated rounded-xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-text text-body-sm font-semibold">Analytics</h2>
            <p className="text-text-muted text-caption mt-0.5">{deckTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4">
          <StatCard icon={Eye} label="Total views" value={String(stats.totalViews)} />
          <StatCard icon={Users} label="Unique viewers" value={String(uniqueViewers)} />
          <StatCard icon={Clock} label="Avg. duration" value={stats.avgDurationSec > 0 ? formatDuration(stats.avgDurationSec) : '—'} />
          <StatCard icon={TrendingUp} label="Last viewed" value={stats.lastViewedAt ? formatDate(stats.lastViewedAt) : '—'} />
        </div>

        {/* Views over time (last 30 days) */}
        <div className="px-6 py-4">
          <h3 className="text-text text-caption font-semibold mb-3">Views — last 30 days</h3>
          {stats.totalViews === 0 ? (
            <div className="flex items-center justify-center py-8 text-text-muted text-caption">
              No views recorded yet
            </div>
          ) : (
            <div className="flex items-end gap-px h-24">
              {stats.viewsByDay.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full rounded-t bg-brand-red/70 hover:bg-brand-red transition-colors min-h-[2px]"
                    style={{
                      height: `${Math.max(2, (day.count / maxDayViews) * 100)}%`,
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                    <div className="bg-background border border-border rounded px-2 py-1 text-tiny text-text whitespace-nowrap shadow-lg">
                      {day.date}: {day.count} {day.count === 1 ? 'view' : 'views'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* X-axis labels */}
          {stats.viewsByDay.length > 0 && (
            <div className="flex justify-between mt-1 text-tiny text-text-muted/60">
              <span>{stats.viewsByDay[0].date.slice(5)}</span>
              <span>{stats.viewsByDay[stats.viewsByDay.length - 1].date.slice(5)}</span>
            </div>
          )}
        </div>

        {/* Recent views table */}
        {recentViews.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <h3 className="text-text text-caption font-semibold mb-3">Recent views</h3>
            <div className="space-y-1.5">
              {recentViews.map((v, i) => (
                <div key={i} className="flex items-center gap-3 text-caption text-text-muted py-1">
                  <span className="w-28 shrink-0 text-tiny">{formatDate(v.viewedAt)}</span>
                  <span className="flex-1 truncate">{v.viewer || 'anonymous'}</span>
                  <span className="text-tiny tabular-nums">
                    {v.durationSec > 0 ? formatDuration(v.durationSec) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background-accent p-3">
      <div className="flex items-center gap-1.5 text-text-muted mb-1">
        <Icon size={13} />
        <span className="text-tiny">{label}</span>
      </div>
      <p className="text-text font-display font-semibold text-body-sm">{value}</p>
    </div>
  )
}
