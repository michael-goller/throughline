import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { RiskCardSlideConfig, RiskItem } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerFastVariants, itemFadeUpVariants, accentBarAnimation } from '../utils/animations'

const STATUS_COLORS: Record<string, { border: string; bg: string; dot: string }> = {
  red: { border: 'border-red-500/30', bg: 'bg-red-500/5', dot: '#ef4444' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', dot: '#eab308' },
}

function RiskCard({ risk }: { risk: RiskItem }) {
  const colors = STATUS_COLORS[risk.status] ?? STATUS_COLORS.amber

  return (
    <motion.div
      variants={itemFadeUpVariants}
      className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/30">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: colors.dot }}
        />
        <h3 className="font-display text-text font-semibold text-body-sm truncate">
          {risk.title}
        </h3>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <div>
          <span className="text-tiny text-text-muted font-semibold uppercase tracking-wider">
            Current State
          </span>
          <p className="text-caption text-text-secondary mt-0.5 leading-relaxed">
            {risk.currentState}
          </p>
        </div>
        <div>
          <span className="text-tiny text-text-muted font-semibold uppercase tracking-wider">
            Root Cause
          </span>
          <p className="text-caption text-text-secondary mt-0.5 leading-relaxed">
            {risk.rootCause}
          </p>
        </div>
        <div>
          <span className="text-tiny text-text-muted font-semibold uppercase tracking-wider">
            Business Impact
          </span>
          <p className="text-caption text-text-secondary mt-0.5 leading-relaxed">
            {risk.businessImpact}
          </p>
        </div>
        <div className="pt-1 border-t border-border/30">
          <span className="text-tiny text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={11} />
            Action Required
          </span>
          <p className="text-caption text-text-primary font-medium mt-0.5 leading-relaxed">
            {risk.action}
          </p>
        </div>
        {risk.pathToGreen && (
          <div className="pt-1 border-t border-border/30">
            <span className="text-tiny font-semibold uppercase tracking-wider flex items-center gap-1 text-accent-green">
              <ArrowRight size={11} />
              Path to Green
            </span>
            <p className="text-caption text-text-secondary mt-0.5 leading-relaxed">
              {risk.pathToGreen}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface Props {
  slide: RiskCardSlideConfig
}

export default function RiskCardSlide({ slide }: Props) {
  const { title, risks } = slide
  const displayRisks = risks.slice(0, 3)
  const gridClass = displayRisks.length === 1
    ? 'max-w-xl mx-auto'
    : displayRisks.length === 2
      ? 'grid grid-cols-2 gap-5'
      : 'grid grid-cols-3 gap-4'

  return (
    <SlideBackground variant="gradient-subtle">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Red accent bar at top */}
        <motion.div
          {...accentBarAnimation}
          className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
        />

        <motion.div
          variants={containerFastVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 px-12 max-w-[1200px] w-full"
        >
          {/* Title */}
          {title && (
            <motion.h2
              variants={itemFadeUpVariants}
              className="font-display text-brand-red text-h2 font-bold mb-8 text-center"
            >
              {title}
            </motion.h2>
          )}

          {/* Risk cards */}
          <div className={gridClass}>
            {displayRisks.map((risk, i) => (
              <RiskCard key={i} risk={risk} />
            ))}
          </div>
        </motion.div>

        <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
