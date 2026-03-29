import { motion } from 'framer-motion'
import type { IconGridSlideConfig } from '../types'
import { containerVariants, itemScaleVariants } from '../utils/animations'
import { resolveIcon } from '../utils/iconResolver'

interface Props {
  slide: IconGridSlideConfig
}

export default function IconGridSlide({ slide }: Props) {
  const { title, items, columns = 3 } = slide

  const gridCols = {
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
          className="font-display text-4xl font-bold text-text mb-12"
        >
          {title}
        </motion.h1>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid ${gridCols} gap-8 w-full`}
      >
        {items.map((item, i) => {
          const Icon = resolveIcon(item.icon)
          if (!Icon) return null
          return (
            <motion.div
              key={i}
              variants={itemScaleVariants}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-nav-bg/50 border border-text-muted/10 hover:border-brand-red/30 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-brand-red/20 flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-brand-red" />
              </div>
              <h3 className="font-display text-lg font-semibold text-text mb-2">{item.title}</h3>
              {item.description && (
                <p className="text-text-muted text-sm leading-relaxed">
                  {item.description}
                </p>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
