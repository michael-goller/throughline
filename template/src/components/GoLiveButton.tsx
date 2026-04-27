import { RadioTower } from 'lucide-react'

interface GoLiveButtonProps {
  isLive: boolean
  onToggle: () => void
  className?: string
}

export default function GoLiveButton({ isLive, onToggle, className = '' }: GoLiveButtonProps) {
  if (isLive) {
    return (
      <button
        onClick={onToggle}
        className={`relative p-1 rounded text-nav-text hover:text-red-500 ${className}`.trim()}
        aria-label="Stop live presenter session"
        title="Stop live session (L)"
      >
        <RadioTower size={14} className="text-red-500" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={`p-1 rounded text-nav-text opacity-60 hover:opacity-100 ${className}`.trim()}
      aria-label="Start live presenter session"
      title="Go live (L)"
    >
      <RadioTower size={14} />
    </button>
  )
}
