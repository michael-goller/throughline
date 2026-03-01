import { motion } from 'framer-motion'
import type { ThreeColumnSlideConfig } from '../types'
import { ClassificationMark } from '../components'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

interface Props {
  slide: ThreeColumnSlideConfig
}

export default function ThreeColumnSlide({ slide }: Props) {
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
        className="relative z-10 px-16 max-w-[1400px] w-full"
      >
        {/* Title */}
        {slide.title && (
          <motion.h2
            variants={itemVariants}
            className="text-brand-red text-h2 md:text-h1 font-bold mb-16 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Three columns */}
        <div className="grid grid-cols-3 gap-8">
          {slide.columns.map((column, index) => {
            const Icon = column.icon
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="p-8 rounded-xl bg-background-elevated border border-border text-center"
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="w-16 h-16 rounded-full bg-brand-red/20 flex items-center justify-center mx-auto mb-6"
                >
                  <Icon className="w-8 h-8 text-brand-red" />
                </motion.div>

                {/* Title */}
                <h3 className="text-h3 font-semibold text-text-primary mb-4">
                  {column.title}
                </h3>

                {/* Description */}
                <p className="text-body text-text-secondary leading-relaxed">
                  {column.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
