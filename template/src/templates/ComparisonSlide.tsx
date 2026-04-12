import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ComparisonSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerVariants, itemFadeUpVariants, itemSlideLeftVariants, itemSlideRightVariants, accentBarAnimation, EASE_OUT } from '../utils/animations'

const arrowVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.5,
      ease: EASE_OUT,
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
    <SlideBackground variant="gradient-subtle">
      <div className="relative w-full h-full flex items-center justify-center">
      {/* Red accent bar at top */}
      <motion.div
        {...accentBarAnimation}
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
            variants={itemFadeUpVariants}
            className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-12 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Comparison Grid */}
        <div className="flex items-center gap-8">
          {/* Left (Before) */}
          <motion.div
            variants={itemSlideLeftVariants}
            className="flex-1 p-8 rounded-xl bg-background-elevated border border-border"
          >
            <h3 className="text-text-muted text-h3 font-semibold mb-6 text-center">
              {leftLabel}
            </h3>
            <ul className="space-y-4">
              {slide.leftItems.map((item, index) => (
                <motion.li
                  key={index}
                  variants={itemFadeUpVariants}
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
            variants={itemSlideRightVariants}
            className="flex-1 p-8 rounded-xl bg-background-elevated border border-brand-red/30"
          >
            <h3 className="text-brand-red text-h3 font-semibold mb-6 text-center">
              {rightLabel}
            </h3>
            <ul className="space-y-4">
              {slide.rightItems.map((item, index) => (
                <motion.li
                  key={index}
                  variants={itemFadeUpVariants}
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
    </SlideBackground>
  )
}
