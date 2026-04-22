import { motion } from 'framer-motion'
import ThreadMark from './ThreadMark'
import { STEP1_COPY } from '../../lib/onboarding-copy'

interface Step1IntroProps {
  compact?: boolean
}

export default function Step1Intro({ compact = false }: Step1IntroProps) {
  const size = compact ? 64 : 88

  return (
    <div className="flex flex-col items-center text-center gap-6 pt-2 pb-4">
      <ThreadMark size={size} />

      <div className="space-y-1">
        {STEP1_COPY.lines.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08, duration: 0.24 }}
            className="font-display text-text-primary text-body-lg font-bold tracking-tight leading-tight"
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.3 }}
        className="font-sans text-text-muted text-body-sm leading-relaxed max-w-[420px]"
      >
        {STEP1_COPY.sub}
      </motion.p>
    </div>
  )
}
