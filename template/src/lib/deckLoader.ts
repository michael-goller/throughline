import type { SlideConfig } from '../types'

/**
 * Runtime deck configuration — the JSON format for dynamically loaded decks.
 * All icons must be string names (resolved at render time via iconResolver).
 */
export interface DeckConfig {
  id: string
  title: string
  description?: string
  author?: string
  createdAt?: string
  updatedAt?: string
  theme?: string
  slides: SlideConfig[]
}

/** Manifest entry for a single deck in the registry */
export interface DeckManifestEntry {
  id: string
  title: string
  description?: string
  author?: string
  updatedAt?: string
  slideCount?: number
  thumbnail?: string
  sourcePath?: string
}

/** Deck manifest — lists all available decks */
export interface DeckManifest {
  decks: DeckManifestEntry[]
}

/** Resolve the API base URL for deck loading */
function getApiBase(): string {
  // Allow override via env var (set at build time)
  if (import.meta.env.VITE_DECK_API_URL) {
    return import.meta.env.VITE_DECK_API_URL as string
  }
  // Default: serve from same origin under /api/decks
  return '/api/decks'
}

/** Resolve the manifest URL */
function getManifestUrl(): string {
  if (import.meta.env.VITE_DECK_MANIFEST_URL) {
    return import.meta.env.VITE_DECK_MANIFEST_URL as string
  }
  // Default: static manifest in public dir
  return '/decks/manifest.json'
}

export class DeckNotFoundError extends Error {
  constructor(deckId: string) {
    super(`Deck not found: ${deckId}`)
    this.name = 'DeckNotFoundError'
  }
}

export class DeckLoadError extends Error {
  constructor(deckId: string, cause?: unknown) {
    super(`Failed to load deck: ${deckId}`)
    this.name = 'DeckLoadError'
    this.cause = cause
  }
}

/**
 * Fetch a deck config by ID.
 *
 * Tries in order:
 * 1. API endpoint: GET {apiBase}/{deckId}
 * 2. Static JSON: /decks/{deckId}.json (public dir fallback)
 */
export async function fetchDeck(deckId: string): Promise<DeckConfig> {
  const apiBase = getApiBase()

  // Try API endpoint first
  try {
    const res = await fetch(`${apiBase}/${encodeURIComponent(deckId)}`)
    if (res.ok) {
      const data = await res.json()
      return validateDeckConfig(data, deckId)
    }
    if (res.status === 404) {
      // Fall through to static JSON
    } else {
      throw new DeckLoadError(deckId, `API returned ${res.status}`)
    }
  } catch (e) {
    if (e instanceof DeckNotFoundError || e instanceof DeckLoadError) throw e
    // Network error — try static fallback
  }

  // Fallback: try static JSON file in public dir
  try {
    const res = await fetch(`/decks/${encodeURIComponent(deckId)}.json`)
    if (res.ok) {
      const data = await res.json()
      return validateDeckConfig(data, deckId)
    }
    if (res.status === 404) {
      throw new DeckNotFoundError(deckId)
    }
    throw new DeckLoadError(deckId, `Static file returned ${res.status}`)
  } catch (e) {
    if (e instanceof DeckNotFoundError || e instanceof DeckLoadError) throw e
    throw new DeckLoadError(deckId, e)
  }
}

/**
 * Fetch the deck manifest (list of available decks).
 * Tries the API endpoint first (published decks from DB),
 * then falls back to the static manifest (local dev).
 */
export async function fetchDeckManifest(): Promise<DeckManifest> {
  const apiBase = getApiBase()
  const manifestUrl = getManifestUrl()

  // Try API endpoint first (serves published decks from database)
  try {
    const res = await fetch(apiBase, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (data.decks && Array.isArray(data.decks) && data.decks.length > 0) {
        return data as DeckManifest
      }
    }
  } catch {
    // API not available — fall through to static manifest
  }

  // Fallback: static manifest (local dev server generates this)
  try {
    const res = await fetch(manifestUrl)
    if (!res.ok) {
      throw new Error(`Manifest fetch failed: ${res.status}`)
    }
    const data = await res.json()
    if (!data.decks || !Array.isArray(data.decks)) {
      throw new Error('Invalid manifest format: missing decks array')
    }
    return data as DeckManifest
  } catch (e) {
    throw new DeckLoadError('manifest', e)
  }
}

/** Basic validation that a loaded JSON object looks like a DeckConfig */
export function validateDeckConfig(data: unknown, deckId: string): DeckConfig {
  if (!data || typeof data !== 'object') {
    throw new DeckLoadError(deckId, 'Response is not a JSON object')
  }

  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.slides) || obj.slides.length === 0) {
    throw new DeckLoadError(deckId, 'Deck has no slides')
  }

  // Ensure each slide has an id and type
  for (let i = 0; i < obj.slides.length; i++) {
    const slide = obj.slides[i] as Record<string, unknown>
    if (!slide.id || !slide.type) {
      throw new DeckLoadError(deckId, `Slide ${i} missing id or type`)
    }
  }

  return {
    id: (obj.id as string) || deckId,
    title: (obj.title as string) || 'Untitled Deck',
    description: obj.description as string | undefined,
    author: obj.author as string | undefined,
    createdAt: obj.createdAt as string | undefined,
    updatedAt: obj.updatedAt as string | undefined,
    theme: obj.theme as string | undefined,
    slides: obj.slides as SlideConfig[],
  }
}
