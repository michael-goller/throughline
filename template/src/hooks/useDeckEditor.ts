import { useState, useCallback, useRef } from 'react'
import type { SlideConfig } from '../types'

export interface DeckEditorState {
  slides: SlideConfig[]
  selectedIndex: number
  dirty: boolean
}

export interface DeckEditorActions {
  /** Select a slide by index */
  selectSlide: (index: number) => void
  /** Update a field on the currently selected slide */
  updateSlide: (index: number, patch: Partial<SlideConfig>) => void
  /** Replace a slide entirely (e.g., after type change) */
  replaceSlide: (index: number, slide: SlideConfig) => void
  /** Move a slide from one index to another */
  moveSlide: (from: number, to: number) => void
  /** Duplicate a slide */
  duplicateSlide: (index: number) => void
  /** Delete a slide */
  deleteSlide: (index: number) => void
  /** Add a new slide after the given index */
  addSlide: (afterIndex: number, slide: SlideConfig) => void
  /** Get the full slides array for saving */
  getSlides: () => SlideConfig[]
  /** Mark as saved */
  markClean: () => void
}

let idCounter = 0
export function generateSlideId(): string {
  return `slide-${Date.now()}-${++idCounter}`
}

export function useDeckEditor(
  initialSlides: SlideConfig[]
): DeckEditorState & DeckEditorActions {
  const [slides, setSlides] = useState<SlideConfig[]>(() => [...initialSlides])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dirty, setDirty] = useState(false)
  const slidesRef = useRef(slides)
  slidesRef.current = slides

  const selectSlide = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const updateSlide = useCallback((index: number, patch: Partial<SlideConfig>) => {
    setSlides(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch } as SlideConfig
      return next
    })
    setDirty(true)
  }, [])

  const replaceSlide = useCallback((index: number, slide: SlideConfig) => {
    setSlides(prev => {
      const next = [...prev]
      next[index] = slide
      return next
    })
    setDirty(true)
  }, [])

  const moveSlide = useCallback((from: number, to: number) => {
    if (from === to) return
    setSlides(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setSelectedIndex(to)
    setDirty(true)
  }, [])

  const duplicateSlide = useCallback((index: number) => {
    setSlides(prev => {
      const next = [...prev]
      const original = prev[index]
      const copy = { ...original, id: generateSlideId() }
      next.splice(index + 1, 0, copy as SlideConfig)
      return next
    })
    setSelectedIndex(index + 1)
    setDirty(true)
  }, [])

  const deleteSlide = useCallback((index: number) => {
    setSlides(prev => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
    setSelectedIndex(prev => Math.min(prev, slidesRef.current.length - 2))
    setDirty(true)
  }, [])

  const addSlide = useCallback((afterIndex: number, slide: SlideConfig) => {
    setSlides(prev => {
      const next = [...prev]
      next.splice(afterIndex + 1, 0, slide)
      return next
    })
    setSelectedIndex(afterIndex + 1)
    setDirty(true)
  }, [])

  const getSlides = useCallback(() => slidesRef.current, [])

  const markClean = useCallback(() => setDirty(false), [])

  return {
    slides,
    selectedIndex,
    dirty,
    selectSlide,
    updateSlide,
    replaceSlide,
    moveSlide,
    duplicateSlide,
    deleteSlide,
    addSlide,
    getSlides,
    markClean,
  }
}
