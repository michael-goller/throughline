import CopyButton from './CopyButton'
import { STEP3_COPY } from '../../lib/onboarding-copy'

export default function Step3FirstDeck() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <h2 className="font-display text-text-primary text-h4 font-bold tracking-tight">
          {STEP3_COPY.title}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {STEP3_COPY.cards.map(card => (
          <div
            key={card.command}
            className={`rounded-xl border px-4 py-3 flex flex-col gap-2 ${
              card.primary
                ? 'border-border-accent bg-background-accent/60'
                : 'border-border bg-background-elevated'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-body-sm text-text-primary leading-snug break-all">
                  {card.command}
                </p>
                <p className="text-text-muted text-tiny mt-0.5 uppercase tracking-wider font-display">
                  {card.label}
                </p>
              </div>
              <CopyButton value={card.command} />
            </div>
            <p className="text-text-muted text-caption leading-relaxed">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
