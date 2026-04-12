import React from 'react'

interface SlideBackgroundProps {
  variant?: 'flat' | 'gradient-subtle' | 'gradient-radial' | 'dots'
  children: React.ReactNode
}

const backgroundStyles: Record<string, React.CSSProperties> = {
  'gradient-subtle': {
    background: 'linear-gradient(135deg, var(--background) 0%, var(--background-elevated) 100%)',
  },
  'gradient-radial': {
    background: 'radial-gradient(circle at center, var(--background-elevated) 0%, var(--background) 100%)',
  },
  dots: {
    backgroundImage:
      'radial-gradient(circle, var(--border) 1.5px, transparent 1.5px)',
    backgroundSize: '24px 24px',
    backgroundColor: 'var(--background)',
  },
}

export default function SlideBackground({
  variant = 'flat',
  children,
}: SlideBackgroundProps) {
  const needsLayer = variant !== 'flat'

  return (
    <div className="relative w-full h-full overflow-hidden">
      {needsLayer && (
        <div
          className="absolute inset-0 z-0"
          style={backgroundStyles[variant]}
        />
      )}
      {!needsLayer && (
        <div className="absolute inset-0 z-0 bg-background" />
      )}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
