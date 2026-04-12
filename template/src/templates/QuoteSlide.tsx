import { motion } from 'framer-motion'
import type { QuoteSlideConfig } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerSlowVariants, itemBlurFadeVariants } from '../utils/animations'

interface Props {
  slide: QuoteSlideConfig
}

function SplitVariant({ slide }: Props) {
  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Red left panel - 40% */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-[40%] h-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #E31937 0%, #B31329 100%)',
        }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-[300px] font-serif text-white leading-none"
        >
          "
        </motion.div>
      </motion.div>

      {/* Dark right panel - 60% */}
      <div className="w-[60%] h-full bg-background flex items-center px-16">
        <motion.div
          variants={containerSlowVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[600px]"
        >
          <motion.blockquote
            variants={itemBlurFadeVariants}
            className="font-display text-h2 md:text-h1 text-text-primary font-medium leading-snug mb-10"
          >
            {slide.quote}
          </motion.blockquote>

          <motion.div variants={itemBlurFadeVariants}>
            <p className="font-display text-brand-red text-h3 font-semibold">
              {slide.author}
            </p>
            {slide.authorTitle && (
              <p className="text-text-secondary text-body-lg mt-1">
                {slide.authorTitle}
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}

function FullVariant({ slide }: Props) {
  return (
    <SlideBackground variant="gradient-radial">
      <div className="relative w-full h-full flex items-center justify-center">
      {/* Large quote mark background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.05 }}
        transition={{ duration: 0.8 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 text-[500px] font-serif text-brand-red leading-none pointer-events-none"
      >
        "
      </motion.div>

      {/* Content */}
      <motion.div
        variants={containerSlowVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-16 max-w-[1000px]"
      >
        <motion.blockquote
          variants={itemBlurFadeVariants}
          className="font-display text-h2 md:text-h1 text-text-primary font-medium leading-snug mb-12"
        >
          "{slide.quote}"
        </motion.blockquote>

        <motion.div variants={itemBlurFadeVariants}>
          <p className="font-display text-brand-red text-h3 font-semibold">
            — {slide.author}
          </p>
          {slide.authorTitle && (
            <p className="text-text-secondary text-body-lg mt-2">
              {slide.authorTitle}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
      </div>
    </SlideBackground>
  )
}

export default function QuoteSlide({ slide }: Props) {
  const variant = slide.variant || 'split'

  if (variant === 'full') {
    return <FullVariant slide={slide} />
  }

  return <SplitVariant slide={slide} />
}
