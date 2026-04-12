import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import type { ScorecardSlideConfig, ScorecardRAGItem, ScorecardMetric } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerFastVariants, rowVariants, itemFadeUpVariants, accentBarAnimation } from '../utils/animations'

const RAG_COLORS: Record<string, string> = {
  green: '#22c55e',
  amber: '#eab308',
  red: '#ef4444',
  'not-started': '#6b7280',
}

function RAGDot({ item }: { item: ScorecardRAGItem }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-4 h-4 rounded-full shadow-sm"
        style={{ backgroundColor: RAG_COLORS[item.status] }}
      />
      <span className="text-tiny text-text-muted font-medium whitespace-nowrap">
        {item.label}
      </span>
    </div>
  )
}

function TrendIcon({ trend }: { trend?: 'up' | 'flat' | 'down' }) {
  if (trend === 'up')
    return <TrendingUp size={14} className="text-accent-green" />
  if (trend === 'down')
    return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-text-muted" />
}

interface Props {
  slide: ScorecardSlideConfig
}

export default function ScorecardSlide({ slide }: Props) {
  const { title, headline, ragItems, metrics, confidence, decisionsNeeded, decisionsNote } = slide

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
          className="relative z-10 px-12 max-w-[1100px] w-full"
        >
          {/* Title */}
          {title && (
            <motion.h2
              variants={itemFadeUpVariants}
              className="font-display text-brand-red text-h2 font-bold mb-2 text-center"
            >
              {title}
            </motion.h2>
          )}

          {/* Headline */}
          <motion.p
            variants={itemFadeUpVariants}
            className="text-text-secondary text-body-sm mb-6 text-center leading-relaxed"
          >
            {headline}
          </motion.p>

          {/* RAG strip */}
          <motion.div
            variants={itemFadeUpVariants}
            className="flex items-center justify-center gap-8 mb-6 px-6 py-3 rounded-xl bg-background-elevated/50 border border-border"
          >
            {ragItems.map((item, i) => (
              <RAGDot key={i} item={item} />
            ))}
          </motion.div>

          {/* Metrics table */}
          <motion.div
            variants={itemFadeUpVariants}
            className="w-full overflow-hidden rounded-2xl border border-border bg-background-elevated/50 shadow-lg shadow-black/10 mb-4"
          >
            {/* Header */}
            <motion.div
              variants={rowVariants}
              className="grid grid-cols-[2fr_1fr_1fr_80px] border-b border-border"
            >
              <div className="px-5 py-3 text-text-muted font-display font-semibold text-caption">
                Metric
              </div>
              <div className="px-4 py-3 text-text-muted font-display font-semibold text-caption text-center">
                Actual
              </div>
              <div className="px-4 py-3 text-text-muted font-display font-semibold text-caption text-center">
                Target
              </div>
              <div className="px-4 py-3 text-text-muted font-display font-semibold text-caption text-center">
                Trend
              </div>
            </motion.div>

            {/* Rows */}
            {metrics.map((metric: ScorecardMetric, i: number) => (
              <motion.div
                key={i}
                variants={rowVariants}
                className={`grid grid-cols-[2fr_1fr_1fr_80px] border-b border-border/50 last:border-b-0 ${
                  i % 2 === 0 ? 'bg-transparent' : 'bg-background-accent/30'
                }`}
              >
                <div className="px-5 py-3 text-text-primary font-medium text-caption flex items-center border-r border-border/30">
                  {metric.label}
                </div>
                <div className="px-4 py-3 text-text-secondary text-caption text-center flex items-center justify-center font-medium">
                  {metric.actual}
                </div>
                <div className="px-4 py-3 text-text-muted text-caption text-center flex items-center justify-center">
                  {metric.target ?? '—'}
                </div>
                <div className="px-4 py-3 flex items-center justify-center">
                  <TrendIcon trend={metric.trend} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom row: confidence + decisions */}
          <motion.div
            variants={itemFadeUpVariants}
            className="flex items-center justify-between gap-4"
          >
            {confidence && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border">
                <span className="text-text-muted text-caption font-medium">Confidence</span>
                <span className="font-display text-brand-red text-body font-bold">
                  {confidence.score}/{confidence.max ?? 10}
                </span>
              </div>
            )}
            {decisionsNeeded != null && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border">
                {decisionsNeeded && (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
                <span className="text-text-muted text-caption font-medium">
                  Decisions needed:
                </span>
                <span className={`text-caption font-semibold ${decisionsNeeded ? 'text-amber-400' : 'text-accent-green'}`}>
                  {decisionsNeeded ? 'Yes' : 'None'}
                </span>
                {decisionsNote && (
                  <span className="text-text-muted text-tiny ml-1">— {decisionsNote}</span>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>

        <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
