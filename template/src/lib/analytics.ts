/**
 * Deck analytics — tracks views, duration, and viewer info per deck.
 * Persisted in localStorage (consistent with existing useSlideState pattern).
 *
 * Optional: forwards events to Application Insights if VITE_APPINSIGHTS_KEY is set.
 */

const STORAGE_PREFIX = 'throughline-views-'

export interface ViewEvent {
  deckId: string
  viewedAt: string       // ISO timestamp
  durationSec: number    // 0 if session still open
  viewer?: string        // display name or 'anonymous'
}

export interface DeckViewStats {
  totalViews: number
  lastViewedAt: string | null
  avgDurationSec: number
  viewsByDay: { date: string; count: number }[]
}

/** Record a completed view event */
export function recordView(event: ViewEvent): void {
  const key = STORAGE_PREFIX + event.deckId
  try {
    const raw = localStorage.getItem(key)
    const views: ViewEvent[] = raw ? JSON.parse(raw) : []
    views.push(event)
    // Keep last 500 events per deck to avoid unbounded growth
    if (views.length > 500) views.splice(0, views.length - 500)
    localStorage.setItem(key, JSON.stringify(views))
  } catch {
    // localStorage may be full or disabled — fail silently
  }

  // Forward to Application Insights if configured
  sendToAppInsights('DeckView', {
    deckId: event.deckId,
    durationSec: event.durationSec,
    viewer: event.viewer ?? 'anonymous',
  })
}

/** Get all view events for a deck */
export function getViewEvents(deckId: string): ViewEvent[] {
  const key = STORAGE_PREFIX + deckId
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Aggregate view stats for a deck */
export function getDeckViewStats(deckId: string): DeckViewStats {
  const views = getViewEvents(deckId)

  if (views.length === 0) {
    return { totalViews: 0, lastViewedAt: null, avgDurationSec: 0, viewsByDay: [] }
  }

  // Sort by time
  views.sort((a, b) => a.viewedAt.localeCompare(b.viewedAt))

  const lastViewedAt = views[views.length - 1].viewedAt

  // Average duration (exclude 0-duration views — incomplete sessions)
  const withDuration = views.filter((v) => v.durationSec > 0)
  const avgDurationSec =
    withDuration.length > 0
      ? Math.round(withDuration.reduce((sum, v) => sum + v.durationSec, 0) / withDuration.length)
      : 0

  // Group by day (last 30 days)
  const dayMap = new Map<string, number>()
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dayMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const v of views) {
    const day = v.viewedAt.slice(0, 10)
    if (dayMap.has(day)) {
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
    }
  }
  const viewsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))

  return { totalViews: views.length, lastViewedAt, avgDurationSec, viewsByDay }
}

/** Get summary stats for all decks (used by gallery) */
export function getAllDeckStats(): Map<string, { totalViews: number; lastViewedAt: string | null }> {
  const stats = new Map<string, { totalViews: number; lastViewedAt: string | null }>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(STORAGE_PREFIX)) continue
      const deckId = key.slice(STORAGE_PREFIX.length)
      const views: ViewEvent[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      if (views.length > 0) {
        views.sort((a, b) => a.viewedAt.localeCompare(b.viewedAt))
        stats.set(deckId, {
          totalViews: views.length,
          lastViewedAt: views[views.length - 1].viewedAt,
        })
      }
    }
  } catch {
    // ignore
  }
  return stats
}

// ─── Optional Application Insights ──────────────────────────────────
let appInsightsKey: string | undefined
try {
  appInsightsKey = (import.meta as any).env?.VITE_APPINSIGHTS_KEY as string | undefined
} catch {
  // not in vite context
}

function sendToAppInsights(name: string, properties: Record<string, string | number>): void {
  if (!appInsightsKey) return
  // Use the Application Insights REST ingestion endpoint (lightweight — no SDK needed)
  const payload = [{
    name: `Microsoft.ApplicationInsights.${appInsightsKey}.Event`,
    time: new Date().toISOString(),
    iKey: appInsightsKey,
    data: { baseType: 'EventData', baseData: { name, properties } },
  }]
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    navigator.sendBeacon('https://dc.services.visualstudio.com/v2/track', blob)
  } catch {
    // fire-and-forget
  }
}
