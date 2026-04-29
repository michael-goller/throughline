const prefetchedDocs = new Set<string>()
const prefetchedData = new Set<string>()
const ssKey = (slug: string) => `deck-prefetch:${slug}`

/**
 * Warm both the destination HTML and the deck JSON for a slug. Idempotent
 * per slug. Called on dashboard card hover so the click feels instant —
 * the destination JS reads from sessionStorage instead of waiting on a
 * fresh network round trip.
 */
export function prefetchDeck(slug: string): void {
  prefetchDeckDoc(slug)
  prefetchDeckData(slug)
}

function prefetchDeckDoc(slug: string): void {
  if (typeof document === 'undefined') return
  if (prefetchedDocs.has(slug)) return
  prefetchedDocs.add(slug)

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'document'
  link.href = `/decks/${encodeURIComponent(slug)}`
  document.head.appendChild(link)
}

function prefetchDeckData(slug: string): void {
  if (typeof window === 'undefined') return
  if (prefetchedData.has(slug)) return
  prefetchedData.add(slug)

  // Mirror deckLoader.getApiBase resolution — Vite inlines the env at build time
  const apiBase = (import.meta.env.VITE_DECK_API_URL as string | undefined) || '/api/decks'

  fetch(`${apiBase}/${encodeURIComponent(slug)}`, { credentials: 'same-origin' })
    .then((res) => {
      if (!res.ok) return // 401/403/404 — let the regular fetch surface the error
      return res.text().then((body) => {
        try {
          sessionStorage.setItem(ssKey(slug), body)
        } catch {
          // sessionStorage full / disabled — silently fall back to live fetch
        }
      })
    })
    .catch(() => {
      // Network blip on prefetch is a no-op; live fetch on click will retry.
      prefetchedData.delete(slug)
    })
}

/**
 * Pure read of a prefetched deck JSON. Safe to call from a React useState
 * lazy initializer (no side effects → idempotent under StrictMode double-
 * invocation in dev). Pair with `clearDeckPrefetch` after the value has
 * been committed to state.
 */
export function peekDeckPrefetch(slug: string): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(ssKey(slug))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Drop the prefetched JSON for a slug. Idempotent. */
export function clearDeckPrefetch(slug: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(ssKey(slug))
  } catch {
    // sessionStorage disabled — nothing to clean up
  }
}
