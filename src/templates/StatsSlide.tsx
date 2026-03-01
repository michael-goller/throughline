import { motion } from 'framer-motion'
import type { StatsSlideConfig, StatItem } from '../types'
import { useCountUp } from '../hooks/useCountUp'
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

interface StatCardProps {
  stat: StatItem
  delay: number
}

function StatCard({ stat, delay }: StatCardProps) {
  const count = useCountUp({
    end: stat.value,
    duration: 2000,
    delay: delay,
  })

  // Format the number (handle decimals if needed)
  const displayValue = stat.value % 1 === 0
    ? Math.round(count)
    : count.toFixed(1)

  return (
    <motion.div
      variants={cardVariants}
      className="p-8 rounded-xl bg-background-elevated border border-border text-center"
    >
      <div className="text-brand-red text-hero md:text-[5rem] font-bold leading-none mb-4">
        {stat.prefix}{displayValue}{stat.suffix}
      </div>
      <p className="text-text-secondary text-body-lg">
        {stat.label}
      </p>
    </motion.div>
  )
}

interface Props {
  slide: StatsSlideConfig
}

export default function StatsSlide({ slide }: Props) {
  const layout = slide.layout || '2x2'
  const stats = slide.stats.slice(0, 4) // Max 4 stats

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
        className="relative z-10 px-16 max-w-[1200px] w-full"
      >
        {/* Title */}
        {slide.title && (
          <motion.h2
            variants={itemVariants}
            className="text-brand-red text-h2 md:text-h1 font-bold mb-12 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Stats Grid */}
        <div
          className={
            layout === '1x4'
              ? 'grid grid-cols-4 gap-6'
              : 'grid grid-cols-2 gap-6'
          }
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              stat={stat}
              delay={300 + index * 150}
            />
          ))}
        </div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
