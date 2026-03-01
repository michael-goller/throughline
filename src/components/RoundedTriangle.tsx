import { motion } from 'framer-motion'

interface Props {
  /** Size multiplier (1 = original size relative to slide) */
  scale?: number
  /** Fill color */
  fill?: string
  /** Stroke color for outline */
  stroke?: string
  /** Stroke width */
  strokeWidth?: number
  /** Rotation in degrees */
  rotation?: number
  /** Additional CSS classes */
  className?: string
  /** Enable entrance animation */
  animate?: boolean
}

/**
 * Avery Dennison brand rounded triangle shape
 *
 * Extracted from official Avery Dennison presentation template.
 * The path creates a triangle with heavily rounded corners.
 */
export default function RoundedTriangle({
  scale = 1,
  fill = 'currentColor',
  stroke = 'none',
  strokeWidth = 2,
  rotation = 0,
  className = '',
  animate = false,
}: Props) {
  // Original path from Avery Dennison template - triangle pointing UP
  // Centered around (640, 360) in original 1280x720 viewBox
  const trianglePath = `M639.9987 78.30987
    c-31.747986 0 -63.498474 20.90532 -87.54901 62.60058
    l-179.48221 310.86346
    c-48.158752 83.44821 -8.765961 151.7222 87.60669 151.7222
    l358.85165 0
    c96.37262 0 135.76538 -68.27399 87.60669 -151.7222
    l-179.48224 -310.86346
    c-24.108215 -41.69526 -55.801025 -62.60058 -87.551575 -62.60058z`

  // Calculate the transform - rotate around center of the shape
  // The shape is roughly centered at (640, 360) in the original viewBox
  const centerX = 640
  const centerY = 360
  const transform = `rotate(${rotation} ${centerX} ${centerY}) scale(${scale})`

  const svgContent = (
    <svg
      viewBox="0 0 1280 720"
      className={className}
      style={{ width: '100%', height: '100%' }}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={trianglePath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        transform={transform}
      />
    </svg>
  )

  if (!animate) {
    return svgContent
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      style={{ width: '100%', height: '100%' }}
    >
      {svgContent}
    </motion.div>
  )
}
