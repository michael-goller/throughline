import { useState, useEffect, useRef } from 'react'

interface UseCountUpOptions {
  start?: number
  end: number
  duration?: number
  delay?: number
  easing?: (t: number) => number
}

// Ease out cubic for natural deceleration
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  easing = easeOutCubic,
}: UseCountUpOptions): number {
  const [count, setCount] = useState(start)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp
        }

        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easing(progress)

        const currentValue = start + (end - start) * easedProgress
        setCount(currentValue)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    const timeoutId = setTimeout(startAnimation, delay)

    return () => {
      clearTimeout(timeoutId)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [start, end, duration, delay, easing])

  return count
}

export default useCountUp
