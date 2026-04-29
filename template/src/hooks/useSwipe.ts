import { useEffect, useRef, useCallback } from 'react'

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

interface UseSwipeOptions {
  /** Minimum horizontal distance (px) to trigger a swipe. Default: 50 */
  threshold?: number
  /** Maximum vertical distance (px) allowed during a swipe. Default: 100 */
  maxVertical?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /**
   * When provided, swipe is wired to this element via a non-passive native
   * listener so `preventDefault()` reliably suppresses page scroll on iOS.
   * Returned React handlers are still produced for callers that prefer JSX
   * binding, but the native path is the recommended one.
   */
  target?: React.RefObject<HTMLElement | null>
}

/**
 * Returns React touch handlers and (when `target` is provided) attaches a
 * native non-passive listener on the element so the same horizontal-swipe
 * detection works without browsers ignoring `preventDefault()`.
 */
export function useSwipe(options: UseSwipeOptions): SwipeHandlers {
  const { threshold = 50, maxVertical = 100, onSwipeLeft, onSwipeRight, target } = options
  const startX = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startX.current = clientX
    startY.current = clientY
    tracking.current = true
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number, preventDefault: () => void) => {
    if (!tracking.current) return
    const dx = Math.abs(clientX - startX.current)
    const dy = Math.abs(clientY - startY.current)
    if (dx > dy && dx > 10) preventDefault()
  }, [])

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!tracking.current) return
    tracking.current = false
    const dx = clientX - startX.current
    const dy = Math.abs(clientY - startY.current)
    if (Math.abs(dx) >= threshold && dy <= maxVertical) {
      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    }
  }, [threshold, maxVertical, onSwipeLeft, onSwipeRight])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }, [handleStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY, () => e.preventDefault())
  }, [handleMove])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    handleEnd(touch.clientX, touch.clientY)
  }, [handleEnd])

  useEffect(() => {
    const node = target?.current
    if (!node) return

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      handleStart(touch.clientX, touch.clientY)
    }
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      handleMove(touch.clientX, touch.clientY, () => e.preventDefault())
    }
    const onEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!touch) return
      handleEnd(touch.clientX, touch.clientY)
    }
    const onCancel = () => { tracking.current = false }

    node.addEventListener('touchstart', onStart, { passive: true })
    node.addEventListener('touchmove', onMove, { passive: false })
    node.addEventListener('touchend', onEnd, { passive: true })
    node.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      node.removeEventListener('touchstart', onStart)
      node.removeEventListener('touchmove', onMove)
      node.removeEventListener('touchend', onEnd)
      node.removeEventListener('touchcancel', onCancel)
    }
  }, [target, handleStart, handleMove, handleEnd])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
