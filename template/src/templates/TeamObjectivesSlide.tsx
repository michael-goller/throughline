import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { TeamObjectivesSlideConfig } from '../types'
import { ClassificationMark } from '../components'

// ─── Bezier helpers ─────────────────────────────────────────────────

interface BezierPath {
  x0: number; y0: number
  x1: number; y1: number
  x2: number; y2: number
  x3: number; y3: number
}

function bezierPoint(t: number, p: BezierPath) {
  const u = 1 - t
  return {
    x: u * u * u * p.x0 + 3 * u * u * t * p.x1 + 3 * u * t * t * p.x2 + t * t * t * p.x3,
    y: u * u * u * p.y0 + 3 * u * u * t * p.y1 + 3 * u * t * t * p.y2 + t * t * t * p.y3,
  }
}

// ─── Particle system ────────────────────────────────────────────────

interface FlowParticle {
  pathIdx: number
  t: number
  speed: number
  size: number
  maxAlpha: number
  isPrimary: boolean
}

// ─── Component ──────────────────────────────────────────────────────

interface Props {
  slide: TeamObjectivesSlideConfig
}

export default function TeamObjectivesSlide({ slide }: Props) {
  const { teamName, teamIcon: TeamIcon, subtitle, objectives } = slide

  const diagramRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const teamRef = useRef<HTMLDivElement>(null)
  const objectivesRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const pathsRef = useRef<BezierPath[]>([])
  const isPrimaryRef = useRef<boolean[]>([])
  const particlesRef = useRef<FlowParticle[]>([])
  const readyRef = useRef(false)

  const measure = useCallback(() => {
    const diagram = diagramRef.current
    const canvas = canvasRef.current
    const teamEl = teamRef.current
    const objectivesEl = objectivesRef.current
    if (!diagram || !canvas || !teamEl || !objectivesEl) return

    const dpr = window.devicePixelRatio || 1
    const rect = diagram.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const teamRect = teamEl.getBoundingClientRect()
    const teamRightX = teamRect.right - rect.left
    const teamCenterY = teamRect.top - rect.top + teamRect.height / 2

    const cards = objectivesEl.querySelectorAll('[data-obj-card]')
    const paths: BezierPath[] = []
    const isPrimary: boolean[] = []

    cards.forEach((card, i) => {
      const cardRect = card.getBoundingClientRect()
      const toX = cardRect.left - rect.left - 4
      const toY = cardRect.top - rect.top + cardRect.height / 2
      const dx = toX - teamRightX

      paths.push({
        x0: teamRightX, y0: teamCenterY,
        x1: teamRightX + dx * 0.4, y1: teamCenterY,
        x2: teamRightX + dx * 0.6, y2: toY,
        x3: toX, y3: toY,
      })
      isPrimary.push(objectives[i]?.primary ?? false)
    })

    pathsRef.current = paths
    isPrimaryRef.current = isPrimary
    readyRef.current = true
  }, [objectives])

  // Measure after cards animate in
  useEffect(() => {
    const timer = setTimeout(measure, 800)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1

    let lastSpawn = 0
    const SPAWN_INTERVAL = 300

    const animate = (now: number) => {
      const paths = pathsRef.current
      const isPrimary = isPrimaryRef.current

      const width = canvas.width / dpr
      const height = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      if (!readyRef.current || paths.length === 0) {
        animRef.current = requestAnimationFrame(animate)
        return
      }

      // Draw connection curves
      for (let i = 0; i < paths.length; i++) {
        const p = paths[i]
        ctx.beginPath()
        ctx.moveTo(p.x0, p.y0)
        ctx.bezierCurveTo(p.x1, p.y1, p.x2, p.y2, p.x3, p.y3)
        ctx.strokeStyle = isPrimary[i]
          ? 'rgba(227,25,55,0.35)'
          : 'rgba(150,150,150,0.25)'
        ctx.lineWidth = isPrimary[i] ? 2.5 : 1.5
        ctx.stroke()
      }

      // Spawn particles
      if (now - lastSpawn > SPAWN_INTERVAL) {
        lastSpawn = now
        for (let i = 0; i < paths.length; i++) {
          if (!isPrimary[i] && Math.random() > 0.6) continue
          particlesRef.current.push({
            pathIdx: i,
            t: 0,
            speed: 0.002 + Math.random() * 0.001,
            size: isPrimary[i] ? 1.5 + Math.random() * 0.8 : 1 + Math.random() * 0.5,
            maxAlpha: isPrimary[i] ? 0.85 : 0.7,
            isPrimary: isPrimary[i],
          })
        }
      }

      // Draw particles
      const alive: FlowParticle[] = []
      for (const particle of particlesRef.current) {
        particle.t += particle.speed
        if (particle.t > 1) continue

        const path = paths[particle.pathIdx]
        if (!path) continue

        const pos = bezierPoint(particle.t, path)

        let alpha = particle.maxAlpha
        if (particle.t < 0.1) alpha *= particle.t / 0.1
        if (particle.t > 0.7) alpha *= (1 - particle.t) / 0.3

        const size = particle.size * (particle.t > 0.8 ? (1 - particle.t) / 0.2 : 1)

        ctx.globalAlpha = alpha
        ctx.shadowColor = particle.isPrimary
          ? 'rgba(227,25,55,0.7)'
          : 'rgba(160,180,220,0.5)'
        ctx.shadowBlur = particle.isPrimary ? 5 : 3
        ctx.fillStyle = particle.isPrimary
          ? 'rgba(227,25,55,1)'
          : 'rgba(170,180,210,1)'
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, Math.max(0.5, size), 0, Math.PI * 2)
        ctx.fill()

        alive.push(particle)
      }
      particlesRef.current = alive

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* Red accent bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
      />

      <div className="relative z-10 px-16 w-full max-w-[1200px]">
        {/* Diagram */}
        <div ref={diagramRef} className="relative flex items-stretch">
          {/* Canvas for bezier curves + particles */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 pointer-events-none"
          />

          {/* Left: team card */}
          <div className="w-[30%] flex items-center relative z-20">
            <motion.div
              ref={teamRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full p-8 rounded-2xl bg-brand-red text-white text-center shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <TeamIcon className="w-9 h-9" />
              </div>
              <h3 className="text-h2 font-bold leading-tight">{teamName}</h3>
              {subtitle && (
                <p className="text-body-sm text-white/70 mt-2">{subtitle}</p>
              )}
            </motion.div>
          </div>

          {/* Spacer for connection area */}
          <div className="w-[10%]" />

          {/* Right: objective cards */}
          <div ref={objectivesRef} className="flex flex-col gap-3 w-[60%] relative z-20">
            {objectives.map((obj, i) => {
              const ObjIcon = obj.icon
              return (
                <motion.div
                  key={obj.objective}
                  data-obj-card
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className={`rounded-lg border px-5 py-3 ${
                    obj.primary
                      ? 'border-l-[3px] border-l-brand-red border-t border-r border-b border-t-border border-r-border border-b-border bg-brand-red/5'
                      : 'border-border bg-background-elevated'
                  }`}
                >
                  {/* Objective header */}
                  <div className="flex items-center gap-2 mb-2">
                    <ObjIcon className={`w-4 h-4 shrink-0 ${obj.primary ? 'text-brand-red' : 'text-text-muted'}`} />
                    <span className={`text-body-sm font-bold ${obj.primary ? 'text-brand-red' : 'text-text'}`}>
                      {obj.objective}
                    </span>
                    {obj.primary && (
                      <span className="text-tiny text-brand-red font-bold uppercase tracking-wide ml-auto shrink-0">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* KR list */}
                  <div className="flex flex-col gap-1.5">
                    {obj.keyResults.map((kr) => (
                      <div key={kr.title} className="pl-6">
                        <span className="text-tiny font-semibold text-text">{kr.title}</span>
                        <span className="text-tiny text-text-muted ml-1">— {kr.description}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <ClassificationMark />
    </div>
  )
}
