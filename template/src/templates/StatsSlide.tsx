import { motion } from 'framer-motion'
import type { StatsSlideConfig, StatItem } from '../types'
import { useCountUp } from '../hooks/useCountUp'
import { ClassificationMark, SlideBackground } from '../components'
import { containerVariants, itemFadeUpVariants, itemScaleCenterVariants, accentBarAnimation } from '../utils/animations'

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
      variants={itemScaleCenterVariants}
      className="p-8 rounded-xl bg-background-elevated border border-border text-center"
    >
      <div className="font-display text-brand-red text-hero md:text-[5rem] font-bold leading-none mb-4">
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
        className="relative z-10 px-16 max-w-[1200px] w-full"
      >
        {/* Title */}
        {slide.title && (
          <motion.h2
            variants={itemFadeUpVariants}
            className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-12 text-center"
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
    </SlideBackground>
  )
}
