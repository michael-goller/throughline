import { motion } from 'framer-motion'
import type { TitleSlideDigitalConfig } from '../types'
import {
  ClassificationMark,
  RoundedTriangle,
  NeuralNetwork,
  TerminalPrompt,
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
  slide: TitleSlideDigitalConfig
}

export default function TitleSlideDigital({ slide }: Props) {
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
        className="relative z-10 text-center px-16 max-w-[1100px]"
      >
        <motion.h1
          variants={itemVariants}
          className="text-h1 md:text-hero font-bold text-white leading-tight mb-10"
        >
          {slide.title}
        </motion.h1>

        {slide.subtitle && (
          <motion.p
            variants={itemVariants}
            className="text-h2 md:text-h1 text-white/90 font-semibold mb-12"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {slide.tagline && (
          <motion.p
            variants={itemVariants}
            className="text-h3 md:text-h2 text-white/70 font-normal"
          >
            {slide.tagline}
          </motion.p>
        )}
      </motion.div>

      {/* Terminal prompt - bottom left */}
      <div className="absolute bottom-6 left-8 z-20">
        <TerminalPrompt
          opacity={0.5}
          onNavigate={() => {
            // Dispatch a synthetic event that bypasses our capture handler
            const event = new KeyboardEvent('keydown', {
              key: 'ArrowRight',
              bubbles: true,
              cancelable: true,
            })
            // Mark it as synthetic so we don't intercept it again
            ;(event as any)._synthetic = true
            document.dispatchEvent(event)
          }}
        />
      </div>

      {/* Classification mark */}
      <ClassificationMark className="text-white/50" />
    </div>
  )
}
