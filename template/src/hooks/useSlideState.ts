import { useState, useEffect, useCallback, useMemo } from 'react'

interface SlideState {
  starred: string[]
  hidden: string[]
}

const STORAGE_KEY = 'shine-slide-state'

function getStorageKey(deckId: string): string {
  return `${STORAGE_KEY}-${deckId}`
}

function loadState(deckId: string): SlideState {
  try {
    const stored = localStorage.getItem(getStorageKey(deckId))
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        starred: Array.isArray(parsed.starred) ? parsed.starred : [],
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      }
    }
  } catch (e) {
    console.warn('Failed to load slide state from localStorage:', e)
  }
  return { starred: [], hidden: [] }
}

function saveState(deckId: string, state: SlideState): void {
  try {
    localStorage.setItem(getStorageKey(deckId), JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save slide state to localStorage:', e)
  }
}

export function useSlideState(deckId: string) {
  const [state, setState] = useState<SlideState>(() => loadState(deckId))

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveState(deckId, state)
  }, [deckId, state])

  // Reload state if deckId changes
  useEffect(() => {
    setState(loadState(deckId))
  }, [deckId])

  const starredSet = useMemo(() => new Set(state.starred), [state.starred])
  const hiddenSet = useMemo(() => new Set(state.hidden), [state.hidden])

  const isStarred = useCallback(
    (slideId: string) => starredSet.has(slideId),
    [starredSet]
  )

  const isHidden = useCallback(
    (slideId: string) => hiddenSet.has(slideId),
    [hiddenSet]
  )

  const toggleStar = useCallback((slideId: string) => {
    setState((prev) => {
      const starred = new Set(prev.starred)
      if (starred.has(slideId)) {
        starred.delete(slideId)
      } else {
        starred.add(slideId)
      }
      return { ...prev, starred: Array.from(starred) }
    })
  }, [])

  const toggleHidden = useCallback((slideId: string) => {
    setState((prev) => {
      const hidden = new Set(prev.hidden)
      if (hidden.has(slideId)) {
        hidden.delete(slideId)
      } else {
        hidden.add(slideId)
      }
      return { ...prev, hidden: Array.from(hidden) }
    })
  }, [])

  const starredSlideIds = state.starred
  const hiddenSlideIds = state.hidden
  const starredCount = state.starred.length
  const hiddenCount = state.hidden.length

  return {
    isStarred,
    isHidden,
    toggleStar,
    toggleHidden,
    starredSlideIds,
    hiddenSlideIds,
    starredCount,
    hiddenCount,
  }
}
