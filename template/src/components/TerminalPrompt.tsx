import { useState, useEffect, useCallback, useRef } from 'react'

interface Props {
  /** Opacity of the terminal (0-1) */
  opacity?: number
  /** Callback to trigger actual navigation after typing completes */
  onNavigate?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Minimal terminal prompt with blinking cursor
 *
 * Shows `> _` at rest. When navigation key is pressed, types out `./next`
 * then triggers actual navigation.
 */
export default function TerminalPrompt({
  opacity = 0.4,
  onNavigate,
  className = '',
}: Props) {
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const isTypingRef = useRef(false)

  const command = './next'

  // Blinking cursor effect
  useEffect(() => {
    if (isTyping) return // Don't blink while typing

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [isTyping])

  // Type out command
  const typeCommand = useCallback(() => {
    if (isTypingRef.current) return

    isTypingRef.current = true
    setIsTyping(true)
    setShowCursor(true)
    setText('')

    let index = 0

    const typeInterval = setInterval(() => {
      if (index < command.length) {
        setText(command.slice(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
        // Brief pause then "execute"
        setTimeout(() => {
          setIsExecuting(true)
          // Trigger actual navigation
          setTimeout(() => {
            onNavigate?.()
            // Reset state after navigation
            setTimeout(() => {
              setText('')
              setIsTyping(false)
              setIsExecuting(false)
              setShowCursor(true)
              isTypingRef.current = false
            }, 100)
          }, 150)
        }, 100)
      }
    }, 60) // Faster typing

    return () => clearInterval(typeInterval)
  }, [onNavigate])

  // Listen for navigation events and intercept them
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip synthetic events (from our own onNavigate callback)
      if ((e as any)._synthetic) return

      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Only intercept forward navigation keys
      if (
        e.key === 'ArrowRight' ||
        e.key === ' ' ||
        e.key === 'Enter' ||
        e.key === 'ArrowDown'
      ) {
        // Prevent immediate navigation
        e.preventDefault()
        e.stopPropagation()
        // Start typing animation
        typeCommand()
      }
    }

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [typeCommand])

  return (
    <div
      className={`font-mono text-sm select-none ${className}`}
      style={{ opacity }}
    >
      <span className="text-white/70">&gt; </span>
      <span
        className={`text-white transition-all duration-100 ${
          isExecuting ? 'text-green-400' : ''
        }`}
      >
        {text}
      </span>
      <span
        className={`inline-block w-2 h-4 ml-0.5 align-middle transition-opacity duration-75 ${
          showCursor ? 'opacity-100' : 'opacity-0'
        } ${isExecuting ? 'bg-green-400' : 'bg-white/70'}`}
      />
    </div>
  )
}
