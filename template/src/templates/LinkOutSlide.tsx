import { motion } from 'framer-motion'
import { Presentation, ArrowUpRight } from 'lucide-react'
import type { LinkOutSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import {
  containerVariants,
  itemFadeUpVariants,
  itemScaleVariants,
  accentBarAnimation,
} from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

interface Props {
  slide: LinkOutSlideConfig
}

export default function LinkOutSlide({ slide }: Props) {
  const Icon = (slide.icon ? resolveIcon(slide.icon) : undefined) ?? Presentation
  const linkText = slide.linkText ?? 'Open deck'

  return (
    <SlideBackground variant="gradient-subtle">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Red accent bar at top */}
        <motion.div
          {...accentBarAnimation}
          className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 px-16 max-w-[900px] w-full text-center"
        >
          {/* Title */}
          <motion.h2
            variants={itemFadeUpVariants}
            className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-2"
          >
            {slide.title}
          </motion.h2>

          {/* Subtitle */}
          {slide.subtitle && (
            <motion.p
              variants={itemFadeUpVariants}
              className="text-text-secondary text-body-lg mb-8 leading-relaxed"
            >
              {slide.subtitle}
            </motion.p>
          )}

          {/* Body */}
          {slide.body && (
            <motion.p
              variants={itemFadeUpVariants}
              className="text-text-muted text-body mb-10 leading-relaxed max-w-2xl mx-auto"
            >
              {slide.body}
            </motion.p>
          )}

          {/* Clickable link card */}
          <motion.a
            variants={itemScaleVariants}
            href={slide.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="inline-flex flex-col items-center gap-5 px-12 py-10 rounded-2xl bg-background-elevated border border-border hover:border-brand-red/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-brand-red/10 transition-all group cursor-pointer"
          >
            <div className="w-20 h-20 rounded-2xl bg-brand-red/10 flex items-center justify-center group-hover:bg-brand-red/20 transition-colors">
              <Icon className="w-10 h-10 text-brand-red" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-2 text-text-primary font-display font-semibold text-h3">
              <span>{linkText}</span>
              <ArrowUpRight
                className="w-5 h-5 text-brand-red transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                strokeWidth={2.5}
              />
            </div>
          </motion.a>
        </motion.div>

        <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
