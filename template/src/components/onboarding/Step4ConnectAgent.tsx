import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CopyButton from './CopyButton'
import { STEP4_COPY } from '../../lib/onboarding-copy'

export default function Step4ConnectAgent() {
  const [expanded, setExpanded] = useState<string | null>(STEP4_COPY.cards[0].id)

  return (
    <div className="flex flex-col gap-5 font-sans">
      <div className="space-y-1.5">
        <h2 className="font-display text-text-primary text-h4 font-bold tracking-tight">
          {STEP4_COPY.title}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {STEP4_COPY.cards.map(card => {
          const isOpen = expanded === card.id
          return (
            <div
              key={card.id}
              className={`rounded-xl border transition-colors ${
                card.disabled
                  ? 'border-border bg-background-elevated opacity-60'
                  : isOpen
                    ? 'border-border-accent bg-background-accent/60'
                    : 'border-border bg-background-elevated hover:border-border-accent'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (card.disabled) return
                  setExpanded(isOpen ? null : card.id)
                }}
                aria-expanded={isOpen}
                aria-controls={`agent-card-${card.id}`}
                disabled={card.disabled}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display text-text-primary text-body-sm font-semibold tracking-tight">
                    {card.name}
                  </p>
                  {!card.disabled && (
                    <p className="font-mono text-tiny text-text-muted mt-0.5 break-all">
                      {card.command}
                    </p>
                  )}
                </div>
                {card.disabled && (
                  <span className="text-tiny text-text-muted font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-border">
                    Soon
                  </span>
                )}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && !card.disabled && (
                  <motion.div
                    id={`agent-card-${card.id}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-2 border-t border-border/60 pt-3">
                      <div className="flex items-start justify-between gap-2 bg-background-accent border border-border rounded-lg px-3 py-2">
                        <code className="font-mono text-tiny text-text-primary leading-snug break-all flex-1 pt-0.5">
                          {card.command}
                        </code>
                        <CopyButton value={card.command} />
                      </div>
                      <p className="text-text-muted text-caption leading-relaxed">
                        {card.body}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <p className="text-text-muted text-tiny leading-relaxed pt-1 border-t border-border/40">
        Need help? <code className="font-mono text-text-primary">{STEP4_COPY.footer.help}</code>
        {' · '}
        <a
          href={STEP4_COPY.footer.siteUrl}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
          style={{ color: 'var(--brand-red)' }}
        >
          {STEP4_COPY.footer.site}
        </a>
        {' · '}
        <span>{STEP4_COPY.footer.channel}</span>
      </p>
    </div>
  )
}
