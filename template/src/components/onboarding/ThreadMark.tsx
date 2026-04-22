import { motion, useReducedMotion } from 'framer-motion'

interface ThreadMarkProps {
  size?: number
  className?: string
  /**
   * Color token for the mark. Defaults to `var(--brand-red)` for the original
   * onboarding / viewer-watermark callsites (deck-content surface). Pass
   * `var(--accent-primary)` on app chrome (dashboard, header, cards) so the
   * mark picks up the Throughline terra-cotta instead of the Avery red.
   */
  color?: string
  /**
   * Skip the draw-in animation. Use on persistent chrome (card thumbnails,
   * empty-states) where the mark should read as a static visual anchor.
   */
  staticMark?: boolean
}

/**
 * Brand thread mark — vertical stroke + arrow + horizontal stroke. Draws in
 * when motion is allowed; renders static under `prefers-reduced-motion: reduce`
 * or when `staticMark` is set.
 *
 * Sourced from the viewer watermark at `ViewerPage.tsx:215` — keep this
 * visually locked to that artwork so the brand moment matches across surfaces.
 */
export default function ThreadMark({
  size = 88,
  className = '',
  color = 'var(--brand-red)',
  staticMark = false,
}: ThreadMarkProps) {
  const reduce = useReducedMotion()
  const skipAnim = reduce || staticMark
  const duration = skipAnim ? 0 : 0.6

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      style={{ color }}
    >
      <motion.path
        d="M10 5 L10 19.75"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="butt"
        fill="none"
        initial={skipAnim ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration, ease: 'easeOut' }}
      />
      <motion.polygon
        points="10,19.75 12.25,22 10,24.25 7.75,22"
        fill="currentColor"
        initial={skipAnim ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: duration * 0.6, duration: skipAnim ? 0 : 0.2 }}
        style={{ transformOrigin: '10px 22px' }}
      />
      <motion.path
        d="M12.25 22 L26 22"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="butt"
        fill="none"
        initial={skipAnim ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: duration * 0.7, duration, ease: 'easeOut' }}
      />
    </svg>
  )
}
