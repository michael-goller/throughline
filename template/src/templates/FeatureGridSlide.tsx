import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { FeatureGridSlideConfig } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.15,
    },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
}

interface Props {
  slide: FeatureGridSlideConfig
}

export default function FeatureGridSlide({ slide }: Props) {
  const { title, subtitle, columns, rows, columnWidths } = slide

  const gridCols = columnWidths || `2fr repeat(${columns.length}, 1fr)`

  const renderValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-text text-[13px] leading-snug">{value}</span>
    }
    if (value) {
      return <Check className="w-4 h-4 text-green-500" />
    }
    return <X className="w-4 h-4 text-text-muted/40" />
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start px-12 pt-10 pb-20">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-text mb-1"
        >
          {title}
        </motion.h1>
      )}

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-sm text-text-muted mb-4"
        >
          {subtitle}
        </motion.p>
      )}

      {!subtitle && title && <div className="mb-4" />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-7xl overflow-hidden rounded-xl border border-text-muted/20"
      >
        {/* Header */}
        <motion.div
          variants={rowVariants}
          className="grid bg-nav-bg border-b border-text-muted/20"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="px-3 py-2.5" />
          {columns.map((col, i) => (
            <div
              key={i}
              className={`px-2 py-2.5 text-center font-semibold text-text text-[13px] ${
                col.highlight ? 'bg-brand-red/20' : ''
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
            className={`grid border-b border-text-muted/10 last:border-b-0 ${
              rowIndex % 2 === 0 ? 'bg-background' : 'bg-nav-bg/50'
            }`}
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="px-3 py-2.5 text-text font-medium text-[13px]">{row.feature}</div>
            {row.values.map((value, i) => (
              <div
                key={i}
                className={`px-2 py-2.5 flex items-center justify-center ${
                  columns[i]?.highlight ? 'bg-brand-red/10' : ''
                }`}
              >
                {renderValue(value)}
              </div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
