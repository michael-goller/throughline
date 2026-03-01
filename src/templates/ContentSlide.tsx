import { motion } from 'framer-motion'
import type { ContentSlideConfig } from '../types'
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

interface Props {
  slide: ContentSlideConfig
}

export default function ContentSlide({ slide }: Props) {
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
        className="relative z-10 px-16 max-w-[1000px] w-full"
      >
        {/* Title */}
        <motion.h2
          variants={itemVariants}
          className="text-brand-red text-h2 md:text-h1 font-bold mb-4"
        >
          {slide.title}
        </motion.h2>

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            variants={itemVariants}
            className="text-text-secondary text-body-lg mb-10"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {/* Body */}
        {slide.body && (
          <motion.p
            variants={itemVariants}
            className="text-text-primary text-body-lg leading-relaxed mb-8"
          >
            {slide.body}
          </motion.p>
        )}

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <motion.ul variants={itemVariants} className="space-y-4">
            {slide.bullets.map((bullet, index) => (
              <motion.li
                key={index}
                variants={itemVariants}
                className="flex items-start gap-4 text-text-secondary text-body-lg"
              >
                <span className="text-brand-red mt-1">•</span>
                <span>{bullet}</span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
