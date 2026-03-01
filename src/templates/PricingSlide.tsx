import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { PricingSlideConfig } from '../types'

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

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
}

interface Props {
  slide: PricingSlideConfig
}

export default function PricingSlide({ slide }: Props) {
  const { title, tiers } = slide

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-12">
      {title && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-text mb-10"
        >
          {title}
        </motion.h1>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-6 items-stretch"
      >
        {tiers.map((tier, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className={`
              flex flex-col w-72 rounded-xl border overflow-hidden
              ${tier.highlight
                ? 'bg-brand-red/10 border-brand-red scale-105 shadow-lg shadow-brand-red/20'
                : 'bg-nav-bg border-text-muted/20'
              }
            `}
          >
            {/* Header */}
            <div className={`px-6 py-5 ${tier.highlight ? 'bg-brand-red/20' : ''}`}>
              <h3 className="text-lg font-semibold text-text">{tier.name}</h3>
              {tier.description && (
                <p className="text-text-muted text-sm mt-1">{tier.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="px-6 py-4 border-b border-text-muted/10">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${tier.highlight ? 'text-brand-red' : 'text-text'}`}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-text-muted text-sm">/{tier.period}</span>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="flex-1 px-6 py-4">
              <ul className="space-y-3">
                {tier.features.map((feature, j) => (
                  <motion.li
                    key={j}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 + j * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-brand-red' : 'text-green-500'}`} />
                    <span className="text-text text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            {tier.cta && (
              <div className="px-6 pb-6">
                <div
                  className={`
                    py-3 px-4 rounded-lg text-center font-medium text-sm
                    ${tier.highlight
                      ? 'bg-brand-red text-white'
                      : 'bg-text-muted/10 text-text'
                    }
                  `}
                >
                  {tier.cta}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
