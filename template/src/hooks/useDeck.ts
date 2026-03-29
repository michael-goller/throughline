import { useState, useEffect } from 'react'
import type { SlideConfig } from '../types'
import {
  fetchDeck,
  DeckNotFoundError,
  DeckLoadError,
  type DeckConfig,
} from '../lib/deckLoader'

export type DeckStatus = 'loading' | 'ready' | 'not-found' | 'error'

export interface DeckState {
  status: DeckStatus
  slides: SlideConfig[]
  deck: DeckConfig | null
  error: string | null
}

/**
 * Hook to load a deck dynamically by ID.
 *
 * Returns loading/error/ready states and the loaded slides.
 * Pass `null` to skip loading (e.g., when using compile-time slides).
 */
export function useDeck(deckId: string | null): DeckState {
  const [state, setState] = useState<DeckState>({
    status: deckId ? 'loading' : 'ready',
    slides: [],
    deck: null,
    error: null,
  })

  useEffect(() => {
    if (!deckId) {
      setState({ status: 'ready', slides: [], deck: null, error: null })
      return
    }

    let cancelled = false
    setState({ status: 'loading', slides: [], deck: null, error: null })

    fetchDeck(deckId)
      .then((deck) => {
        if (!cancelled) {
          setState({ status: 'ready', slides: deck.slides, deck, error: null })
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof DeckNotFoundError) {
          setState({ status: 'not-found', slides: [], deck: null, error: err.message })
        } else if (err instanceof DeckLoadError) {
          setState({ status: 'error', slides: [], deck: null, error: err.message })
        } else {
          setState({ status: 'error', slides: [], deck: null, error: String(err) })
        }
      })

    return () => { cancelled = true }
  }, [deckId])

  return state
}
