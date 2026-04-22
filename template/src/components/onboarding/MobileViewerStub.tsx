import { ExternalLink } from 'lucide-react'
import Step1Intro from './Step1Intro'
import { MOBILE_VIEWER_COPY, SKIP_LABEL } from '../../lib/onboarding-copy'

interface MobileViewerStubProps {
  onDismiss: () => void
}

export default function MobileViewerStub({ onDismiss }: MobileViewerStubProps) {
  return (
    <div className="flex flex-col gap-5">
      <Step1Intro compact />

      <div className="flex flex-col gap-3 pt-1">
        <a
          href={MOBILE_VIEWER_COPY.ctaHref}
          target="_blank"
          rel="noreferrer"
          onClick={onDismiss}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-caption font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-elevated focus-visible:ring-brand-red/30"
          style={{ backgroundColor: 'var(--brand-red)' }}
        >
          {MOBILE_VIEWER_COPY.cta}
          <ExternalLink size={14} />
        </a>
        <button
          type="button"
          onClick={onDismiss}
          className="text-tiny text-text-muted hover:text-text-primary underline-offset-4 hover:underline self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 rounded"
        >
          {SKIP_LABEL}
        </button>
      </div>
    </div>
  )
}
