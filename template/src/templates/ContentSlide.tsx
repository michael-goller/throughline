import { motion } from 'framer-motion'
import type { ContentSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerVariants, itemFadeUpVariants, itemSlideLeftVariants, accentBarAnimation } from '../utils/animations'

interface Props {
  slide: ContentSlideConfig
}

export default function ContentSlide({ slide }: Props) {
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
        className="relative z-10 px-16 max-w-[1000px] w-full"
      >
        {/* Title */}
        <motion.h2
          variants={itemSlideLeftVariants}
          className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-4"
        >
          {slide.title}
        </motion.h2>

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            variants={itemFadeUpVariants}
            className="text-text-secondary text-body-lg mb-10"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {/* Body */}
        {slide.body && (
          <motion.p
            variants={itemFadeUpVariants}
            className="text-text-primary text-body-lg leading-relaxed mb-8"
          >
            {slide.body}
          </motion.p>
        )}

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <motion.ul variants={itemFadeUpVariants} className="space-y-4">
            {slide.bullets.map((bullet, index) => (
              <motion.li
                key={index}
                variants={itemFadeUpVariants}
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
    </SlideBackground>
  )
}
