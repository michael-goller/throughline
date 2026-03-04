import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ComparisonSlideConfig } from '../types'
import { ClassificationMark } from '../components'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

const rightCardVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

const arrowVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.5,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

interface Props {
  slide: ComparisonSlideConfig
}

export default function ComparisonSlide({ slide }: Props) {
  const leftLabel = slide.leftLabel || 'Before'
  const rightLabel = slide.rightLabel || 'After'

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* Red accent bar at top */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
      />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-16 max-w-[1200px] w-full"
      >
        {/* Title */}
        {slide.title && (
          <motion.h2
            variants={itemVariants}
            className="text-brand-red text-h2 md:text-h1 font-bold mb-12 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Comparison Grid */}
        <div className="flex items-center gap-8">
          {/* Left (Before) */}
          <motion.div
            variants={cardVariants}
            className="flex-1 p-8 rounded-xl bg-background-elevated border border-border"
          >
            <h3 className="text-text-muted text-h3 font-semibold mb-6 text-center">
              {leftLabel}
            </h3>
            <ul className="space-y-4">
              {slide.leftItems.map((item, index) => (
                <motion.li
                  key={index}
                  variants={itemVariants}
                  className="flex items-start gap-3 text-text-secondary text-body-lg"
                >
                  <span className="text-text-muted mt-1">•</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Arrow */}
          <motion.div
            variants={arrowVariants}
            className="flex-shrink-0"
          >
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ArrowRight className="w-12 h-12 text-brand-red" />
            </motion.div>
          </motion.div>

          {/* Right (After) */}
          <motion.div
            variants={rightCardVariants}
            className="flex-1 p-8 rounded-xl bg-background-elevated border border-brand-red/30"
          >
            <h3 className="text-brand-red text-h3 font-semibold mb-6 text-center">
              {rightLabel}
            </h3>
            <ul className="space-y-4">
              {slide.rightItems.map((item, index) => (
                <motion.li
                  key={index}
                  variants={itemVariants}
                  className="flex items-start gap-3 text-text-primary text-body-lg"
                >
                  <span className="text-brand-red mt-1">•</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
