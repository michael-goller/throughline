import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { FeatureGridSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerFastVariants, rowVariants, itemFadeUpVariants, accentBarAnimation } from '../utils/animations'

const PILL_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#4ade80',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#dc2626',
}

interface Props {
  slide: FeatureGridSlideConfig
}

export default function FeatureGridSlide({ slide }: Props) {
  const { title, subtitle, columns, rows, columnWidths } = slide
  const gridCols = columnWidths || `2fr repeat(${columns.length}, 1fr)`

  const hasPills = rows.some(row =>
    row.values.some(v => typeof v === 'string' && /^\d\|/.test(v)),
  )

  const renderValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      const pillMatch = value.match(/^(\d)\|(.+)$/)
      if (pillMatch) {
        const level = parseInt(pillMatch[1])
        const description = pillMatch[2]
        const widthPercent = level * 20
        return (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="w-full h-2.5 rounded-full bg-background-accent overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${widthPercent}%` }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0, 0, 0.2, 1] }}
                style={{ backgroundColor: PILL_COLORS[level] }}
              />
            </div>
            <span className="text-text-muted text-tiny leading-tight">{description}</span>
          </div>
        )
      }
      return <span className="text-text-secondary text-caption leading-snug">{value}</span>
    }
    if (value) {
      return (
        <div className="w-7 h-7 rounded-full bg-accent-green/15 flex items-center justify-center">
          <Check className="w-4 h-4 text-accent-green" />
        </div>
      )
    }
    return (
      <div className="w-7 h-7 rounded-full bg-text-muted/10 flex items-center justify-center">
        <X className="w-4 h-4 text-text-muted/40" />
      </div>
    )
  }

  return (
    <SlideBackground variant="gradient-subtle">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Red accent bar at top */}
        <motion.div
          {...accentBarAnimation}
          className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
        />

        {/* Content */}
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
              className="font-display text-brand-red text-h2 font-bold mb-2 text-center"
            >
              {title}
            </motion.h2>
          )}

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              variants={itemFadeUpVariants}
              className="text-text-secondary text-body-sm mb-6 text-center"
            >
              {subtitle}
            </motion.p>
          )}

          {!subtitle && title && <div className="mb-6" />}

          {/* Table */}
          <motion.div
            variants={itemFadeUpVariants}
            className="w-full overflow-hidden rounded-2xl border border-border bg-background-elevated/50 shadow-lg shadow-black/10"
          >
            {/* Header */}
            <motion.div
              variants={rowVariants}
              className="grid border-b border-border"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="px-5 py-4" />
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={`px-4 py-4 text-center font-display font-semibold text-body-sm tracking-wide ${
                    col.highlight
                      ? 'bg-brand-red/15 text-brand-red'
                      : 'text-text-muted'
                  }`}
                >
                  {col.header}
                </div>
              ))}
            </motion.div>

            {/* Rows */}
            {rows.map((row, rowIndex) => (
              <motion.div
                key={rowIndex}
                variants={rowVariants}
                className={`grid border-b border-border/50 last:border-b-0 transition-colors duration-200 ${
                  rowIndex % 2 === 0
                    ? 'bg-transparent'
                    : 'bg-background-accent/30'
                }`}
                style={{ gridTemplateColumns: gridCols }}
              >
                <div
                  className={`px-5 ${hasPills ? 'py-4' : 'py-3.5'} text-text-primary font-medium text-caption flex items-center border-r border-border/30`}
                >
                  {row.feature}
                </div>
                {row.values.map((value, i) => (
                  <div
                    key={i}
                    className={`px-4 ${hasPills ? 'py-4' : 'py-3.5'} flex items-center ${
                      columns[i]?.highlight
                        ? 'bg-brand-red/5 justify-center'
                        : 'justify-center'
                    }`}
                  >
                    {renderValue(value)}
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Classification mark */}
        <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
