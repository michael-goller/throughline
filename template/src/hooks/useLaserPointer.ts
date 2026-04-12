import { useState, useRef, useCallback, useEffect } from 'react'

// --- Constants ---
export const TRAIL_LIFETIME = 2000   // ms — how long trail points live
const LINGER_THRESHOLD = 300         // ms — when breathing pulse starts
export const FLASH_DURATION = 400    // ms — click burst lifetime
const MAX_TRAIL_POINTS = 150         // ring buffer capacity

// --- Types ---
export interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

export interface FlashPoint {
  x: number
  y: number
  timestamp: number
}

export interface LaserPointerState {
  active: boolean
  trail: TrailPoint[]
  isLingering: boolean
  flashPoints: FlashPoint[]
  cursorPos: { x: number; y: number } | null
}

// Track mouse position globally so we always know where the cursor is
const lastMousePos = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    lastMousePos.x = e.clientX
    lastMousePos.y = e.clientY
  }, { passive: true })
}

export function useLaserPointer() {
  const [active, setActive] = useState(false)
  const trailRef = useRef<TrailPoint[]>([])
  const flashPointsRef = useRef<FlashPoint[]>([])
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null)
  const isLingeringRef = useRef(false)
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activate = useCallback(() => {
    trailRef.current = []
    flashPointsRef.current = []
    // Seed cursor position and flash from last known mouse position
    cursorPosRef.current = { x: lastMousePos.x, y: lastMousePos.y }
    flashPointsRef.current.push({
      x: lastMousePos.x,
      y: lastMousePos.y,
      timestamp: performance.now(),
    })
    isLingeringRef.current = false
    setActive(true)
  }, [])

  const deactivate = useCallback(() => {
    setActive(false)
    if (lingerTimerRef.current) {
      clearTimeout(lingerTimerRef.current)
      lingerTimerRef.current = null
    }
  }, [])

  const onMouseMove = useCallback((x: number, y: number) => {
    const now = performance.now()
    cursorPosRef.current = { x, y }

    // Push to ring buffer
    const trail = trailRef.current
    trail.push({ x, y, timestamp: now })
    if (trail.length > MAX_TRAIL_POINTS) {
      trail.shift()
    }

    // Reset linger timer
    isLingeringRef.current = false
    if (lingerTimerRef.current) {
      clearTimeout(lingerTimerRef.current)
    }
    lingerTimerRef.current = setTimeout(() => {
      isLingeringRef.current = true
    }, LINGER_THRESHOLD)
  }, [])

  const onClick = useCallback((x: number, y: number) => {
    flashPointsRef.current.push({
      x,
      y,
      timestamp: performance.now(),
    })
  }, [])

  // Get active trail points (prune expired)
  const getTrailPoints = useCallback((): TrailPoint[] => {
    const now = performance.now()
    const trail = trailRef.current
    // Remove expired points from the front
    while (trail.length > 0 && now - trail[0].timestamp > TRAIL_LIFETIME) {
      trail.shift()
    }
    return trail
  }, [])

  // Get active flash points (prune expired)
  const getFlashPoints = useCallback((): FlashPoint[] => {
    const now = performance.now()
    flashPointsRef.current = flashPointsRef.current.filter(
      (fp) => now - fp.timestamp < FLASH_DURATION
    )
    return flashPointsRef.current
  }, [])

  const getIsLingering = useCallback(() => isLingeringRef.current, [])
  const getCursorPos = useCallback(() => cursorPosRef.current, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lingerTimerRef.current) {
        clearTimeout(lingerTimerRef.current)
      }
    }
  }, [])

  return {
    active,
    activate,
    deactivate,
    onMouseMove,
    onClick,
    getTrailPoints,
    getFlashPoints,
    getIsLingering,
    getCursorPos,
  }
}
