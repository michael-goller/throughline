import { useMemo } from 'react'
import { motion } from 'framer-motion'
import CopyButton from './CopyButton'
import { STEP2_COPY, type OnboardingOS } from '../../lib/onboarding-copy'

interface Step2InstallProps {
  os: OnboardingOS
  onOSChange: (os: OnboardingOS) => void
  onAlreadyInstalled: () => void
  mobile?: boolean
}

export default function Step2Install({ os, onOSChange, onAlreadyInstalled, mobile = false }: Step2InstallProps) {
  const activeTab = useMemo(
    () => STEP2_COPY.tabs.find(t => t.os === os) ?? STEP2_COPY.tabs[0],
    [os],
  )

  return (
    <div className="flex flex-col gap-5 font-sans">
      <div className="space-y-1.5">
        <h2 className="font-display text-text-primary text-h4 font-bold tracking-tight">
          {STEP2_COPY.title}
        </h2>
      </div>

      {mobile ? (
        <label className="block">
          <span className="sr-only">Operating system</span>
          <select
            value={os}
            onChange={e => onOSChange(e.target.value as OnboardingOS)}
            className="w-full px-3 py-2 rounded-lg bg-background-accent border border-border text-text-primary text-caption focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30"
          >
            {STEP2_COPY.tabs.map(t => (
              <option key={t.os} value={t.os}>{t.label}</option>
            ))}
          </select>
        </label>
      ) : (
        <div className="flex items-center rounded-lg bg-background-accent border border-border overflow-hidden p-0.5 self-start">
          {STEP2_COPY.tabs.map(t => {
            const selected = t.os === os
            return (
              <button
                key={t.os}
                type="button"
                onClick={() => onOSChange(t.os)}
                aria-pressed={selected}
                className={`px-3 py-1.5 rounded-md text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 ${
                  selected
                    ? 'bg-background-elevated text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      )}

      <motion.div
        key={activeTab.os}
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-start justify-between gap-2 bg-background-accent border border-border rounded-lg px-3 py-2.5"
      >
        <code className="font-mono text-tiny text-text-primary leading-snug break-all flex-1 pt-0.5">
          {activeTab.command}
        </code>
        <CopyButton value={activeTab.command} />
      </motion.div>

      <p className="text-text-muted text-tiny leading-relaxed">
        {STEP2_COPY.verify[0]}{' '}
        <code className="font-mono text-text-primary bg-background-accent px-1 py-0.5 rounded">
          {STEP2_COPY.verify[1]}
        </code>{' '}
        {STEP2_COPY.verify[2]}{' '}
        <code className="font-mono px-1 py-0.5 rounded" style={{ color: 'var(--brand-red)' }}>
          {STEP2_COPY.verify[3]}
        </code>.
      </p>

      <button
        type="button"
        onClick={onAlreadyInstalled}
        className="self-start text-tiny text-text-muted hover:text-text-primary underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 rounded"
      >
        {STEP2_COPY.alreadyInstalled}
      </button>
    </div>
  )
}
