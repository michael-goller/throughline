/**
 * Registry management - tracks registered decks.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createServer } from 'net'
import { REGISTRY_FILE, ensureShineDir, getPortRange } from './config.js'

export interface DeckEntry {
  path: string
  port: number | null
  pid: number | null
  created_at: string | null
  started_at: string | null
}

interface Registry {
  decks: Record<string, DeckEntry>
}

/**
 * Load the registry from disk.
 */
function loadRegistry(): Registry {
  ensureShineDir()

  if (!existsSync(REGISTRY_FILE)) {
    return { decks: {} }
  }

  const content = readFileSync(REGISTRY_FILE, 'utf-8')
  return JSON.parse(content) as Registry
}

/**
 * Save the registry to disk.
 */
function saveRegistry(registry: Registry): void {
  ensureShineDir()
  writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2))
}

/**
 * Get a deck from the registry.
 */
export function getDeck(name: string): DeckEntry | null {
  const registry = loadRegistry()
  return registry.decks[name] ?? null
}

/**
 * Add a deck to the registry.
 */
export function addDeck(name: string, path: string): void {
  const registry = loadRegistry()

  registry.decks[name] = {
    path,
    port: null,
    pid: null,
    created_at: new Date().toISOString(),
    started_at: null,
  }

  saveRegistry(registry)
}

/**
 * Remove a deck from the registry.
 */
export function removeDeck(name: string): void {
  const registry = loadRegistry()
  delete registry.decks[name]
  saveRegistry(registry)
}

/**
 * Rename a deck in the registry.
 */
export function renameDeck(oldName: string, newName: string): void {
  const registry = loadRegistry()
  const deck = registry.decks[oldName]

  if (!deck) {
    throw new Error(`Deck '${oldName}' not found`)
  }

  if (registry.decks[newName]) {
    throw new Error(`Deck '${newName}' already exists`)
  }

  registry.decks[newName] = deck
  delete registry.decks[oldName]
  saveRegistry(registry)
}

/**
 * Update a deck's status (pid, port).
 */
export function updateDeckStatus(
  name: string,
  updates: { pid?: number | null; port?: number | null }
): void {
  const registry = loadRegistry()
  const deck = registry.decks[name]

  if (!deck) return

  if (updates.pid !== undefined) {
    deck.pid = updates.pid
    deck.started_at = updates.pid ? new Date().toISOString() : null
  }
  if (updates.port !== undefined) {
    deck.port = updates.port
  }

  saveRegistry(registry)
}

/**
 * List all decks in the registry.
 */
export function listDecks(): Array<[string, DeckEntry]> {
  const registry = loadRegistry()
  return Object.entries(registry.decks)
}

/**
 * Check if a port is in use on a specific host.
 */
function checkPort(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    server.listen(port, host)
  })
}

/**
 * Check if a port is in use (checks both IPv4 and IPv6).
 */
export async function isPortInUse(port: number): Promise<boolean> {
  const ipv4InUse = await checkPort(port, '127.0.0.1')
  if (ipv4InUse) return true

  const ipv6InUse = await checkPort(port, '::1')
  return ipv6InUse
}

/**
 * Find an available port in the configured range.
 */
export async function allocatePort(): Promise<number> {
  const [minPort, maxPort] = getPortRange()

  for (let port = minPort; port <= maxPort; port++) {
    const inUse = await isPortInUse(port)
    if (!inUse) {
      return port
    }
  }

  throw new Error(`No available ports in range ${minPort}-${maxPort}`)
}

/**
 * Check if a process exists.
 */
export function pidExists(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
