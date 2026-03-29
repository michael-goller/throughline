import { motion } from 'framer-motion'
import type { TwoColumnSlideConfig, ColumnCard } from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import { containerVariants, itemFadeUpVariants, cardFadeUpVariants, accentBarAnimation } from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

interface Props {
  slide: TwoColumnSlideConfig
}

function ColumnCardComponent({ card }: { card: ColumnCard }) {
  const Icon = card.icon ? resolveIcon(card.icon) : undefined
  return (
    <motion.div
      variants={cardFadeUpVariants}
      className="p-8 rounded-xl bg-background-elevated border border-border h-full"
    >
      <div className="flex items-center gap-4 mb-6">
        {Icon && !card.number && (
          <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        {card.number && (
          <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
            <span className="text-white text-h3 font-bold">{card.number}</span>
          </div>
        )}
        <h3 className="font-display text-h3 font-semibold text-text-primary">
          {card.title}
        </h3>
      </div>
      <p className="text-body-lg text-text-secondary leading-relaxed">
        {card.body}
      </p>
      {card.bullets && card.bullets.length > 0 && (
        <div className="mt-6 space-y-3">
          {card.bullets.map((bullet, index) => (
            <p key={index} className="text-body text-text-muted">
              • {bullet}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function TwoColumnSlide({ slide }: Props) {
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
        className="relative z-10 px-16 max-w-[1400px] w-full"
      >
        {/* Title */}
        <motion.div variants={itemFadeUpVariants} className="mb-12">
          <h2 className="font-display text-brand-red text-h2 md:text-h1 font-bold">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="text-text-secondary text-body-lg mt-2">{slide.subtitle}</p>
          )}
        </motion.div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ColumnCardComponent card={slide.left} />
          <ColumnCardComponent card={slide.right} />
        </div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
