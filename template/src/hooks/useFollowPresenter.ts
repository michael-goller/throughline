import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db, type PresenterSession } from '../lib/instantdb'

const STALE_WARNING_MS = 60_000
const STALE_INACTIVE_MS = 5 * 60_000

interface UseFollowPresenterOptions {
  onFollowSlideChange?: (slideIndex: number) => void
}

interface UseFollowPresenterResult {
  isFollowing: boolean
  didBreakFollow: boolean
  presenterLive: boolean
  presenterStale: boolean
  presenterSlide: number | null
  activeSession: PresenterSession | null
  startFollowing: () => void
  stopFollowing: () => void
  toggleFollow: () => void
  breakFollow: () => void
  resumeFollow: () => void
}

export function useFollowPresenter(
  deckId: string,
  options: UseFollowPresenterOptions = {}
): UseFollowPresenterResult {
  const { onFollowSlideChange } = options
  const [isFollowing, setIsFollowing] = useState(false)
  const [didBreakFollow, setDidBreakFollow] = useState(false)
  const [now, setNow] = useState(Date.now())

  const onFollowSlideChangeRef = useRef(onFollowSlideChange)
  useEffect(() => {
    onFollowSlideChangeRef.current = onFollowSlideChange
  }, [onFollowSlideChange])

  const query = db?.useQuery({
    presenterSessions: {
      $: {
        where: { deckId, isLive: true },
      },
    },
  })

  const sessions = (query?.data?.presenterSessions ?? []) as PresenterSession[]

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 10_000)
    return () => window.clearInterval(interval)
  }, [])

  const activeSession = useMemo(() => {
    if (sessions.length === 0) return null

    const freshSessions = sessions.filter(
      (session) => now - session.updatedAt < STALE_INACTIVE_MS
    )

    if (freshSessions.length === 0) return null

    return freshSessions.sort((a, b) => {
      const aTime = Math.max(a.startedAt, a.updatedAt)
      const bTime = Math.max(b.startedAt, b.updatedAt)
      return bTime - aTime
    })[0] ?? null
  }, [now, sessions])

  const presenterSlide = activeSession?.currentSlide ?? null
  const presenterLive = !!activeSession
  const presenterStale = !!activeSession && now - activeSession.updatedAt > STALE_WARNING_MS

  const startFollowing = useCallback(() => {
    if (!presenterLive) return

    setIsFollowing(true)
    setDidBreakFollow(false)

    if (presenterSlide !== null) {
      onFollowSlideChangeRef.current?.(presenterSlide)
    }
  }, [presenterLive, presenterSlide])

  const stopFollowing = useCallback(() => {
    setIsFollowing(false)
    setDidBreakFollow(false)
  }, [])

  const breakFollow = useCallback(() => {
    if (!isFollowing) return
    setIsFollowing(false)
    setDidBreakFollow(true)
  }, [isFollowing])

  const resumeFollow = useCallback(() => {
    if (!presenterLive) return
    startFollowing()
  }, [presenterLive, startFollowing])

  const toggleFollow = useCallback(() => {
    if (isFollowing) {
      stopFollowing()
      return
    }

    startFollowing()
  }, [isFollowing, startFollowing, stopFollowing])

  useEffect(() => {
    if (!presenterLive && isFollowing) {
      setIsFollowing(false)
    }
  }, [isFollowing, presenterLive])

  useEffect(() => {
    if (!isFollowing || presenterSlide === null) return
    onFollowSlideChangeRef.current?.(presenterSlide)
  }, [isFollowing, presenterSlide])

  return {
    isFollowing,
    didBreakFollow,
    presenterLive,
    presenterStale,
    presenterSlide,
    activeSession,
    startFollowing,
    stopFollowing,
    toggleFollow,
    breakFollow,
    resumeFollow,
  }
}
