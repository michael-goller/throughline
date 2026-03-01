/**
 * SlideThumbnail - Renders a slide at thumbnail size
 *
 * Uses CSS transform to scale down the full slide render
 */

import { useMemo } from 'react'
import SlideRenderer from '../templates'
import type { SlideConfig } from '../types'

interface SlideThumbnailProps {
  slide: SlideConfig
  width?: number
  height?: number
  className?: string
}

export default function SlideThumbnail({
  slide,
  width = 320,
  height = 180,
  className = '',
}: SlideThumbnailProps) {
  // Original slide dimensions (assuming 16:9 at 1920x1080)
  const originalWidth = 1920
  const originalHeight = 1080

  const scale = useMemo(() => {
    const scaleX = width / originalWidth
    const scaleY = height / originalHeight
    return Math.min(scaleX, scaleY)
  }, [width, height])

  return (
    <div
      className={`relative overflow-hidden bg-background ${className}`}
      style={{ width, height }}
    >
      <div
        className="origin-top-left pointer-events-none"
        style={{
          width: originalWidth,
          height: originalHeight,
          transform: `scale(${scale})`,
        }}
      >
        <SlideRenderer slide={slide} />
      </div>
    </div>
  )
}
