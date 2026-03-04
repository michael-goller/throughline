import { motion } from 'framer-motion'
import type { SparklineGridSlideConfig } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  },
}

interface Props {
  slide: SparklineGridSlideConfig
}

// Build a smooth SVG path through the data points using cardinal spline interpolation
function buildSparklinePath(
  values: number[],
  width: number,
  height: number,
  maxValue: number,
  padding: number = 8,
): string {
  const n = values.length
  if (n < 2) return ''

  const drawW = width - padding * 2
  const drawH = height - padding * 2

  const points = values.map((v, i) => ({
    x: padding + (i / (n - 1)) * drawW,
    y: padding + drawH - (v / maxValue) * drawH,
  }))

  // Catmull-Rom to cubic bezier conversion for smooth curves
  const tension = 0.3
  let d = `M ${points[0].x},${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }

  return d
}

// Build the filled area path (path + close to bottom)
function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  maxValue: number,
  padding: number = 8,
): string {
  const linePath = buildSparklinePath(values, width, height, maxValue, padding)
  if (!linePath) return ''

  const drawW = width - padding * 2
  const bottomY = height - padding

  // Close the path along the bottom
  return `${linePath} L ${padding + drawW},${bottomY} L ${padding},${bottomY} Z`
}

function Sparkline({ values, maxValue }: { values: number[]; maxValue: number }) {
  const svgWidth = 400
  const svgHeight = 40
  const padding = 6

  const linePath = buildSparklinePath(values, svgWidth, svgHeight, maxValue, padding)
  const areaPath = buildAreaPath(values, svgWidth, svgHeight, maxValue, padding)

  const drawW = svgWidth - padding * 2
  const drawH = svgHeight - padding * 2
  const n = values.length

  const points = values.map((v, i) => ({
    x: padding + (i / (n - 1)) * drawW,
    y: padding + drawH - (v / maxValue) * drawH,
    value: v,
  }))

  // Measure total path length for draw animation
  let pathLength = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    pathLength += Math.sqrt(dx * dx + dy * dy)
  }

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-10"
      preserveAspectRatio="none"
    >
      {/* Filled area under the curve */}
      <motion.path
        d={areaPath}
        fill="url(#sparklineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--brand-red)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />

      {/* Dots */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.value > 0 ? 3 : 0}
          fill="var(--brand-red)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
        />
      ))}

      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-red)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--brand-red)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function SparklineGridSlide({ slide }: Props) {
  const { title, subtitle, phases, rows } = slide
  const maxValue = 3

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-text mb-2"
        >
          {title}
        </motion.h1>
      )}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-text-muted text-lg mb-8"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-6xl"
      >
        {/* Phase headers */}
        <motion.div
          variants={rowVariants}
          className="grid mb-1"
          style={{ gridTemplateColumns: '200px 1fr' }}
        >
          <div />
          <div className="grid" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
            {phases.map((phase, i) => (
              <div key={i} className="text-center text-text-muted text-sm font-medium px-1">
                {phase}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rows with sparkline */}
        {rows.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            variants={rowVariants}
            className={`grid items-center py-3 px-2 rounded-lg mb-1 ${
              rowIndex % 2 === 0 ? 'bg-nav-bg/30' : ''
            }`}
            style={{ gridTemplateColumns: '200px 1fr' }}
          >
            <div className="text-text font-medium text-sm pr-4">{row.label}</div>
            <Sparkline values={row.values} maxValue={maxValue} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
