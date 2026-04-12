import { useEffect, useRef } from 'react'
import { recordView } from '../lib/analytics'

/**
 * Tracks a view session for a deck.
 * Records view start on mount and duration on unmount / page hide.
 */
export function useAnalytics(deckId: string, viewer?: string): void {
  const startTime = useRef(Date.now())
  const recorded = useRef(false)

  useEffect(() => {
    startTime.current = Date.now()
    recorded.current = false

    const flush = () => {
      if (recorded.current) return
      recorded.current = true
      const durationSec = Math.round((Date.now() - startTime.current) / 1000)
      recordView({
        deckId,
        viewedAt: new Date(startTime.current).toISOString(),
        durationSec,
        viewer: viewer ?? 'anonymous',
      })
    }

    // Record on page hide (covers tab close, navigation, mobile background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      flush()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [deckId, viewer])
}
