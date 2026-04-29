import { motion, AnimatePresence } from 'framer-motion'

const STREAK_COUNT = 18
const STREAKS = Array.from({ length: STREAK_COUNT }, (_, i) => ({
  angle: (i / STREAK_COUNT) * 360,
  delay: i * 0.07,
}))

interface LoaderWarpProps {
  visible: boolean
}

/**
 * Full-bleed "warp drive" loader. Loops infinitely until `visible` flips
 * false, then exits via AnimatePresence (opacity fade + slight scale-up
 * so the underlying deck reveals naturally). No fixed run time — the loop
 * tracks however long the data takes.
 */
export default function LoaderWarp({ visible }: LoaderWarpProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="warp"
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-base, var(--background))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <div aria-hidden className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-0 h-0">
              {STREAKS.map(({ angle, delay }) => (
                <span
                  key={angle}
                  className="absolute top-0 left-0 block"
                  style={{ transform: `rotate(${angle}deg)`, transformOrigin: '0 0' }}
                >
                  <span
                    className="warp-streak block"
                    style={{ animationDelay: `${delay}s` }}
                  />
                </span>
              ))}
              <span className="warp-core" />
            </div>
          </div>
          <span role="status" aria-live="polite" className="sr-only">
            Loading deck
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
