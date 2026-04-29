import { useEffect, useRef } from 'react'
import { TRAIL_LIFETIME, FLASH_DURATION, type FlashPoint, type TrailPoint } from '../hooks/useLaserPointer'

const MAX_TRAIL_POINTS = 150
const LINGER_THRESHOLD = 300

interface RemoteLaserPointerProps {
  active: boolean
  normX: number | null
  normY: number | null
  cursorTs: number | null
  cursorClickTs: number | null
}

/**
 * Read-only mirror of the presenter's laser pointer for follower viewers.
 * Visuals match LaserPointer.tsx 1:1 (same red, same trail+flash easing) so the
 * dot reads as "the presenter's pointer" no matter who is watching.
 */
export default function RemoteLaserPointer({
  active,
  normX,
  normY,
  cursorTs,
  cursorClickTs,
}: RemoteLaserPointerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const trailRef = useRef<TrailPoint[]>([])
  const flashRef = useRef<FlashPoint[]>([])
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const lastClickTsRef = useRef<number | null>(null)
  const lingerStartRef = useRef<number | null>(null)
  const reducedMotionRef = useRef(false)

  // Detect reduced-motion once; the user can refresh if they change OS settings
  // mid-session, which matches every other prefers-reduced-motion gate in this
  // app.
  useEffect(() => {
    if (typeof window === 'undefined') return
    reducedMotionRef.current = window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .matches
  }, [])

  // Translate normalized cursor updates into the same trail/cursor buffers the
  // local LaserPointer uses, scaled into the viewer's stage box.
  useEffect(() => {
    if (!active || normX === null || normY === null) {
      cursorPosRef.current = null
      lingerStartRef.current = null
      return
    }

    const canvas = canvasRef.current
    const stage = canvas?.parentElement
    if (!stage) return

    const rect = stage.getBoundingClientRect()
    const localX = normX * rect.width
    const localY = normY * rect.height

    cursorPosRef.current = { x: localX, y: localY }

    const ts = cursorTs ?? Date.now()
    if (lastTsRef.current !== ts) {
      lastTsRef.current = ts
      lingerStartRef.current = performance.now()
      if (!reducedMotionRef.current) {
        const now = performance.now()
        const trail = trailRef.current
        trail.push({ x: localX, y: localY, timestamp: now })
        if (trail.length > MAX_TRAIL_POINTS) trail.shift()
      }
    }
  }, [active, normX, normY, cursorTs])

  // Click flash on cursorClickTs change.
  useEffect(() => {
    if (!active) return
    if (cursorClickTs === null || cursorClickTs === lastClickTsRef.current) return
    lastClickTsRef.current = cursorClickTs

    if (reducedMotionRef.current) return
    const pos = cursorPosRef.current
    if (!pos) return
    flashRef.current.push({ x: pos.x, y: pos.y, timestamp: performance.now() })
  }, [active, cursorClickTs])

  // Render loop — same draw routine as LaserPointer with one branch for
  // reduced-motion (static dot only).
  useEffect(() => {
    if (!active) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      trailRef.current = []
      flashRef.current = []
      lastTsRef.current = null
      lastClickTsRef.current = null
      lingerStartRef.current = null
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = reducedMotionRef.current

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      const now = performance.now()
      ctx.clearRect(0, 0, width, height)

      if (!reduced) {
        // Trail
        const trail = trailRef.current
        while (trail.length > 0 && now - trail[0].timestamp > TRAIL_LIFETIME) {
          trail.shift()
        }
        if (trail.length > 1) {
          ctx.save()
          ctx.globalCompositeOperation = 'lighter'
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          for (let i = 1; i < trail.length; i++) {
            const prev = trail[i - 1]
            const curr = trail[i]
            const age = now - curr.timestamp
            const t = Math.min(age / TRAIL_LIFETIME, 1)
            if (t >= 1) continue

            const lineWidth = 4 - 3 * t
            const hue = t * 30
            const lightness = 60 - t * 10
            const opacity = Math.pow(1 - t, 2)

            ctx.beginPath()
            ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${opacity})`
            ctx.lineWidth = lineWidth
            ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, ${opacity * 0.5})`
            ctx.shadowBlur = 8
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(curr.x, curr.y)
            ctx.stroke()
          }
          ctx.restore()
        }
      }

      const cursorPos = cursorPosRef.current
      if (cursorPos) {
        ctx.save()
        ctx.shadowColor = 'rgba(255, 50, 50, 0.8)'
        ctx.shadowBlur = 20

        const gradient = ctx.createRadialGradient(
          cursorPos.x, cursorPos.y, 0,
          cursorPos.x, cursorPos.y, 6,
        )
        gradient.addColorStop(0, 'rgba(255, 200, 200, 1)')
        gradient.addColorStop(0.4, 'rgba(255, 80, 80, 1)')
        gradient.addColorStop(1, 'rgba(255, 80, 80, 0)')

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(cursorPos.x, cursorPos.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        if (!reduced && lingerStartRef.current !== null && now - lingerStartRef.current > LINGER_THRESHOLD) {
          ctx.save()
          const pulse = Math.sin(now * 0.004)
          const radius = 20 + 5 * pulse
          const ringOpacity = 0.15 + 0.1 * pulse

          ctx.beginPath()
          ctx.strokeStyle = `rgba(255, 100, 80, ${ringOpacity})`
          ctx.lineWidth = 2
          ctx.shadowColor = `rgba(255, 100, 80, ${ringOpacity})`
          ctx.shadowBlur = 30
          ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      }

      if (!reduced) {
        const flash = flashRef.current
        flashRef.current = flash.filter((fp) => now - fp.timestamp < FLASH_DURATION)
        if (flashRef.current.length > 0) {
          ctx.save()
          ctx.globalCompositeOperation = 'lighter'

          for (const fp of flashRef.current) {
            const age = now - fp.timestamp
            const t = Math.min(age / FLASH_DURATION, 1)
            if (t >= 1) continue

            const eased = 1 - Math.pow(1 - t, 3)
            const radius = eased * 60
            const opacity = 1 - eased

            const fg = ctx.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, radius)
            fg.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
            fg.addColorStop(0.4, `rgba(255, 120, 80, ${opacity * 0.6})`)
            fg.addColorStop(1, `rgba(255, 50, 50, 0)`)

            ctx.beginPath()
            ctx.fillStyle = fg
            ctx.arc(fp.x, fp.y, radius, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    />
  )
}
