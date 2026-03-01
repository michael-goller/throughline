import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { FeatureGridSlideConfig } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
}

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
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
  const { title, columns, rows } = slide

  const renderValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-text text-sm">{value}</span>
    }
    if (value) {
      return <Check className="w-5 h-5 text-green-500" />
    }
    return <X className="w-5 h-5 text-text-muted/40" />
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-text mb-10"
        >
          {title}
        </motion.h1>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-5xl overflow-hidden rounded-xl border border-text-muted/20"
      >
        {/* Header */}
        <motion.div
          variants={rowVariants}
          className="grid bg-nav-bg border-b border-text-muted/20"
          style={{ gridTemplateColumns: `2fr repeat(${columns.length}, 1fr)` }}
        >
          <div className="px-6 py-4" />
          {columns.map((col, i) => (
            <div
              key={i}
              className={`px-4 py-4 text-center font-semibold text-text ${
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
            style={{ gridTemplateColumns: `2fr repeat(${columns.length}, 1fr)` }}
          >
            <div className="px-6 py-4 text-text font-medium">{row.feature}</div>
            {row.values.map((value, i) => (
              <div
                key={i}
                className={`px-4 py-4 flex items-center justify-center ${
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
