import { motion } from 'framer-motion'
import type { IconGridSlideConfig } from '../types'
import { containerVariants, itemScaleVariants } from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

interface Props {
  slide: IconGridSlideConfig
}

export default function IconGridSlide({ slide }: Props) {
  const { title, subtitle, items, columns = 3, callout } = slide

  const isSingleColumn = columns === 1

  const gridCols = {
    1: 'grid-cols-1 max-w-3xl',
    2: 'grid-cols-2 max-w-3xl',
    3: 'grid-cols-3 max-w-4xl',
    4: 'grid-cols-4 max-w-5xl',
  }[columns]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-bold text-text mb-2"
        >
          {title}
        </motion.h1>
      )}

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-text-muted text-lg italic mb-8 text-center max-w-3xl"
        >
          {subtitle}
        </motion.p>
      )}

      {!subtitle && title && <div className="mb-8" />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid ${gridCols} ${isSingleColumn ? 'gap-4' : 'gap-6'} w-full`}
      >
        {items.map((item, i) => {
          const Icon = resolveIcon(item.icon)
          if (!Icon) return null

          if (isSingleColumn) {
            return (
              <motion.div
                key={i}
                variants={itemScaleVariants}
                className="flex items-start gap-5 p-5 rounded-xl bg-nav-bg/50 border border-text-muted/10 hover:border-brand-red/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-brand-red/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold text-text mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-text-muted text-sm leading-relaxed">{item.description}</p>
                  )}
                </div>
              </motion.div>
            )
          }

          return (
            <motion.div
              key={i}
              variants={itemScaleVariants}
              className="flex flex-col items-center text-center p-5 rounded-xl bg-nav-bg/50 border border-text-muted/10 hover:border-brand-red/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-red/20 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-brand-red" />
              </div>
              <h3 className="font-display text-base font-semibold text-text mb-1">{item.title}</h3>
              {item.description && (
                <p className="text-text-muted text-sm leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.owner && (
                <p className="text-text-muted/70 text-xs mt-2">
                  Owner: {item.owner}
                </p>
              )}
              {item.deadline && (
                <p className="text-brand-red/80 text-xs font-medium mt-1">
                  {item.deadline}
                </p>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {callout && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 max-w-3xl w-full border-l-4 border-brand-red/40 bg-brand-red/5 rounded-r-lg px-6 py-3"
        >
          <p className="text-text-muted text-sm leading-relaxed italic">
            {callout}
          </p>
        </motion.div>
      )}
    </div>
  )
}
