import { motion } from 'framer-motion'
import type { BarometerGridSlideConfig } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  },
}

function Barometer({ score, maxScore }: { score: number; maxScore: number }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex gap-1">
        {Array.from({ length: maxScore }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.6 + i * 0.05 }}
            className={`w-2.5 h-2.5 rounded-full ${
              i < score
                ? 'bg-amber-500'
                : 'bg-text-muted/15'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted ml-1">
        {score}/{maxScore}
      </span>
    </div>
  )
}

interface Props {
  slide: BarometerGridSlideConfig
}

export default function BarometerGridSlide({ slide }: Props) {
  const { title, subtitle, items, columns = 2 } = slide

  const gridCols = {
    2: 'grid-cols-2 max-w-4xl',
    3: 'grid-cols-3 max-w-5xl',
  }[columns]

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
          className="text-text-muted text-lg mb-10"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid ${gridCols} gap-6 w-full`}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="flex flex-col p-5 rounded-xl bg-nav-bg/50 border border-text-muted/10"
          >
            <h3 className="text-lg font-semibold text-text mb-1.5">{item.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed flex-1">
              {item.description}
            </p>
            <Barometer score={item.score} maxScore={item.maxScore} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
