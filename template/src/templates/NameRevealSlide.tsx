import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import type { NameRevealSlideConfig } from '../types'
import { ClassificationMark, RoundedTriangle, NeuralNetwork } from '../components'

// ─── Particle system ──────────────────────────────────────────────────

interface Particle {
  // Source position (old text)
  sx: number
  sy: number
  // Scattered position (random)
  mx: number
  my: number
  // Target position (new text)
  tx: number
  ty: number
  // Current position
  x: number
  y: number
  // Visual
  size: number
  alpha: number
  color: string
  // Animation
  delay: number
  speed: number
}

function sampleTextPixels(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  fontSize: number,
  gap: number,
): { x: number; y: number }[] {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${fontSize}px Outfit, system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Handle multi-word text that might need wrapping
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > canvasWidth * 0.85 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const lineHeight = fontSize * 1.15
  const totalHeight = lines.length * lineHeight
  const startY = (canvasHeight - totalHeight) / 2 + lineHeight / 2

  lines.forEach((line, i) => {
    ctx.fillText(line, canvasWidth / 2, startY + i * lineHeight)
  })

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const pixels: { x: number; y: number }[] = []

  for (let y = 0; y < canvasHeight; y += gap) {
    for (let x = 0; x < canvasWidth; x += gap) {
      const i = (y * canvasWidth + x) * 4
      if (imageData.data[i + 3] > 128) {
        pixels.push({ x, y })
      }
    }
  }

  return pixels
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// ─── Component ────────────────────────────────────────────────────────

interface Props {
  slide: NameRevealSlideConfig
}

export default function NameRevealSlide({ slide }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const phaseRef = useRef<'show' | 'dissolve' | 'pause' | 'assemble' | 'done'>('show')
  const phaseStartRef = useRef<number>(0)
  const [textPhase, setTextPhase] = useState<'hidden' | 'visible'>('hidden')
  const subtitleControls = useAnimationControls()
  const taglineControls = useAnimationControls()

  const fromText = slide.fromText || 'Digital Hardware Innovation Team'
  const toText = slide.toText || 'Digital Solutions'

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvas.width = width * dpr
    canvas.height = height * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    // Determine font size and pixel gap based on canvas size
    const fromFontSize = Math.min(width * 0.06, 56)
    const toFontSize = Math.min(width * 0.1, 80)
    const gap = Math.max(3, Math.floor(width / 350))

    // Sample pixels from both texts
    const fromPixels = sampleTextPixels(ctx, fromText, width, height, fromFontSize, gap)
    const toPixels = sampleTextPixels(ctx, toText, width, height, toFontSize, gap)

    // Create particles — use the larger set as the count
    const count = Math.max(fromPixels.length, toPixels.length)
    const particles: Particle[] = []

    for (let i = 0; i < count; i++) {
      // Source: cycle through from pixels
      const src = fromPixels[i % fromPixels.length] || { x: width / 2, y: height / 2 }
      // Target: cycle through to pixels
      const tgt = toPixels[i % toPixels.length] || { x: width / 2, y: height / 2 }

      // Scattered position: explode outward from center with some randomness
      const angle = Math.random() * Math.PI * 2
      const dist = 150 + Math.random() * Math.max(width, height) * 0.5
      const mx = width / 2 + Math.cos(angle) * dist
      const my = height / 2 + Math.sin(angle) * dist * 0.7

      particles.push({
        sx: src.x,
        sy: src.y,
        mx,
        my,
        tx: tgt.x,
        ty: tgt.y,
        x: src.x,
        y: src.y,
        size: gap * 0.8 + Math.random() * gap * 0.4,
        alpha: 1,
        color: `hsl(${350 + Math.random() * 20}, ${70 + Math.random() * 30}%, ${80 + Math.random() * 20}%)`,
        delay: Math.random() * 0.3,
        speed: 0.8 + Math.random() * 0.4,
      })
    }

    particlesRef.current = particles
    phaseRef.current = 'show'
    phaseStartRef.current = performance.now()
  }, [fromText, toText])

  useEffect(() => {
    initParticles()

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width / dpr
    const height = canvas.height / dpr

    // Phase durations in ms
    const SHOW_DURATION = 2000
    const DISSOLVE_DURATION = 1800
    const PAUSE_DURATION = 500
    const ASSEMBLE_DURATION = 2000

    const animate = (now: number) => {
      const elapsed = now - phaseStartRef.current
      const particles = particlesRef.current
      const phase = phaseRef.current

      ctx.clearRect(0, 0, width, height)

      // Phase transitions
      if (phase === 'show' && elapsed > SHOW_DURATION) {
        phaseRef.current = 'dissolve'
        phaseStartRef.current = now
      } else if (phase === 'dissolve' && elapsed > DISSOLVE_DURATION) {
        phaseRef.current = 'pause'
        phaseStartRef.current = now
      } else if (phase === 'pause' && elapsed > PAUSE_DURATION) {
        phaseRef.current = 'assemble'
        phaseStartRef.current = now
      } else if (phase === 'assemble' && elapsed > ASSEMBLE_DURATION + 400) {
        phaseRef.current = 'done'
        phaseStartRef.current = now
        setTextPhase('visible')
        subtitleControls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: 0.2 },
        })
        taglineControls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: 0.5 },
        })
      }

      const currentPhase = phaseRef.current
      const phaseElapsed = now - phaseStartRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const pDelay = p.delay * 1000 // Convert to ms

        if (currentPhase === 'show') {
          // Particles sit at their source positions
          p.x = p.sx
          p.y = p.sy
          p.alpha = 1
        } else if (currentPhase === 'dissolve') {
          const t = Math.max(0, Math.min(1, ((phaseElapsed - pDelay) / (DISSOLVE_DURATION - 300)) * p.speed))
          const ease = easeInOutCubic(t)
          p.x = p.sx + (p.mx - p.sx) * ease
          p.y = p.sy + (p.my - p.sy) * ease
          p.alpha = 1 - ease * 0.6 // Fade to 40% opacity
        } else if (currentPhase === 'pause') {
          // Particles float at scattered positions with slight drift
          p.x = p.mx + Math.sin(now * 0.002 + i) * 2
          p.y = p.my + Math.cos(now * 0.002 + i * 0.7) * 2
          p.alpha = 0.4
        } else if (currentPhase === 'assemble') {
          const t = Math.max(0, Math.min(1, ((phaseElapsed - pDelay) / (ASSEMBLE_DURATION - 300)) * p.speed))
          const ease = easeOutQuart(t)
          p.x = p.mx + (p.tx - p.mx) * ease
          p.y = p.my + (p.ty - p.my) * ease
          p.alpha = 0.4 + ease * 0.6 // Fade back to full
        } else if (currentPhase === 'done') {
          // Final position with gentle pulse
          p.x = p.tx
          p.y = p.ty
          const fadeOut = Math.max(0, 1 - phaseElapsed / 800)
          p.alpha = fadeOut
        }

        // Draw particle
        if (p.alpha > 0.01) {
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [initParticles, subtitleControls, taglineControls])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      initParticles()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initParticles])

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Red gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E31937 0%, #B31329 50%, #731C3F 100%)',
        }}
      />

      {/* Neural network animation layer */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-50">
        <NeuralNetwork
          nodeCount={60}
          baseColor="rgba(255, 255, 255, 0.1)"
          glowColor="rgba(255, 200, 200, 0.6)"
          fireRate={80}
          connectionDistance={180}
        />
      </div>

      {/* Decorative rounded triangle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] aspect-video translate-x-[3%]">
          <RoundedTriangle rotation={120} fill="rgba(0,0,0,0.10)" />
        </div>
      </div>

      {/* Particle canvas — covers the text area */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{ pointerEvents: 'none' }}
      />

      {/* Final text (fades in after particles settle) */}
      <div className="relative z-20 text-center px-16 max-w-[1100px]">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: textPhase === 'visible' ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="text-h1 md:text-hero font-bold text-white leading-tight mb-10"
          style={{
            textShadow: textPhase === 'visible'
              ? '0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.2)'
              : 'none',
          }}
        >
          {toText}
        </motion.h1>

        {slide.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={subtitleControls}
            className="text-h2 md:text-h1 text-white/90 font-semibold mb-12"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {slide.tagline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={taglineControls}
            className="text-h3 md:text-h2 text-white/70 font-normal"
          >
            {slide.tagline}
          </motion.p>
        )}
      </div>

      {/* Classification mark */}
      <ClassificationMark className="text-white/50" />
    </div>
  )
}
