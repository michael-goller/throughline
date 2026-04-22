import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  size?: number
}

export default function CopyButton({ value, label = 'Copy', className = '', size = 14 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(value)
    } catch {
      // Clipboard permission denied or unavailable — fall through to UI feedback.
    }
    setCopied(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 1400)
  }, [value])

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${value}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-tiny font-medium text-text-muted hover:text-text-primary hover:bg-background-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background-elevated ${className}`}
    >
      {copied ? <Check size={size} className="text-accent-green" /> : <Copy size={size} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}
