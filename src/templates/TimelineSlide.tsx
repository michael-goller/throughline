import { motion } from 'framer-motion'
import type { TimelineSlideConfig } from '../types'
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

const nodeVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut' as const,
    },
  },
}

interface Props {
  slide: TimelineSlideConfig
}

export default function TimelineSlide({ slide }: Props) {
  const nodes = slide.nodes.slice(0, 6) // Soft max of 6 nodes

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
            className="text-brand-red text-h2 md:text-h1 font-bold mb-20 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Horizontal line */}
          <motion.div
            variants={lineVariants}
            className="absolute top-6 left-0 right-0 h-0.5 bg-border origin-left"
          />

          {/* Nodes */}
          <div className="flex justify-between">
            {nodes.map((node, index) => {
              const isEven = index % 2 === 0
              return (
                <motion.div
                  key={index}
                  variants={nodeVariants}
                  custom={index}
                  className="flex flex-col items-center relative"
                  style={{ flex: 1 }}
                >
                  {/* Content above or below the line */}
                  <div
                    className={`flex flex-col items-center ${
                      isEven ? 'order-first mb-4' : 'order-last mt-4'
                    }`}
                  >
                    {/* Date */}
                    <span className="text-brand-red text-body font-semibold mb-2">
                      {node.date}
                    </span>

                    {/* Card */}
                    <div className="p-4 rounded-lg bg-background-elevated border border-border max-w-[180px] text-center">
                      <h4 className="text-text-primary text-body font-semibold mb-1">
                        {node.title}
                      </h4>
                      {node.description && (
                        <p className="text-text-muted text-body-sm">
                          {node.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dot on the line */}
                  <motion.div
                    whileHover={{ scale: 1.3 }}
                    className={`w-4 h-4 rounded-full bg-brand-red border-4 border-background z-10 ${
                      isEven ? 'order-last' : 'order-first'
                    }`}
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
