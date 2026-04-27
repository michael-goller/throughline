import { useCallback, useEffect, useRef, useState } from 'react'
import { id, tx } from '@instantdb/react'
import { db } from '../lib/instantdb'

const HEARTBEAT_INTERVAL_MS = 30_000

function getOrCreatePresenterId(): string {
  const key = 'throughline.presenterId'
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const generated = `presenter-${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(key, generated)
  return generated
}

interface UsePresenterBroadcastResult {
  sessionId: string
  isLive: boolean
  startBroadcast: () => void
  stopBroadcast: () => void
  toggleBroadcast: () => void
}

export function usePresenterBroadcast(
  deckId: string,
  currentSlide: number,
  totalSlides: number
): UsePresenterBroadcastResult {
  const [isLive, setIsLive] = useState(false)
  const presenterIdRef = useRef<string>(getOrCreatePresenterId())
  const sessionIdRef = useRef<string>(id())
  const startedAtRef = useRef<number | null>(null)
  const liveRef = useRef(false)
  const currentSlideRef = useRef(currentSlide)
  const totalSlidesRef = useRef(totalSlides)

  const sessionId = sessionIdRef.current

  const writeSession = useCallback((live: boolean) => {
    if (!db) return

    const now = Date.now()
    const startedAt = startedAtRef.current ?? now

    db.transact(
      tx.presenterSessions[sessionId].update({
        deckId,
        presenterId: presenterIdRef.current,
        currentSlide: currentSlideRef.current,
        totalSlides: totalSlidesRef.current,
        isLive: live,
        startedAt,
        updatedAt: now,
      })
    )
  }, [deckId, sessionId])

  useEffect(() => {
    liveRef.current = isLive
  }, [isLive])

  useEffect(() => {
    currentSlideRef.current = currentSlide
    totalSlidesRef.current = totalSlides
  }, [currentSlide, totalSlides])

  const startBroadcast = useCallback(() => {
    if (!db) return

    if (!startedAtRef.current) {
      startedAtRef.current = Date.now()
    }

    setIsLive(true)
    writeSession(true)
  }, [writeSession])

  const stopBroadcast = useCallback(() => {
    if (!db) {
      setIsLive(false)
      return
    }

    setIsLive(false)
    writeSession(false)
    startedAtRef.current = null
  }, [writeSession])

  const toggleBroadcast = useCallback(() => {
    if (liveRef.current) {
      stopBroadcast()
      return
    }

    startBroadcast()
  }, [startBroadcast, stopBroadcast])

  useEffect(() => {
    if (!isLive || !db) return
    writeSession(true)
  }, [currentSlide, totalSlides, isLive, writeSession])

  useEffect(() => {
    if (!isLive || !db) return

    const interval = window.setInterval(() => {
      writeSession(true)
    }, HEARTBEAT_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [isLive, writeSession])

  useEffect(() => {
    if (!db) return

    const handleBeforeUnload = () => {
      if (!liveRef.current) return
      writeSession(false)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (liveRef.current) {
        writeSession(false)
      }
    }
  }, [writeSession])

  return {
    sessionId,
    isLive,
    startBroadcast,
    stopBroadcast,
    toggleBroadcast,
  }
}
