/**
 * Hook for tracking viewer presence via InstantDB
 *
 * NOTE: Disabled - InstantDB rooms API needs proper setup.
 * Returns placeholder values for now.
 */

interface Viewer {
  visitorId: string
  lastSeen: number
  isPresenter: boolean
}

interface UseViewerPresenceResult {
  viewerCount: number
  viewers: Viewer[]
  isConfigured: boolean
}

export function useViewerPresence(_deckId: string, _isPresenter: boolean = false): UseViewerPresenceResult {
  // Disabled for now - returns empty/placeholder values
  return {
    viewerCount: 0,
    viewers: [],
    isConfigured: false,
  }
}
