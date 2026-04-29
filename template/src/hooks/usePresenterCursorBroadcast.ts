import { useCallback, useEffect, useRef } from 'react'
import { tx } from '@instantdb/react'
import { db } from '../lib/instantdb'

const MOVE_THROTTLE_MS = 33 // ~30Hz

interface UsePresenterCursorBroadcastResult {
  reportMove: (normX: number, normY: number) => void
  reportClick: (normX: number, normY: number) => void
}

/**
 * Mirrors the presenter's laser-pointer cursor onto the same `presenterSessions`
 * row that `usePresenterBroadcast` already maintains. Followers pick the cursor
 * up via `useFollowPresenter` (no second subscription needed).
 *
 * Gated on `enabled` (= isLive && laserActive) at the call site. When `enabled`
 * flips false we send a single `cursorActive: false` write so the follower's
 * RemoteLaserPointer hides without waiting for a stale-session sweep.
 */
export function usePresenterCursorBroadcast(
  sessionId: string,
  enabled: boolean,
): UsePresenterCursorBroadcastResult {
  const lastSendRef = useRef(0)
  const pendingRef = useRef<{ x: number; y: number } | null>(null)
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const writeMove = useCallback(
    (x: number, y: number) => {
      if (!db) return
      const now = Date.now()
      lastSendRef.current = now
      pendingRef.current = null
      db.transact(
        tx.presenterSessions[sessionId].update({
          cursorActive: true,
          cursorX: x,
          cursorY: y,
          cursorTs: now,
        }),
      )
    },
    [sessionId],
  )

  const reportMove = useCallback(
    (normX: number, normY: number) => {
      if (!enabledRef.current || !db) return

      const now = Date.now()
      const elapsed = now - lastSendRef.current

      if (elapsed >= MOVE_THROTTLE_MS) {
        if (trailingTimerRef.current) {
          clearTimeout(trailingTimerRef.current)
          trailingTimerRef.current = null
        }
        writeMove(normX, normY)
        return
      }

      // Coalesce: keep the latest position and schedule a trailing-edge write.
      pendingRef.current = { x: normX, y: normY }
      if (trailingTimerRef.current) return

      trailingTimerRef.current = setTimeout(() => {
        trailingTimerRef.current = null
        const pending = pendingRef.current
        if (!pending || !enabledRef.current) {
          pendingRef.current = null
          return
        }
        writeMove(pending.x, pending.y)
      }, MOVE_THROTTLE_MS - elapsed)
    },
    [writeMove],
  )

  const reportClick = useCallback(
    (normX: number, normY: number) => {
      if (!enabledRef.current || !db) return
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current)
        trailingTimerRef.current = null
      }
      pendingRef.current = null
      const now = Date.now()
      lastSendRef.current = now
      db.transact(
        tx.presenterSessions[sessionId].update({
          cursorActive: true,
          cursorX: normX,
          cursorY: normY,
          cursorTs: now,
          cursorClickTs: now,
        }),
      )
    },
    [sessionId],
  )

  // When broadcast or laser switches off, send a single deactivation write so
  // followers hide the remote cursor without waiting for the next move.
  useEffect(() => {
    if (enabled || !db) return
    if (trailingTimerRef.current) {
      clearTimeout(trailingTimerRef.current)
      trailingTimerRef.current = null
    }
    pendingRef.current = null
    db.transact(
      tx.presenterSessions[sessionId].update({
        cursorActive: false,
      }),
    )
  }, [enabled, sessionId])

  useEffect(() => {
    return () => {
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current)
        trailingTimerRef.current = null
      }
    }
  }, [])

  return { reportMove, reportClick }
}
