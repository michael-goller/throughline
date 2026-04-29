import { useRef, useEffect } from 'react'
import { useLaserPointer, TRAIL_LIFETIME, FLASH_DURATION } from '../hooks/useLaserPointer'

interface LaserPointerProps {
  active: boolean
  onDeactivate: () => void
  onCursorMove?: (normX: number, normY: number) => void
  onCursorClick?: (normX: number, normY: number) => void
}

export default function LaserPointer({
  active,
  onDeactivate,
  onCursorMove,
  onCursorClick,
}: LaserPointerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const onCursorMoveRef = useRef(onCursorMove)
  const onCursorClickRef = useRef(onCursorClick)
  useEffect(() => {
    onCursorMoveRef.current = onCursorMove
    onCursorClickRef.current = onCursorClick
  }, [onCursorMove, onCursorClick])
  const {
    active: hookActive,
    activate,
    deactivate,
    onMouseMove,
    onClick,
    getTrailPoints,
    getFlashPoints,
    getIsLingering,
    getCursorPos,
  } = useLaserPointer()

  // Sync external active prop with hook state
  useEffect(() => {
    if (active && !hookActive) {
      activate()
    } else if (!active && hookActive) {
      deactivate()
    }
  }, [active, hookActive, activate, deactivate])

  // Document-level mouse listeners (pointer-events: none on canvas)
  useEffect(() => {
    if (!active) return

    const stageBounds = (): { left: number; top: number; width: number; height: number } | null => {
      const stage = canvasRef.current?.parentElement
      if (!stage) return null
      const rect = stage.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    }

    const normalize = (clientX: number, clientY: number): [number, number] | null => {
      const b = stageBounds()
      if (!b) return null
      const nx = Math.min(1, Math.max(0, (clientX - b.left) / b.width))
      const ny = Math.min(1, Math.max(0, (clientY - b.top) / b.height))
      return [nx, ny]
    }

    const handleMouseMove = (e: MouseEvent) => {
      onMouseMove(e.clientX, e.clientY)
      const cb = onCursorMoveRef.current
      if (!cb) return
      const norm = normalize(e.clientX, e.clientY)
      if (norm) cb(norm[0], norm[1])
    }

    const handleClick = (e: MouseEvent) => {
      onClick(e.clientX, e.clientY)
      const cb = onCursorClickRef.current
      if (!cb) return
      const norm = normalize(e.clientX, e.clientY)
      if (norm) cb(norm[0], norm[1])
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick)
    }
  }, [active, onMouseMove, onClick])

  // Hide cursor on root element when active
  useEffect(() => {
    if (!active) return

    const root = document.querySelector('.relative.w-full.h-full') as HTMLElement
    if (root) {
      root.style.cursor = 'none'
    }

    return () => {
      if (root) {
        root.style.cursor = ''
      }
    }
  }, [active])

  // Escape key handler
  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        deactivate()
        onDeactivate()
      }
    }

    // Use capture phase so we intercept Escape before App's handler
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [active, deactivate, onDeactivate])

  // Canvas render loop
  useEffect(() => {
    if (!active) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      // Resize canvas if needed
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      const now = performance.now()

      // 1. Clear
      ctx.clearRect(0, 0, width, height)

      // 2. Trail segments
      const trail = getTrailPoints()
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

          // Width: 4px → 1px
          const lineWidth = 4 - 3 * t

          // Color shift: red (hue 0) → amber (hue 30) as t increases
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

      // 3. Core dot at cursor position
      const cursorPos = getCursorPos()
      if (cursorPos) {
        ctx.save()

        // Outer glow
        ctx.shadowColor = 'rgba(255, 50, 50, 0.8)'
        ctx.shadowBlur = 20

        // Radial gradient for core
        const gradient = ctx.createRadialGradient(
          cursorPos.x, cursorPos.y, 0,
          cursorPos.x, cursorPos.y, 6
        )
        gradient.addColorStop(0, 'rgba(255, 200, 200, 1)')
        gradient.addColorStop(0.4, 'rgba(255, 80, 80, 1)')
        gradient.addColorStop(1, 'rgba(255, 80, 80, 0)')

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(cursorPos.x, cursorPos.y, 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // 4. Linger glow
        if (getIsLingering()) {
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

      // 5. Click flash
      const flashPoints = getFlashPoints()
      if (flashPoints.length > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'

        for (const fp of flashPoints) {
          const age = now - fp.timestamp
          const t = Math.min(age / FLASH_DURATION, 1)

          if (t >= 1) continue

          // Ease-out: fast start, slow finish
          const eased = 1 - Math.pow(1 - t, 3)
          const radius = eased * 60
          const opacity = 1 - eased

          const gradient = ctx.createRadialGradient(
            fp.x, fp.y, 0,
            fp.x, fp.y, radius
          )
          gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
          gradient.addColorStop(0.4, `rgba(255, 120, 80, ${opacity * 0.6})`)
          gradient.addColorStop(1, `rgba(255, 50, 50, 0)`)

          ctx.beginPath()
          ctx.fillStyle = gradient
          ctx.arc(fp.x, fp.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
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
  }, [active, getTrailPoints, getFlashPoints, getIsLingering, getCursorPos])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20"
      style={{ pointerEvents: 'none' }}
    />
  )
}
