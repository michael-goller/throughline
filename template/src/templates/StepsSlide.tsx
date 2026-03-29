import { motion } from 'framer-motion'
import type { StepsSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerVariants, itemFadeUpVariants, itemSlideLeftVariants, accentBarAnimation } from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

interface Props {
  slide: StepsSlideConfig
}

export default function StepsSlide({ slide }: Props) {
  return (
    <SlideBackground variant="dots">
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
        className="relative z-10 px-16 max-w-[1100px] w-full"
      >
        {/* Title */}
        <motion.h2
          variants={itemFadeUpVariants}
          className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-16"
        >
          {slide.title}
        </motion.h2>

        {/* Steps */}
        <div className="space-y-6">
          {slide.steps.map((step, index) => {
            const Icon = resolveIcon(step.icon)
            if (!Icon) return null
            return (
              <motion.div
                key={index}
                variants={itemSlideLeftVariants}
                custom={index}
                whileHover={{ x: 8, transition: { duration: 0.2 } }}
                className="flex items-center gap-6 p-6 rounded-lg bg-background-elevated border border-border hover:border-border-accent transition-colors"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-brand-red/20 flex items-center justify-center">
                  <span className="text-brand-red text-h3 font-bold">{index + 1}</span>
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <Icon className="w-8 h-8 text-brand-red" />
                </motion.div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-display text-h3 font-semibold text-text-primary">
                      {step.title}
                    </h3>
                    {step.duration && (
                      <span className="text-body-sm text-brand-red font-semibold">
                        {step.duration}
                      </span>
                    )}
                  </div>
                  <p className="text-body text-text-secondary mt-1">
                    {step.description}
                  </p>
                </div>
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
