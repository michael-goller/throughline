import { motion } from 'framer-motion'
import type { ThreeColumnSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerVariants, itemFadeUpVariants, itemScaleVariants, accentBarAnimation } from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

interface Props {
  slide: ThreeColumnSlideConfig
}

export default function ThreeColumnSlide({ slide }: Props) {
  return (
    <SlideBackground variant="gradient-radial">
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
        className="relative z-10 px-16 max-w-[1400px] w-full"
      >
        {/* Title */}
        {slide.title && (
          <motion.h2
            variants={itemFadeUpVariants}
            className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-16 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Three columns */}
        <div className="grid grid-cols-3 gap-8">
          {slide.columns.map((column, index) => {
            const Icon = resolveIcon(column.icon)
            if (!Icon) return null
            return (
              <motion.div
                key={index}
                variants={itemScaleVariants}
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
                <h3 className="font-display text-h3 font-semibold text-text-primary mb-4">
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
    </SlideBackground>
  )
}
