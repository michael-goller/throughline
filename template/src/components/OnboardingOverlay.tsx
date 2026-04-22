import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import Step1Intro from './onboarding/Step1Intro'
import Step2Install from './onboarding/Step2Install'
import Step3FirstDeck from './onboarding/Step3FirstDeck'
import Step4ConnectAgent from './onboarding/Step4ConnectAgent'
import MobileViewerStub from './onboarding/MobileViewerStub'
import { SKIP_LABEL, STEP1_COPY, STEP2_COPY, STEP3_COPY, STEP4_COPY } from '../lib/onboarding-copy'
import type { OnboardingContext, OnboardingStep, UseOnboardingReturn } from '../hooks/useOnboarding'

interface OnboardingOverlayProps {
  controller: UseOnboardingReturn
  context: OnboardingContext
  /** Element to focus after completion (desktop dashboard context). */
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

/** Primary CTA label for the current step. */
function primaryLabel(step: OnboardingStep, isLast: boolean): string {
  if (isLast) return STEP4_COPY.primary
  if (step === 1) return STEP1_COPY.primary
  if (step === 2) return STEP2_COPY.primary
  if (step === 3) return STEP3_COPY.primary
  return STEP4_COPY.primary
}

export default function OnboardingOverlay({ controller, context, returnFocusRef }: OnboardingOverlayProps) {
  const reduce = useReducedMotion()
  const { open, step, os, setOS, next, prev, dismiss, complete, steps, isFirst, isLast } = controller
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryBtnRef = useRef<HTMLButtonElement>(null)

  const isMobileViewer = context === 'viewer-mobile'
  const showProgressAndCounter = !isMobileViewer && step !== 1

  const onPrimary = useCallback(() => {
    if (isLast) {
      complete()
      // Return focus to the dashboard's New deck button after a paint so it's
      // mounted. Tailwind strips the browser default outline; the returned
      // element must set `focus-visible:ring` itself to show a ring.
      if (returnFocusRef?.current) {
        window.requestAnimationFrame(() => returnFocusRef.current?.focus())
      }
      return
    }
    next()
  }, [isLast, complete, next, returnFocusRef])

  // Esc / arrow-key navigation and focus trap. Keep the handler effect cheap —
  // it only runs while the overlay is open.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss()
        return
      }
      if (e.key === 'ArrowLeft') {
        if (!isFirst) {
          e.preventDefault()
          prev()
        }
        return
      }
      if (e.key === 'ArrowRight') {
        if (!isLast) {
          e.preventDefault()
          next()
        }
        return
      }
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement
        // Don't hijack Enter inside text inputs or buttons that already handle it.
        const tag = target?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
        if (tag === 'BUTTON' || tag === 'A') return
        e.preventDefault()
        onPrimary()
      }
    }

    const onFocusIn = (e: FocusEvent) => {
      const card = cardRef.current
      if (!card) return
      const target = e.target as Node
      if (!card.contains(target)) {
        // Focus escaped the card — pull it back to the primary CTA.
        primaryBtnRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)

    // Focus the primary CTA on open / step change so keyboard users land on
    // something actionable without needing to tab.
    window.requestAnimationFrame(() => primaryBtnRef.current?.focus())

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open, step, dismiss, next, prev, isFirst, isLast, onPrimary])

  if (!open) return null

  const scrimMotion = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }

  const cardMotion = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 8 },
      }

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-scrim"
        {...scrimMotion}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />
      <motion.div
        key="onboarding-card"
        ref={cardRef}
        {...cardMotion}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={`fixed z-50 inset-0 flex ${
          isMobileViewer ? 'items-end md:items-center' : 'items-center md:items-center items-end'
        } justify-center p-4 pointer-events-none`}
      >
        <div
          className={`pointer-events-auto w-full bg-background-elevated border border-border shadow-2xl flex flex-col overflow-hidden ${
            // Mobile: bottom-sheet rounded top corners only; desktop: centered card.
            'md:max-w-[560px] md:rounded-2xl rounded-t-3xl md:rounded-t-2xl'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          {showProgressAndCounter ? (
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span
                id="onboarding-title"
                className="font-display text-[11px] tracking-[0.2em] text-text-muted uppercase"
              >
                {String(step).padStart(2, '0')} / {String(steps[steps.length - 1]).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close onboarding"
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-background-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end px-5 pt-4">
              <span id="onboarding-title" className="sr-only">
                {step === 1 ? 'Welcome to Throughline' : 'Continue on desktop'}
              </span>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close onboarding"
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-background-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 pb-5 pt-2 overflow-y-auto max-h-[min(75vh,640px)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isMobileViewer ? 'mobile' : `step-${step}`}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
              >
                {isMobileViewer ? (
                  <MobileViewerStub onDismiss={dismiss} />
                ) : step === 1 ? (
                  <Step1Intro />
                ) : step === 2 ? (
                  <Step2Install
                    os={os}
                    onOSChange={setOS}
                    onAlreadyInstalled={next}
                  />
                ) : step === 3 ? (
                  <Step3FirstDeck />
                ) : (
                  <Step4ConnectAgent />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {!isMobileViewer && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
              <button
                type="button"
                onClick={dismiss}
                className="text-tiny text-text-muted hover:text-text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 rounded"
              >
                {SKIP_LABEL}
              </button>

              <div className="flex items-center gap-2">
                {showProgressAndCounter && (
                  <div className="flex items-center gap-1.5 mr-2" aria-hidden="true">
                    {steps.slice(1).map(s => (
                      <span
                        key={s}
                        className="h-[2px] w-6 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            s === step || steps.indexOf(s) < steps.indexOf(step)
                              ? 'var(--brand-red)'
                              : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={prev}
                  disabled={isFirst}
                  className="px-3 py-1.5 text-caption text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 rounded-md"
                >
                  ← Back
                </button>
                <button
                  ref={primaryBtnRef}
                  type="button"
                  onClick={onPrimary}
                  className="px-4 py-2 rounded-lg text-caption font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-elevated focus-visible:ring-brand-red/30"
                  style={{ backgroundColor: 'var(--brand-red)' }}
                >
                  {primaryLabel(step, isLast)}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
