import { useState, useEffect, useRef } from 'react'
import type { SlideConfig } from '../types'
import {
  fetchDeck,
  validateDeckConfig,
  DeckNotFoundError,
  DeckLoadError,
  type DeckConfig,
} from '../lib/deckLoader'
import { peekDeckPrefetch, clearDeckPrefetch } from '../lib/prefetch'

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
 *
 * If a hover-prefetch (see lib/prefetch.ts) populated sessionStorage for
 * this deckId, the initial state is already `ready` — no spinner paints
 * and the network fetch is skipped.
 */
export function useDeck(deckId: string | null): DeckState {
  const [state, setState] = useState<DeckState>(() => {
    if (!deckId) return { status: 'ready', slides: [], deck: null, error: null }
    const cached = peekDeckPrefetch(deckId)
    if (cached) {
      try {
        const deck = validateDeckConfig(cached, deckId)
        return { status: 'ready', slides: deck.slides, deck, error: null }
      } catch {
        // Cached payload was invalid — fall through to a normal network fetch
      }
    }
    return { status: 'loading', slides: [], deck: null, error: null }
  })

  // True iff the initial render came from a prefetch hit. The first effect
  // pass clears it so any later deckId change still triggers a real fetch.
  const skipNextFetchRef = useRef(state.status === 'ready' && deckId !== null)

  useEffect(() => {
    if (!deckId) {
      setState({ status: 'ready', slides: [], deck: null, error: null })
      return
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      clearDeckPrefetch(deckId)
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
