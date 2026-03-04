import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  firing: boolean
  fireIntensity: number
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

/**
 * Animated neural network background
 *
 * Creates an organic, plexus-style network with nodes that
 * occasionally "fire" with a subtle glow effect.
 */
export default function NeuralNetwork({
  nodeCount = 40,
  baseColor = 'rgba(255, 255, 255, 0.15)',
  glowColor = 'rgba(227, 25, 55, 0.6)',
  fireRate = 150,
  connectionDistance = 150,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<Node[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Initialize nodes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      setDimensions({ width: rect.width, height: rect.height })

      // Initialize or reinitialize nodes
      nodesRef.current = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        firing: false,
        fireIntensity: 0,
      }))
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

    const maxDistance = connectionDistance
    let frameCount = 0

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      const nodes = nodesRef.current

      // Update node positions
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy

        // Bounce off edges with padding
        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1

        // Keep in bounds
        node.x = Math.max(0, Math.min(dimensions.width, node.x))
        node.y = Math.max(0, Math.min(dimensions.height, node.y))

        // Decay fire intensity
        if (node.fireIntensity > 0) {
          node.fireIntensity *= 0.95
          if (node.fireIntensity < 0.01) {
            node.fireIntensity = 0
            node.firing = false
          }
        }
      })

      // Randomly trigger firing (slow, irregular)
      frameCount++
      if (frameCount % fireRate === 0 && Math.random() > 0.5) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
        randomNode.firing = true
        randomNode.fireIntensity = 1

        // Propagate to nearby nodes with delay effect
        setTimeout(() => {
          nodes.forEach((otherNode) => {
            if (otherNode === randomNode) return
            const dx = otherNode.x - randomNode.x
            const dy = otherNode.y - randomNode.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < maxDistance * 0.7 && Math.random() > 0.6) {
              otherNode.firing = true
              otherNode.fireIntensity = 0.6
            }
          })
        }, 100)
      }

      // Draw connections
      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = otherNode.x - node.x
          const dy = otherNode.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.3
            const isFiring = node.firing || otherNode.firing
            const fireBoost = isFiring
              ? Math.max(node.fireIntensity, otherNode.fireIntensity) * 0.5
              : 0

            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(otherNode.x, otherNode.y)
            ctx.strokeStyle = isFiring
              ? glowColor.replace(/[\d.]+\)$/, `${opacity + fireBoost})`)
              : baseColor.replace(/[\d.]+\)$/, `${opacity})`)
            ctx.lineWidth = isFiring ? 1.5 : 0.5
            ctx.stroke()
          }
        })
      })

      // Draw nodes
      nodes.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)

        if (node.firing && node.fireIntensity > 0) {
          // Glowing node
          const gradient = ctx.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            node.radius * 4 * node.fireIntensity
          )
          gradient.addColorStop(0, glowColor)
          gradient.addColorStop(1, 'transparent')
          ctx.fillStyle = gradient
          ctx.fill()

          // Core
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2)
          ctx.fillStyle = glowColor
          ctx.fill()
        } else {
          ctx.fillStyle = baseColor
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, baseColor, glowColor, fireRate, connectionDistance])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}
