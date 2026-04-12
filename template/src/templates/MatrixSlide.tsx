import { motion } from 'framer-motion'
import { ArrowRight, ArrowUp } from 'lucide-react'
import type { MatrixSlideConfig } from '../types'
import { EASE_OUT } from '../utils/animations'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
}

const quadrantColors = {
  topLeft: 'bg-green-500/20 border-green-500/40',
  topRight: 'bg-blue-500/20 border-blue-500/40',
  bottomLeft: 'bg-yellow-500/20 border-yellow-500/40',
  bottomRight: 'bg-red-500/20 border-red-500/40',
}

interface Props {
  slide: MatrixSlideConfig
}

export default function MatrixSlide({ slide }: Props) {
  const { title, xAxis, yAxis, quadrants } = slide

  const renderQuadrant = (
    items: typeof quadrants.topLeft,
    position: keyof typeof quadrantColors
  ) => (
    <motion.div
      variants={itemVariants}
      className={`flex flex-col gap-2 p-6 rounded-lg border ${quadrantColors[position]}`}
    >
      {items.map((item, i) => (
        <div key={i} className="text-text">
          <span className="font-medium">{item.label}</span>
          {item.description && (
            <span className="text-text-muted text-sm ml-2">
              — {item.description}
            </span>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-text-muted text-sm italic opacity-0">—</div>
      )}
    </motion.div>
  )

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-bold text-text mb-8"
        >
          {title}
        </motion.h1>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-5xl"
      >
        {/* Y-axis label */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
        >
          <ArrowUp className="w-4 h-4 text-text-muted" />
          <span className="text-text-muted text-sm font-medium [writing-mode:vertical-lr] rotate-180">
            {yAxis}
          </span>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {renderQuadrant(quadrants.topLeft, 'topLeft')}
          {renderQuadrant(quadrants.topRight, 'topRight')}
          {renderQuadrant(quadrants.bottomLeft, 'bottomLeft')}
          {renderQuadrant(quadrants.bottomRight, 'bottomRight')}
        </div>

        {/* X-axis label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-1 mt-4"
        >
          <span className="text-text-muted text-sm font-medium">
            {xAxis}
          </span>
          <ArrowRight className="w-4 h-4 text-text-muted" />
        </motion.div>
      </motion.div>
    </div>
  )
}
