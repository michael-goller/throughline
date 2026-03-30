import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, EyeOff, StickyNote } from 'lucide-react'
import type { SlideConfig } from '../types'
import SlideThumbnail from './SlideThumbnail'

interface SlideOverviewProps {
  slides: SlideConfig[]
  currentSlide: number
  starredSlideIds: string[]
  hiddenSlideIds: string[]
  onSelect: (index: number) => void
  onClose: () => void
}

const springConfig = { stiffness: 500, damping: 38, mass: 0.8 }

interface ZoomState {
  index: number
  x: number
  y: number
  scale: number
}

export default function SlideOverview({
  slides,
  currentSlide,
  starredSlideIds,
  hiddenSlideIds,
  onSelect,
  onClose,
}: SlideOverviewProps) {
  const [selected, setSelected] = useState(currentSlide)
  const [zoom, setZoom] = useState<ZoomState | null>(null)
  const [fadingOut, setFadingOut] = useState(false)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const starredSet = useMemo(() => new Set(starredSlideIds), [starredSlideIds])
  const hiddenSet = useMemo(() => new Set(hiddenSlideIds), [hiddenSlideIds])

  const cols = useMemo(() => {
    if (slides.length <= 9) return 3
    if (slides.length <= 16) return 4
    return 5
  }, [slides.length])

  const rows = Math.ceil(slides.length / cols)

  const thumbDimensions = useMemo(() => {
    const availW = window.innerWidth * 0.9
    const availH = window.innerHeight * 0.82
    const gap = 12
    const cellW = (availW - (cols - 1) * gap) / cols
    const cellH = (availH - (rows - 1) * gap) / rows
    const w = Math.min(cellW, cellH * (16 / 9))
    const h = w * (9 / 16)
    return { width: Math.floor(w), height: Math.floor(h) }
  }, [cols, rows])

  // Scroll selected cell into view
  useEffect(() => {
    const cell = cellRefs.current.get(selected)
    cell?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  // Zoom-dive sequence:
  // 1. Start zoom animation + navigate slide behind the opaque overview
  // 2. After zoom completes + slide renders, close overview to reveal it
  const triggerZoom = useCallback((index: number) => {
    if (zoom) return
    const cell = cellRefs.current.get(index)
    if (!cell) {
      onSelectRef.current(index)
      onCloseRef.current()
      return
    }

    const rect = cell.getBoundingClientRect()
    const scaleX = window.innerWidth / rect.width
    const scaleY = window.innerHeight / rect.height
    const scale = Math.max(scaleX, scaleY) * 1.05
    const x = (window.innerWidth / 2) - (rect.left + rect.width / 2)
    const y = (window.innerHeight / 2) - (rect.top + rect.height / 2)

    setZoom({ index, x, y, scale })

    // Navigate immediately — slide swaps behind this opaque overlay
    onSelectRef.current(index)

    // After zoom tween (200ms) + buffer for slide to render, close overlay
    setTimeout(() => onCloseRef.current(), 280)
  }, [zoom])

  const handleClose = useCallback(() => {
    setFadingOut(true)
    setTimeout(() => onCloseRef.current(), 150)
  }, [])

  // Keyboard — capture phase + stopImmediatePropagation to fully own events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopImmediatePropagation()
      if (zoom) return

      switch (e.key) {
        case 'ArrowRight':
        case 'l':
          e.preventDefault()
          setSelected(s => Math.min(s + 1, slides.length - 1))
          break
        case 'ArrowLeft':
        case 'h':
          e.preventDefault()
          setSelected(s => Math.max(s - 1, 0))
          break
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          setSelected(s => Math.min(s + cols, slides.length - 1))
          break
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          setSelected(s => Math.max(s - cols, 0))
          break
        case 'Enter':
          e.preventDefault()
          triggerZoom(selectedRef.current)
          break
        case 'Escape':
        case 'o':
          e.preventDefault()
          handleClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [cols, slides.length, zoom, triggerZoom, handleClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: fadingOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-background overflow-hidden"
      onClick={handleClose}
    >
      {/* Grid container */}
      <div
        className={`grid gap-3 p-6 max-h-[90vh] ${zoom ? 'overflow-hidden' : 'overflow-y-auto'}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, ${thumbDimensions.width}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {slides.map((slide, index) => {
          const isSelected = index === selected
          const isCurrent = index === currentSlide
          const isStarred = starredSet.has(slide.id)
          const isHidden = hiddenSet.has(slide.id)
          const isZoomTarget = zoom?.index === index
          const isZooming = zoom !== null

          // Animation target
          let animTarget: Record<string, number | string>
          if (isZooming) {
            if (isZoomTarget) {
              animTarget = {
                x: zoom.x, y: zoom.y, scale: zoom.scale, opacity: 1,
                filter: 'blur(14px)',
              }
            } else {
              animTarget = { x: 0, y: 0, scale: 1, opacity: 0, filter: 'blur(0px)' }
            }
          } else {
            animTarget = {
              x: 0, y: 0,
              scale: isSelected ? 1.05 : 1,
              opacity: isHidden ? 0.4 : isSelected ? 1 : 0.7,
              filter: 'blur(0px)',
            }
          }

          return (
            <motion.div
              key={slide.id}
              ref={(el) => {
                if (el) cellRefs.current.set(index, el)
                else cellRefs.current.delete(index)
              }}
              animate={animTarget}
              transition={
                isZooming
                  ? isZoomTarget
                    ? { duration: 0.2, ease: [0.32, 0, 0.24, 1] }
                    : { duration: 0.1 }
                  : { type: 'spring', ...springConfig }
              }
              onClick={(e) => {
                e.stopPropagation()
                if (!isZooming) triggerZoom(index)
              }}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                isSelected
                  ? 'border-brand-red shadow-lg shadow-brand-red/20'
                  : 'border-border'
              }`}
              style={{
                width: thumbDimensions.width,
                height: thumbDimensions.height,
                zIndex: isZoomTarget ? 100 : 1,
              }}
            >
              <SlideThumbnail
                slide={slide}
                width={thumbDimensions.width}
                height={thumbDimensions.height}
              />

              {/* Slide number badge — hide during zoom so it doesn't scale up */}
              {!isZoomTarget && (
                <div
                  className={`absolute top-1.5 left-1.5 min-w-[1.5rem] h-5 flex items-center justify-center rounded text-[10px] font-mono px-1 ${
                    isSelected
                      ? 'bg-brand-red text-white'
                      : 'bg-background/80 text-text-muted backdrop-blur-sm'
                  } ${isHidden ? 'line-through' : ''}`}
                >
                  {index + 1}
                </div>
              )}

              {isCurrent && !isZoomTarget && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red" />
              )}

              {isStarred && !isZoomTarget && (
                <Star
                  size={12}
                  className="absolute bottom-1.5 right-1.5 text-yellow-500 fill-current"
                />
              )}

              {isHidden && !isZoomTarget && (
                <EyeOff
                  size={12}
                  className="absolute bottom-1.5 left-1.5 text-text-muted"
                />
              )}

              {slide.notes && !isZoomTarget && (
                <StickyNote
                  size={12}
                  className="absolute top-1.5 left-1.5 text-amber-400"
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Footer hint */}
      {!zoom && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: fadingOut ? 0 : 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.15 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-text-muted text-xs bg-background-elevated/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border"
        >
          <span><kbd className="font-mono text-brand-red">hjkl</kbd> navigate</span>
          <span><kbd className="font-mono text-brand-red">enter</kbd> select</span>
          <span><kbd className="font-mono text-brand-red">esc</kbd> close</span>
        </motion.div>
      )}
    </motion.div>
  )
}
