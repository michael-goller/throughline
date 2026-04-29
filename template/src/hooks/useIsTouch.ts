import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px), (pointer: coarse)'

/**
 * Returns true on phones / tablets / coarse-pointer devices. Initial render is
 * always false so SSR + first paint match desktop chrome; the resolved value
 * lands in a follow-up effect tick.
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    const update = () => setIsTouch(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return isTouch
}
