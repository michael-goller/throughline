/**
 * Hook for tracking viewer presence via InstantDB
 */

import { useEffect, useMemo, useState } from 'react'
import { db, isInstantDBConfigured } from '../lib/instantdb'

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

// Generate a unique visitor ID
function getVisitorId(): string {
  const key = 'shine-visitor-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `viewer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(key, id)
  }
  return id
}

export function useViewerPresence(deckId: string, isPresenter: boolean = false): UseViewerPresenceResult {
  const [viewers, setViewers] = useState<Viewer[]>([])
  const visitorId = useMemo(() => getVisitorId(), [])

  useEffect(() => {
    if (!db || !isInstantDBConfigured) return

    const roomId = `deck-${deckId}`

    // Join the room
    const room = db.room('viewers', roomId)

    // Set our presence
    room.publishPresence({
      visitorId,
      isPresenter,
      lastSeen: Date.now(),
    })

    // Update presence periodically
    const interval = setInterval(() => {
      room.publishPresence({
        visitorId,
        isPresenter,
        lastSeen: Date.now(),
      })
    }, 10000) // Every 10 seconds

    // Subscribe to presence
    const unsubscribe = room.subscribePresence((presence) => {
      const peers = Object.values(presence.peers || {}) as Viewer[]
      // Filter out stale viewers (not seen in last 30 seconds)
      const activeViewers = peers.filter(
        (v) => Date.now() - v.lastSeen < 30000
      )
      setViewers(activeViewers)
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [deckId, visitorId, isPresenter])

  const viewerCount = useMemo(() => {
    // Count non-presenter viewers
    return viewers.filter((v) => !v.isPresenter).length
  }, [viewers])

  return {
    viewerCount,
    viewers,
    isConfigured: isInstantDBConfigured,
  }
}
