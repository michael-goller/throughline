import { useEffect, useRef, useState } from 'react'

interface LayerNode {
  baseX: number
  baseY: number
  x: number
  y: number
  radius: number
  phase: number
  layer: number
  glowIntensity: number
}

interface Edge {
  source: number
  target: number
}

interface Signal {
  edge: number
  progress: number
  speed: number
  opacity: number
}

interface Props {
  /** Number of nodes */
  nodeCount?: number
  /** Base color for nodes and connections (CSS color) */
  baseColor?: string
  /** Glow color when firing (CSS color) */
  glowColor?: string
  /** How often nodes fire (lower = more frequent) */
  fireRate?: number
  /** Max distance for connections (higher = more connections) */
  connectionDistance?: number
  /** Additional CSS classes */
  className?: string
}

function parseRGBA(color: string): [number, number, number, number] {
  const m = color.match(/[\d.]+/g)
  return m ? [+m[0], +m[1], +m[2], +m[3]] : [255, 255, 255, 0.5]
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`
}

function getPointOnQuadratic(
  t: number,
  p0: [number, number],
  cp: [number, number],
  p1: [number, number]
): [number, number] {
  const inv = 1 - t
  return [
    inv * inv * p0[0] + 2 * inv * t * cp[0] + t * t * p1[0],
    inv * inv * p0[1] + 2 * inv * t * cp[1] + t * t * p1[1],
  ]
}

/**
 * Animated neural network background — layered flow visualization.
 *
 * Renders 4 vertical layers of nodes with data pulses cascading
 * left→right along Bezier edges.
 */
export default function NeuralNetwork({
  nodeCount = 40,
  baseColor = 'rgba(255, 255, 255, 0.15)',
  glowColor = 'rgba(227, 25, 55, 0.6)',
  fireRate = 150,
  connectionDistance: _connectionDistance,
  className = '',
}: Props) {
  void _connectionDistance

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<LayerNode[]>([])
  const edgesRef = useRef<Edge[]>([])
  const signalsRef = useRef<Signal[]>([])
  const frameRef = useRef(0)
  const timeRef = useRef(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Layer x-positions as fractions of width
  const layerXFractions = [0.15, 0.38, 0.62, 0.85]

  // Distribute nodeCount across 4 layers
  function distributeNodes(total: number): number[] {
    // Ratios: input ~15%, hidden1 ~30%, hidden2 ~30%, output ~25%
    const raw = [total * 0.15, total * 0.3, total * 0.3, total * 0.25]
    const counts = raw.map((n) => Math.max(3, Math.round(n)))
    return counts
  }

  // Build nodes and edges for given dimensions
  function buildNetwork(width: number, height: number) {
    const counts = distributeNodes(nodeCount)
    const nodes: LayerNode[] = []

    // Create nodes per layer
    counts.forEach((count, layerIdx) => {
      const xBase = layerXFractions[layerIdx] * width
      const spacing = height / (count + 1)

      for (let i = 0; i < count; i++) {
        const baseX = xBase + (Math.random() - 0.5) * 16
        const baseY = spacing * (i + 1) + (Math.random() - 0.5) * 24
        nodes.push({
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          radius: Math.random() * 1.2 + 1.2,
          phase: Math.random() * Math.PI * 2,
          layer: layerIdx,
          glowIntensity: 0,
        })
      }
    })

    // Build edges: each node connects to 2–4 nodes in the next layer
    const edges: Edge[] = []
    const layerStart: number[] = []
    let offset = 0
    counts.forEach((count) => {
      layerStart.push(offset)
      offset += count
    })

    for (let l = 0; l < 3; l++) {
      const srcStart = layerStart[l]
      const srcEnd = srcStart + counts[l]
      const tgtStart = layerStart[l + 1]
      const tgtEnd = tgtStart + counts[l + 1]
      const targetCount = tgtEnd - tgtStart

      for (let s = srcStart; s < srcEnd; s++) {
        const numEdges = Math.floor(Math.random() * 3) + 2 // 2–4
        const targets = new Set<number>()
        while (targets.size < Math.min(numEdges, targetCount)) {
          targets.add(tgtStart + Math.floor(Math.random() * targetCount))
        }
        targets.forEach((t) => edges.push({ source: s, target: t }))
      }
    }

    nodesRef.current = nodes
    edgesRef.current = edges
    signalsRef.current = []
    frameRef.current = 0
    timeRef.current = 0
  }

  // Compute control point for a Bezier edge (slight horizontal sag)
  function getControlPoint(
    sx: number,
    sy: number,
    tx: number,
    ty: number
  ): [number, number] {
    const mx = (sx + tx) / 2
    const my = (sy + ty) / 2
    // Sag proportional to vertical distance
    const sag = (ty - sy) * 0.15
    return [mx, my + sag]
  }

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      setDimensions({ width: rect.width, height: rect.height })
      buildNetwork(rect.width, rect.height)
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [nodeCount])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.scale(dpr, dpr)

    const [br, bg, bb] = parseRGBA(baseColor)
    const [gr, gg, gb] = parseRGBA(glowColor)

    // Index edges by source node for cascade lookups
    const edgesBySource = new Map<number, number[]>()
    edgesRef.current.forEach((edge, idx) => {
      const list = edgesBySource.get(edge.source) || []
      list.push(idx)
      edgesBySource.set(edge.source, list)
    })

    const animate = () => {
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const signals = signalsRef.current
      const { width, height } = dimensions

      timeRef.current += 0.016 // ~60fps
      frameRef.current++
      const time = timeRef.current

      // 1. Update node positions (sinusoidal drift)
      nodes.forEach((node) => {
        node.x = node.baseX + Math.sin(time * 0.3 + node.phase) * 3
        node.y = node.baseY + Math.cos(time * 0.2 + node.phase) * 4
      })

      // 2. Decay glow
      nodes.forEach((node) => {
        if (node.glowIntensity > 0) {
          node.glowIntensity *= 0.94
          if (node.glowIntensity < 0.01) node.glowIntensity = 0
        }
      })

      // 3. Advance signals
      const newSignals: Signal[] = []
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i]
        sig.progress += sig.speed
        sig.opacity = Math.min(1, sig.opacity + 0.05)

        if (sig.progress >= 1) {
          // Signal arrived — glow target node
          const targetIdx = edges[sig.edge].target
          nodes[targetIdx].glowIntensity = Math.max(
            nodes[targetIdx].glowIntensity,
            0.8
          )

          // Cascade: ~60% chance to spawn follow-on signals
          if (Math.random() < 0.6) {
            const outgoing = edgesBySource.get(targetIdx)
            if (outgoing && outgoing.length > 0) {
              // Pick 1–2 outgoing edges
              const count = Math.min(
                Math.floor(Math.random() * 2) + 1,
                outgoing.length
              )
              const shuffled = [...outgoing].sort(() => Math.random() - 0.5)
              for (let j = 0; j < count; j++) {
                newSignals.push({
                  edge: shuffled[j],
                  progress: 0,
                  speed: 0.008 + Math.random() * 0.008,
                  opacity: 0.3,
                })
              }
            }
          }

          // Remove completed signal
          signals.splice(i, 1)
        }
      }
      signals.push(...newSignals)

      // 4. Spawn new signals from input layer
      if (frameRef.current % fireRate === 0) {
        const inputEdges = edges.filter(
          (_, idx) => nodes[edges[idx]?.source]?.layer === 0
        )
        if (inputEdges.length > 0) {
          const spawnCount = Math.floor(Math.random() * 3) + 1
          for (let i = 0; i < spawnCount; i++) {
            const edgeIdx = edges.indexOf(
              inputEdges[Math.floor(Math.random() * inputEdges.length)]
            )
            if (edgeIdx >= 0) {
              // Glow source node
              nodes[edges[edgeIdx].source].glowIntensity = 0.7
              signals.push({
                edge: edgeIdx,
                progress: 0,
                speed: 0.006 + Math.random() * 0.01,
                opacity: 0,
              })
            }
          }
        }
      }

      // 5. Clear canvas
      ctx.clearRect(0, 0, width, height)

      // 6. Draw all edges (batched)
      ctx.beginPath()
      ctx.strokeStyle = rgba(br, bg, bb, 0.08)
      ctx.lineWidth = 0.5
      edges.forEach((edge) => {
        const s = nodes[edge.source]
        const t = nodes[edge.target]
        const cp = getControlPoint(s.x, s.y, t.x, t.y)
        ctx.moveTo(s.x, s.y)
        ctx.quadraticCurveTo(cp[0], cp[1], t.x, t.y)
      })
      ctx.stroke()

      // 7. Draw signal highlights
      signals.forEach((sig) => {
        const edge = edges[sig.edge]
        if (!edge) return
        const s = nodes[edge.source]
        const t = nodes[edge.target]
        const cp = getControlPoint(s.x, s.y, t.x, t.y)

        // Draw a short bright segment around the signal position
        const t0 = Math.max(0, sig.progress - 0.08)
        const t1 = Math.min(1, sig.progress + 0.02)
        const p0 = getPointOnQuadratic(t0, [s.x, s.y], cp, [t.x, t.y])
        const p1 = getPointOnQuadratic(sig.progress, [s.x, s.y], cp, [
          t.x,
          t.y,
        ])
        const p2 = getPointOnQuadratic(t1, [s.x, s.y], cp, [t.x, t.y])

        ctx.beginPath()
        ctx.moveTo(p0[0], p0[1])
        ctx.lineTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.strokeStyle = rgba(gr, gg, gb, sig.opacity * 0.9)
        ctx.lineWidth = 2
        ctx.stroke()

        // Bright dot at signal head
        ctx.beginPath()
        ctx.arc(p1[0], p1[1], 2, 0, Math.PI * 2)
        ctx.fillStyle = rgba(gr, gg, gb, sig.opacity)
        ctx.fill()
      })

      // 8. Draw nodes — base pass
      ctx.beginPath()
      ctx.fillStyle = rgba(br, bg, bb, 0.4)
      nodes.forEach((node) => {
        ctx.moveTo(node.x + node.radius, node.y)
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      })
      ctx.fill()

      // 9. Draw glowing nodes
      nodes.forEach((node) => {
        if (node.glowIntensity <= 0) return

        // Radial glow
        const glowRadius = node.radius * 5 * node.glowIntensity
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius
        )
        gradient.addColorStop(0, rgba(gr, gg, gb, node.glowIntensity * 0.6))
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Bright core
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = rgba(gr, gg, gb, node.glowIntensity * 0.8)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, baseColor, glowColor, fireRate])

  return (
    <canvas
      ref={canvasRef}
      data-neural-network
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}
