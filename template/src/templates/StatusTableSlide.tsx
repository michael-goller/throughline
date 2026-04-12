import { motion } from 'framer-motion'
import type { StatusTableSlideConfig, StatusTableRow } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerFastVariants, rowVariants, itemFadeUpVariants, accentBarAnimation } from '../utils/animations'

const STATUS_COLORS: Record<string, string> = {
  green: '#22c55e',
  amber: '#eab308',
  red: '#ef4444',
  'not-started': '#6b7280',
  done: '#22c55e',
}

const STATUS_BG: Record<string, string> = {
  red: 'bg-red-500/5',
  amber: 'bg-amber-500/5',
}

function StatusDot({ status }: { status?: string }) {
  if (!status) return <div className="w-3 h-3" />
  return (
    <div
      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    />
  )
}

interface Props {
  slide: StatusTableSlideConfig
}

export default function StatusTableSlide({ slide }: Props) {
  const { title, subtitle, columns, rows, summary, showStatusDot = true } = slide
  const gridCols = showStatusDot
    ? `40px ${columns.map((c) => c.width ?? '1fr').join(' ')}`
    : columns.map((c) => c.width ?? '1fr').join(' ')

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
              {showStatusDot && <div className="px-2 py-3" />}
              {columns.map((col, i) => (
                <div
                  key={i}
                  className="px-4 py-3 text-text-muted font-display font-semibold text-caption"
                >
                  {col.header}
                </div>
              ))}
            </motion.div>

            {/* Rows */}
            {rows.map((row: StatusTableRow, rowIndex: number) => (
              <motion.div
                key={rowIndex}
                variants={rowVariants}
                className={`grid border-b border-border/50 last:border-b-0 transition-colors duration-200 ${
                  row.status && STATUS_BG[row.status]
                    ? STATUS_BG[row.status]
                    : rowIndex % 2 === 0
                      ? 'bg-transparent'
                      : 'bg-background-accent/30'
                }`}
                style={{ gridTemplateColumns: gridCols }}
              >
                {showStatusDot && (
                  <div className="px-2 py-3 flex items-center justify-center">
                    <StatusDot status={row.status} />
                  </div>
                )}
                {row.cells.map((cell, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 text-caption flex items-center ${
                      i === 0
                        ? 'text-text-primary font-medium border-r border-border/30'
                        : 'text-text-secondary'
                    }`}
                  >
                    {cell}
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          {/* Summary */}
          {summary && (
            <motion.p
              variants={itemFadeUpVariants}
              className="text-text-muted text-caption mt-3 text-center"
            >
              {summary}
            </motion.p>
          )}
        </motion.div>

        <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
