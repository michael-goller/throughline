import { motion } from 'framer-motion'
import { GanttChart } from 'lucide-react'
import type { OperatingLoopSlideConfig } from '../types'
import { ClassificationMark } from '../components'

// ─── Layout constants ───────────────────────────────────────────────

const CX = 400          // circle center x
const CY = 280          // circle center y
const R = 155           // circle radius

// Positions around the circle (angle in radians, 0 = top, clockwise)
// 12 weeks in a quarter: each week = 30° (360/12)
const WEEK_ANGLE = (2 * Math.PI) / 12

function posOnCircle(weekIndex: number) {
  const angle = -Math.PI / 2 + weekIndex * WEEK_ANGLE // start from top
  return {
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle),
  }
}

// LT check-ins at weeks 2, 4, 6, 8, 10, 12
const LT_WEEKS = [2, 4, 6, 8, 10, 12]
// Strategy sessions at weeks 4, 8, 12
const STRATEGY_WEEKS = [4, 8, 12]

// ─── SVG arrow marker helpers ───────────────────────────────────────

function arrowOnArc(weekPos: number, size: number = 6) {
  const angle = -Math.PI / 2 + weekPos * WEEK_ANGLE
  const x = CX + R * Math.cos(angle)
  const y = CY + R * Math.sin(angle)
  // tangent direction (clockwise)
  const tx = -Math.sin(angle)
  const ty = Math.cos(angle)
  // arrow points
  const p1x = x - size * tx + size * 0.5 * (-ty)
  const p1y = y - size * ty + size * 0.5 * tx
  const p2x = x - size * tx - size * 0.5 * (-ty)
  const p2y = y - size * ty - size * 0.5 * tx
  return `M${p1x},${p1y} L${x},${y} L${p2x},${p2y}`
}

// ─── Animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  },
}

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
}

// ─── Component ──────────────────────────────────────────────────────

interface Props {
  slide: OperatingLoopSlideConfig
}

