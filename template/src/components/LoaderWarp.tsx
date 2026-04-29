import { motion, AnimatePresence } from 'framer-motion'

interface LoaderWarpProps {
  visible: boolean
}

/**
 * Full-bleed "high-speed motion-blur" loader. Theme-aware backdrop with a
 * heavily-blurred central mass that pulses in scale to read as
 * "approaching a destination too fast to see clearly." Loops infinitely
 * until `visible` flips false, then exits via AnimatePresence.
 */
export default function LoaderWarp({ visible }: LoaderWarpProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="warp"
          className="warp-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="warp-haze" aria-hidden />
          <div className="warp-destination" aria-hidden />
          <div className="warp-vignette" aria-hidden />
          <span role="status" aria-live="polite" className="sr-only">
            Loading deck
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
