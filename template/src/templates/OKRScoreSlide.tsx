import { motion } from 'framer-motion'
import type { OKRScoreSlideConfig, OKRScoreItem } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1] as const,
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
}

const statusConfig: Record<OKRScoreItem['progress'], { color: string; bg: string; label: string }> = {
  'on-track': { color: 'bg-emerald-400', bg: 'bg-emerald-400/10', label: 'On Track' },
  'at-risk': { color: 'bg-amber-400', bg: 'bg-amber-400/10', label: 'At Risk' },
  'behind': { color: 'bg-red-400', bg: 'bg-red-400/10', label: 'Behind' },
  'done': { color: 'bg-blue-400', bg: 'bg-blue-400/10', label: 'Done' },
  'not-started': { color: 'bg-text-muted/40', bg: 'bg-text-muted/5', label: 'Not Started' },
}

interface Props {
  slide: OKRScoreSlideConfig
}

export default function OKRScoreSlide({ slide }: Props) {
  const { title, subtitle, objectives } = slide

  return (
    <div className="w-full h-full flex flex-col px-10 py-8">
      {/* Header */}
      {title && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 shrink-0"
        >
          <h2 className="text-brand-red text-h2 font-bold">{title}</h2>
          {subtitle && (
            <p className="text-text-muted text-body mt-1">{subtitle}</p>
          )}
        </motion.div>
      )}

      {/* Red accent bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="h-0.5 bg-brand-red/30 mb-5 origin-left shrink-0"
      />

      {/* Objectives grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 grid gap-4 min-h-0"
        style={{ gridTemplateColumns: `repeat(${objectives.length}, 1fr)` }}
      >
        {objectives.map((obj, i) => {
          const Icon = obj.icon
          return (
            <motion.div
              key={i}
              variants={columnVariants}
              className="flex flex-col min-h-0 rounded-xl bg-background-elevated/60 border border-border overflow-hidden"
            >
              {/* Objective header */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-brand-red/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-red" />
                  </div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wide leading-tight">
                    {obj.objective}
                  </h3>
                </div>
                {obj.tagline && (
                  <p className="text-text-muted text-xs leading-snug mt-1 pl-[38px]">
                    {obj.tagline}
                  </p>
                )}
              </div>

              {/* Key Results list */}
              <div className="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-y-auto">
                {obj.keyResults.map((kr, j) => {
                  const status = statusConfig[kr.progress]
                  return (
                    <motion.div
                      key={j}
                      variants={itemVariants}
                      className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg ${status.bg} transition-colors`}
                    >
                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full ${status.color} mt-1.5 shrink-0`} />

                      {/* KR content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-text leading-tight">
                          {kr.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-text-muted text-[11px]">{kr.owner}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="flex items-center justify-center gap-5 mt-4 shrink-0"
      >
        {(['on-track', 'at-risk', 'behind', 'not-started', 'done'] as const).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
            <span className="text-text-muted text-[11px]">{statusConfig[status].label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