export default function OperatingLoopSlide({ slide }: Props) {
  const { title, nodes } = slide
  // nodes[0] = Start/Commit, nodes[1] = LT, nodes[2] = Strategy, nodes[3] = Review
  const startNode = nodes[0]
  const ltNode = nodes[1]
  const strategyNode = nodes[2]
  const reviewNode = nodes[3]

  // Card positions (outside the circle)
  const startCard = { x: 30, y: 50 }    // top-left
  const reviewCard = { x: 30, y: 400 }   // bottom-left
  const roadmapCard = { x: 570, y: 50 }  // top-right

  // Connection points on circle
  const startCircle = posOnCircle(0)     // 12 o'clock
  const reviewCircle = posOnCircle(11.5) // just before 12

  // Circle path
  const circlePathD = `M ${CX},${CY - R} A ${R},${R} 0 1,1 ${CX - 0.01},${CY - R}`

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* Red accent bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
      />

      <div className="relative z-10 px-16 w-full max-w-[1100px]">
        {/* Title */}
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-brand-red text-h2 md:text-h1 font-bold mb-6"
          >
            {title}
          </motion.h2>
        )}

        {/* Diagram */}
        <motion.div
          className="relative"
          style={{ height: 520 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <svg
            viewBox="0 0 800 520"
            className="absolute inset-0 w-full h-full"
            fill="none"
          >
            {/* Circle path */}
            <motion.path
              d={circlePathD}
              stroke="var(--border)"
              strokeWidth={2}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />

            {/* Clockwise direction arrows at 3, 6, 9 o'clock */}
            {[3, 6, 9].map((week) => (
              <motion.path
                key={`arrow-${week}`}
                d={arrowOnArc(week, 7)}
                stroke="var(--border)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                variants={dotVariants}
              />
            ))}

            {/* LT check-in markers (blue dots) */}
            {LT_WEEKS.map((week) => {
              const pos = posOnCircle(week)
              const isShared = STRATEGY_WEEKS.includes(week)
              return (
                <motion.circle
                  key={`lt-${week}`}
                  cx={pos.x}
                  cy={isShared ? pos.y - 7 : pos.y}
                  r={5}
                  fill="var(--accent-blue)"
                  variants={dotVariants}
                />
              )
            })}

            {/* Strategy session markers (amber dots) */}
            {STRATEGY_WEEKS.map((week) => {
              const pos = posOnCircle(week)
              return (
                <motion.circle
                  key={`strat-${week}`}
                  cx={pos.x}
                  cy={pos.y + 7}
                  r={5}
                  fill="var(--accent-orange)"
                  variants={dotVariants}
                />
              )
            })}

            {/* Start marker (red dot at 12 o'clock) */}
            <motion.circle
              cx={startCircle.x}
              cy={startCircle.y}
              r={7}
              fill="var(--brand-red)"
              variants={dotVariants}
            />

            {/* Review marker (red dot near 12 o'clock) */}
            <motion.circle
              cx={reviewCircle.x}
              cy={reviewCircle.y}
              r={7}
              fill="var(--brand-red)"
              variants={dotVariants}
            />

            {/* Connector: Start card → circle */}
            <motion.line
              x1={startCard.x + 220}
              y1={startCard.y + 40}
              x2={startCircle.x - 8}
              y2={startCircle.y}
              stroke="var(--brand-red)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              variants={dotVariants}
            />

            {/* Connector: Review card → circle */}
            <motion.line
              x1={reviewCard.x + 220}
              y1={reviewCard.y + 30}
              x2={reviewCircle.x - 8}
              y2={reviewCircle.y}
              stroke="var(--brand-red)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              variants={dotVariants}
            />

            {/* Arrow: Start card → Roadmap card */}
            <motion.line
              x1={startCard.x + 230}
              y1={startCard.y + 20}
              x2={roadmapCard.x - 10}
              y2={roadmapCard.y + 20}
              stroke="var(--text-muted)"
              strokeWidth={1.5}
              markerEnd="url(#roadmap-arrow)"
              variants={dotVariants}
            />

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="roadmap-arrow"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L8,3 L0,6" fill="var(--text-muted)" />
              </marker>
            </defs>
          </svg>

          {/* Start of Cycle card */}
          <motion.div
            className="absolute rounded-lg border border-brand-red/40 bg-background-elevated px-5 py-3 w-[220px]"
            style={{ left: startCard.x, top: startCard.y }}
            variants={cardVariants}
          >
            <span className="text-tiny font-bold text-brand-red uppercase tracking-wide">
              {startNode?.date}
            </span>
            <h4 className="text-body-sm font-bold text-text mt-1">
              {startNode?.title}
            </h4>
            {startNode?.description && (
              <p className="text-tiny text-text-muted mt-1 leading-snug">
                {startNode.description}
              </p>
            )}
          </motion.div>

          {/* Review card */}
          <motion.div
            className="absolute rounded-lg border border-brand-red/40 bg-background-elevated px-5 py-3 w-[220px]"
            style={{ left: reviewCard.x, top: reviewCard.y }}
            variants={cardVariants}
          >
            <span className="text-tiny font-bold text-brand-red uppercase tracking-wide">
              {reviewNode?.date}
            </span>
            <h4 className="text-body-sm font-bold text-text mt-1">
              {reviewNode?.title}
            </h4>
            {reviewNode?.description && (
              <p className="text-tiny text-text-muted mt-1 leading-snug">
                {reviewNode.description}
              </p>
            )}
          </motion.div>

          {/* Roadmap card */}
          <motion.div
            className="absolute rounded-lg border border-border bg-background-elevated px-5 py-3 w-[200px]"
            style={{ left: roadmapCard.x, top: roadmapCard.y }}
            variants={cardVariants}
          >
            <div className="flex items-center gap-2">
              <GanttChart className="w-4 h-4 text-text-muted" />
              <span className="text-body-sm font-bold text-text">Roadmap</span>
            </div>
            <p className="text-tiny text-text-muted mt-1 leading-snug">
              Commitments shape the quarterly roadmap
            </p>
          </motion.div>

          {/* LT info card (right side, near blue dots) */}
          <motion.div
            className="absolute rounded-lg border border-border bg-background-elevated px-4 py-2.5 w-[200px]"
            style={{ left: 580, top: 210 }}
            variants={cardVariants}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent-blue)' }} />
              <span className="text-tiny font-bold text-text">{ltNode?.title}</span>
            </div>
            <p className="text-tiny text-text-muted mt-1 leading-snug">
              {ltNode?.date} · {ltNode?.description}
            </p>
          </motion.div>

          {/* Strategy info card (right-bottom, near amber dots) */}
          <motion.div
            className="absolute rounded-lg border border-border bg-background-elevated px-4 py-2.5 w-[200px]"
            style={{ left: 580, top: 320 }}
            variants={cardVariants}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent-orange)' }} />
              <span className="text-tiny font-bold text-text">{strategyNode?.title}</span>
            </div>
            <p className="text-tiny text-text-muted mt-1 leading-snug">
              {strategyNode?.date} · {strategyNode?.description}
            </p>
          </motion.div>
        </motion.div>
      </div>

      <ClassificationMark />
    </div>
  )
}
