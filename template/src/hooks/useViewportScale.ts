import { useState, useEffect, useCallback } from 'react'

/** Design dimensions for slide content (16:9 aspect ratio) */
const DESIGN_WIDTH = 1280
const DESIGN_HEIGHT = 720

/** Breakpoint below which we apply viewport scaling */
const MOBILE_BREAKPOINT = 1024

export interface ViewportScaleState {
  /** Scale factor to apply (1 on desktop, < 1 on mobile/tablet) */
  scale: number
  /** Whether the viewport is below the mobile breakpoint */
  isMobile: boolean
  /** Actual viewport width */
  viewportWidth: number
  /** Actual viewport height */
  viewportHeight: number
}

/**
 * Calculates a CSS scale factor so that slides designed for desktop
 * (1280×720) fit within the current viewport on mobile and tablet devices.
 *
 * On viewports >= 1024px wide, returns scale = 1 (no scaling).
 * Below that, returns min(vw/1280, vh/720) so the slide fits with
 * correct aspect ratio.
 */
export function useViewportScale(): ViewportScaleState {
  const calculate = useCallback((): ViewportScaleState => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const isMobile = vw < MOBILE_BREAKPOINT

    if (!isMobile) {
      return { scale: 1, isMobile: false, viewportWidth: vw, viewportHeight: vh }
    }

    const scaleX = vw / DESIGN_WIDTH
    const scaleY = vh / DESIGN_HEIGHT
    const scale = Math.min(scaleX, scaleY)

    return { scale, isMobile, viewportWidth: vw, viewportHeight: vh }
  }, [])

  const [state, setState] = useState(calculate)

  useEffect(() => {
    const onResize = () => setState(calculate())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [calculate])

  return state
}
