import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import type { ForceFieldSlideConfig, ForceItem } from '../types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const arrowVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  },
}

interface ForceArrowProps {
  item: ForceItem
  direction: 'driving' | 'restraining'
}

function ForceArrow({ item, direction }: ForceArrowProps) {
  const widthClass = {
    1: 'w-24',
    2: 'w-36',
    3: 'w-48',
  }[item.strength]

  const isDriving = direction === 'driving'

  return (
    <motion.div
      variants={arrowVariants}
      className={`flex items-center gap-3 ${isDriving ? 'flex-row' : 'flex-row-reverse'}`}
      style={{ originX: isDriving ? 0 : 1 }}
    >
      <span className={`text-text text-sm font-medium ${isDriving ? 'text-right' : 'text-left'} w-32`}>
        {item.label}
      </span>
      <div
        className={`h-8 ${widthClass} flex items-center ${
          isDriving
            ? 'bg-green-500/30 border-green-500 justify-end pr-1'
            : 'bg-red-500/30 border-red-500 justify-start pl-1'
        } border-2 rounded`}
      >
        {isDriving ? (
          <ArrowRight className="w-5 h-5 text-green-500" />
        ) : (
          <ArrowLeft className="w-5 h-5 text-red-500" />
        )}
      </div>
    </motion.div>
  )
}

interface Props {
  slide: ForceFieldSlideConfig
}

export default function ForceFieldSlide({ slide }: Props) {
  const { title, subject, driving, restraining } = slide

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-text mb-8"
        >
          {title}
        </motion.h1>
      )}

      <div className="flex items-start gap-8 w-full max-w-5xl">
        {/* Driving Forces (left) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col items-end gap-4"
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-500 font-semibold text-lg mb-2"
          >
            Driving Forces
          </motion.h3>
          {driving.map((item, i) => (
            <ForceArrow key={i} item={item} direction="driving" />
          ))}
        </motion.div>

        {/* Center - Subject */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-1 h-16 bg-text-muted/30" />
          <div className="w-48 py-6 px-4 bg-nav-bg border-2 border-brand-red rounded-lg text-center">
            <span className="text-text font-bold">{subject}</span>
          </div>
          <div className="w-1 h-16 bg-text-muted/30" />
        </motion.div>

        {/* Restraining Forces (right) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col items-start gap-4"
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 font-semibold text-lg mb-2"
          >
            Restraining Forces
          </motion.h3>
          {restraining.map((item, i) => (
            <ForceArrow key={i} item={item} direction="restraining" />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
