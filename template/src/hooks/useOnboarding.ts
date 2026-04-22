import { useCallback, useEffect, useMemo, useState } from 'react'
import { ONBOARDING_LS, type OnboardingOS } from '../lib/onboarding-copy'

export type OnboardingContext = 'dashboard' | 'viewer-desktop' | 'viewer-mobile'
export type OnboardingStep = 1 | 2 | 3 | 4

function readLS(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLS(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // quota / disabled storage — silently ignore
  }
}

function removeLS(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function detectOS(): OnboardingOS {
  if (typeof navigator === 'undefined') return 'macos'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('linux') && !ua.includes('android')) return 'linux'
  return 'macos'
}

/**
 * `stepsFor` returns the ordered steps for a given context. Viewer cold-land desktop
 * skips step 3 (dashboard-only). Viewer cold-land mobile is step 1 only.
 */
export function stepsFor(context: OnboardingContext): OnboardingStep[] {
  if (context === 'dashboard') return [1, 2, 3, 4]
  if (context === 'viewer-desktop') return [1, 2, 4]
  return [1]
}

export interface UseOnboardingOptions {
  context: OnboardingContext
  /** Dashboard context: first-run auto-open requires decks.length === 0. */
  deckCount?: number
  /** When true, disables the auto-open branch entirely (use for SSR or hostile environments). */
  disabled?: boolean
}

export interface UseOnboardingReturn {
  open: boolean
  step: OnboardingStep
  os: OnboardingOS
  setOS: (os: OnboardingOS) => void
  next: () => void
  prev: () => void
  goTo: (step: OnboardingStep) => void
  dismiss: () => void
  complete: () => void
  resumeFromStored: () => void
  replayFromStart: () => void
  steps: OnboardingStep[]
  currentIndex: number
  isFirst: boolean
  isLast: boolean
}

export function useOnboarding(opts: UseOnboardingOptions): UseOnboardingReturn {
  const { context, deckCount, disabled } = opts
  const steps = useMemo(() => stepsFor(context), [context])

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<OnboardingStep>(steps[0])
  const [os, setOSState] = useState<OnboardingOS>(() => {
    const stored = readLS(ONBOARDING_LS.os)
    if (stored === 'macos' || stored === 'linux' || stored === 'windows') return stored
    return detectOS()
  })

  const setOS = useCallback((value: OnboardingOS) => {
    setOSState(value)
    writeLS(ONBOARDING_LS.os, value)
  }, [])

  // First-run detection runs once on mount.
  useEffect(() => {
    if (disabled) return
    const complete = readLS(ONBOARDING_LS.complete) === '1'
    if (complete) return
    const dismissed = readLS(ONBOARDING_LS.dismissed) === '1'
    if (dismissed) return

    if (context === 'dashboard' && (deckCount ?? 0) > 0) return

    // Honor stored resume step if within the context's allowed steps.
    const storedStep = Number(readLS(ONBOARDING_LS.step))
    const next = steps.includes(storedStep as OnboardingStep) ? (storedStep as OnboardingStep) : steps[0]
    setStep(next)
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, context, deckCount, steps.join(',')])

  const currentIndex = steps.indexOf(step)
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= steps.length - 1

  const goTo = useCallback((target: OnboardingStep) => {
    if (!steps.includes(target)) return
    setStep(target)
  }, [steps])

  const next = useCallback(() => {
    const idx = steps.indexOf(step)
    if (idx < 0) return
    if (idx >= steps.length - 1) return
    setStep(steps[idx + 1])
  }, [step, steps])

  const prev = useCallback(() => {
    const idx = steps.indexOf(step)
    if (idx <= 0) return
    setStep(steps[idx - 1])
  }, [step, steps])

  const dismiss = useCallback(() => {
    writeLS(ONBOARDING_LS.dismissed, '1')
    writeLS(ONBOARDING_LS.step, String(step))
    setOpen(false)
  }, [step])

  const complete = useCallback(() => {
    writeLS(ONBOARDING_LS.complete, '1')
    removeLS(ONBOARDING_LS.dismissed)
    removeLS(ONBOARDING_LS.step)
    setOpen(false)
  }, [])

  const resumeFromStored = useCallback(() => {
    removeLS(ONBOARDING_LS.dismissed)
    const storedStep = Number(readLS(ONBOARDING_LS.step))
    const target = steps.includes(storedStep as OnboardingStep) ? (storedStep as OnboardingStep) : steps[0]
    setStep(target)
    setOpen(true)
  }, [steps])

  const replayFromStart = useCallback(() => {
    removeLS(ONBOARDING_LS.dismissed)
    removeLS(ONBOARDING_LS.step)
    setStep(steps[0])
    setOpen(true)
  }, [steps])

  return {
    open,
    step,
    os,
    setOS,
    next,
    prev,
    goTo,
    dismiss,
    complete,
    resumeFromStored,
    replayFromStart,
    steps,
    currentIndex,
    isFirst,
    isLast,
  }
}
