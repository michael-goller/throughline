import { motion } from 'framer-motion'
import type { DividerSlideConfig } from '../types'
import { ClassificationMark, RoundedTriangle } from '../components'
import { containerSlowVariants, itemFadeUpHeroVariants } from '../utils/animations'

interface Props {
  slide: DividerSlideConfig
}

export default function DividerSlide({ slide }: Props) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Red gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E31937 0%, #B31329 50%, #731C3F 100%)',
        }}
      />

      {/* Decorative rounded triangle - Avery Dennison brand element */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] aspect-video translate-x-[3%]">
          <RoundedTriangle
            rotation={120}
            fill="rgba(0,0,0,0.12)"
          />
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerSlowVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-16 max-w-[900px]"
      >
        {/* Section Number */}
        {slide.sectionNumber && (
          <motion.div
            variants={itemFadeUpHeroVariants}
            className="mb-6"
          >
            <span className="text-white/60 text-h3 font-semibold">
              Section {slide.sectionNumber}
            </span>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          variants={itemFadeUpHeroVariants}
          className="font-display text-h1 md:text-hero font-bold text-white leading-tight"
        >
          {slide.title}
        </motion.h1>

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            variants={itemFadeUpHeroVariants}
            className="font-display text-h3 md:text-h2 text-white/80 font-normal mt-6"
          >
            {slide.subtitle}
          </motion.p>
        )}
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark className="text-white/50" />
    </div>
  )
}
