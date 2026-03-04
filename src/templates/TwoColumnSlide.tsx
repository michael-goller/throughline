import { motion } from 'framer-motion'
import type { TwoColumnSlideConfig, ColumnCard } from '../types'
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
  slide: TwoColumnSlideConfig
}

function ColumnCardComponent({ card }: { card: ColumnCard }) {
  return (
    <motion.div
      variants={cardVariants}
      className="p-8 rounded-xl bg-background-elevated border border-border h-full"
    >
      <div className="flex items-center gap-4 mb-6">
        {card.icon && !card.number && (
          <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
            <card.icon className="w-6 h-6 text-white" />
          </div>
        )}
        {card.number && (
          <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
            <span className="text-white text-h3 font-bold">{card.number}</span>
          </div>
        )}
        <h3 className="text-h3 font-semibold text-text-primary">
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
        <motion.div variants={itemVariants} className="mb-12">
          <h2 className="text-brand-red text-h2 md:text-h1 font-bold">
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
  )
}
