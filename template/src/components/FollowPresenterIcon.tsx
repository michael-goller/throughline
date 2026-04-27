import { RadioTower } from 'lucide-react'

interface FollowPresenterIconProps {
  presenterLive: boolean
  presenterSlide: number | null
  totalSlides: number
  isFollowing: boolean
  presenterStale: boolean
  onToggleFollow: () => void
  className?: string
}

export default function FollowPresenterIcon({
  presenterLive,
  presenterSlide,
  totalSlides,
  isFollowing,
  presenterStale,
  onToggleFollow,
  className = '',
}: FollowPresenterIconProps) {
  if (!presenterLive) return null

  const slideLabel = presenterSlide !== null
    ? `${presenterSlide + 1}/${Math.max(totalSlides, 1)}`
    : ''

  const tooltip = isFollowing
    ? `Following presenter on slide ${slideLabel} — click to stop`
    : `Presenter is live on slide ${slideLabel} — click to follow`

  const iconColor = isFollowing ? 'text-red-500' : 'text-nav-text'
  const iconOpacity = isFollowing ? '' : 'opacity-60 hover:opacity-100'

  return (
    <button
      onClick={onToggleFollow}
      className={`relative p-1 rounded ${iconColor} ${iconOpacity} ${className}`.trim()}
      aria-label={tooltip}
      title={tooltip}
    >
      <RadioTower size={14} />
      {isFollowing && !presenterStale && (
        <span
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
          aria-hidden="true"
        />
      )}
      {presenterStale && (
        <span
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
