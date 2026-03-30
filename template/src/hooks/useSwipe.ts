import { useRef, useCallback } from 'react'

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
}

/**
 * Returns touch event handlers that detect horizontal swipe gestures.
 * Attach the returned handlers to the container element.
 */
export function useSwipe(options: UseSwipeOptions): SwipeHandlers {
  const { threshold = 50, maxVertical = 100, onSwipeLeft, onSwipeRight } = options
  const startX = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    tracking.current = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current) return
    // Optionally prevent vertical scroll while swiping horizontally
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - startX.current)
    const dy = Math.abs(touch.clientY - startY.current)
    if (dx > dy && dx > 10) {
      e.preventDefault()
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!tracking.current) return
    tracking.current = false

    const touch = e.changedTouches[0]
    const dx = touch.clientX - startX.current
    const dy = Math.abs(touch.clientY - startY.current)

    if (Math.abs(dx) >= threshold && dy <= maxVertical) {
      if (dx < 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }
  }, [threshold, maxVertical, onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
