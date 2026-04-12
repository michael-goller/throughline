import { motion } from 'framer-motion'
import type { FishboneSlideConfig } from '../types'

interface Props {
  slide: FishboneSlideConfig
}

// Use the brand red color directly for SVG compatibility
const BRAND_RED = '#E31937'

export default function FishboneSlide({ slide }: Props) {
  const { title, problem, branches } = slide

  // Layout constants
  const width = 900
  const height = 420
  const spineY = height / 2
  const headWidth = 160
  const spineStartX = 40
  const spineEndX = width - headWidth - 20
  const boneLength = 100
  const boneAngle = 55 // degrees

  // Calculate bone positions - evenly distributed along spine
  const branchCount = branches.length
  const availableWidth = spineEndX - spineStartX - 80
  const spacing = availableWidth / Math.max(branchCount - 1, 1)
  const startOffset = spineStartX + 60

  // Convert angle to radians for calculations
  const angleRad = (boneAngle * Math.PI) / 180
  const boneOffsetX = Math.cos(angleRad) * boneLength
  const boneOffsetY = Math.sin(angleRad) * boneLength

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-bold text-text mb-6"
        >
          {title}
        </motion.h1>
      )}

      <div className="relative" style={{ width, height }}>
        {/* SVG for spine and bones */}
        <svg
          className="absolute inset-0"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
        >
          {/* Main spine */}
          <motion.line
            x1={spineStartX}
            y1={spineY}
            x2={spineEndX}
            y2={spineY}
            stroke={BRAND_RED}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* Diagonal bones */}
          {branches.map((_, i) => {
            const x = startOffset + spacing * i
            const isTop = i % 2 === 0
            const endX = x - boneOffsetX
            const endY = isTop ? spineY - boneOffsetY : spineY + boneOffsetY

            return (
              <motion.line
                key={i}
                x1={x}
                y1={spineY}
                x2={endX}
                y2={endY}
                stroke={BRAND_RED}
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
              />
            )
          })}

          {/* Arrow connecting to fish head */}
          <motion.path
            d={`M ${spineEndX} ${spineY} L ${spineEndX + 15} ${spineY}`}
            stroke={BRAND_RED}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.9 }}
          />
        </svg>

        {/* Branch labels */}
        {branches.map((branch, i) => {
          const x = startOffset + spacing * i
          const isTop = i % 2 === 0
          const labelX = x - boneOffsetX - 10
          const labelY = isTop ? spineY - boneOffsetY - 10 : spineY + boneOffsetY + 10

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: isTop ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.12 }}
              className="absolute"
              style={{
                left: labelX,
                top: isTop ? 'auto' : labelY,
                bottom: isTop ? height - labelY : 'auto',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="flex flex-col items-center">
                {!isTop && (
                  <>
                    <div className="text-brand-red font-semibold text-sm uppercase tracking-wide">
                      {branch.category}
                    </div>
                    {branch.causes.map((cause, j) => (
                      <div key={j} className="text-text-muted text-sm">
                        {cause}
                      </div>
                    ))}
                  </>
                )}
                {isTop && (
                  <>
                    {branch.causes.slice().reverse().map((cause, j) => (
                      <div key={j} className="text-text-muted text-sm">
                        {cause}
                      </div>
                    ))}
                    <div className="text-brand-red font-semibold text-sm uppercase tracking-wide">
                      {branch.category}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* Problem (fish head) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="absolute"
          style={{
            right: 0,
            top: spineY,
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="flex items-center justify-center bg-brand-red/10 border-2 border-brand-red rounded-r-full"
            style={{ width: headWidth, height: 80, paddingLeft: 20, paddingRight: 24 }}
          >
            <span className="text-text font-bold text-center leading-tight">
              {problem}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
