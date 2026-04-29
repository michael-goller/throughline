const prefetched = new Set<string>()

/**
 * Inject `<link rel="prefetch" as="document">` for a deck route. Idempotent
 * per slug. Used on dashboard card hover so the destination HTML is warm in
 * the browser's prefetch cache by the time the user clicks.
 */
export function prefetchDeck(slug: string): void {
  if (typeof document === 'undefined') return
  if (prefetched.has(slug)) return
  prefetched.add(slug)

  const href = `/decks/${encodeURIComponent(slug)}`
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'document'
  link.href = href
  document.head.appendChild(link)
}
