import { motion } from 'framer-motion'
import type { QASlideConfig } from '../types'
import {
  ClassificationMark,
  RoundedTriangle,
  NeuralNetwork,
} from '../components'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
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
  slide: QASlideConfig
}

export default function QASlide({ slide }: Props) {
  const text = slide.text || 'Q+A'

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Red gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #E31937 0%, #B31329 50%, #731C3F 100%)',
        }}
      />

      {/* Neural network animation layer - right half only */}
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <NeuralNetwork
          nodeCount={80}
          baseColor="rgba(255, 255, 255, 0.15)"
          glowColor="rgba(255, 200, 200, 0.8)"
          fireRate={100}
          connectionDistance={200}
        />
      </div>

      {/* Decorative rounded triangle - Avery Dennison brand element */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] aspect-video translate-x-[3%]">
          <RoundedTriangle
            rotation={120}
            fill="rgba(0,0,0,0.12)"
          />
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-16"
      >
        {/* Q+A Text */}
        <motion.h1
          variants={itemVariants}
          className="text-[10rem] md:text-[14rem] font-bold text-white leading-none tracking-tight"
        >
          {text}
        </motion.h1>

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            variants={itemVariants}
            className="text-h2 md:text-h1 text-white/80 font-normal mt-8"
          >
            {slide.subtitle}
          </motion.p>
        )}
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark className="text-white/50" />
    </div>
  )
}
