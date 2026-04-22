import { motion, useReducedMotion } from 'framer-motion'

interface ThreadMarkProps {
  size?: number
  className?: string
}

/**
 * Brand thread mark — vertical stroke + arrow + horizontal stroke. Draws in when
 * motion is allowed; renders static under `prefers-reduced-motion: reduce`.
 *
 * Sourced from the viewer watermark at `ViewerPage.tsx:215` — keep this visually
 * locked to that artwork so the brand moment matches across surfaces.
 */
export default function ThreadMark({ size = 88, className = '' }: ThreadMarkProps) {
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.6

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      style={{ color: 'var(--brand-red)' }}
    >
      <motion.path
        d="M10 5 L10 19.75"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="butt"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration, ease: 'easeOut' }}
      />
      <motion.polygon
        points="10,19.75 12.25,22 10,24.25 7.75,22"
        fill="currentColor"
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: duration * 0.6, duration: reduce ? 0 : 0.2 }}
        style={{ transformOrigin: '10px 22px' }}
      />
      <motion.path
        d="M12.25 22 L26 22"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="butt"
        fill="none"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: duration * 0.7, duration, ease: 'easeOut' }}
      />
    </svg>
  )
}
