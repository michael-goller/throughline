/**
 * Registry management - tracks registered decks.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createServer, createConnection } from 'net'
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
 * Check if we can connect to a port (something is listening).
 */
function canConnect(port: number, host: string, timeout = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host, timeout })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

/**
 * Check if we can bind to a port (nothing is using it).
 */
function canBind(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port, host)
  })
}

/**
 * Check if a port is in use.
 * Uses multiple methods: try connecting and try binding on different interfaces.
 */
export async function isPortInUse(port: number): Promise<boolean> {
  // First, try to connect - if successful, something is listening
  const canConnectLocal = await canConnect(port, '127.0.0.1', 500)
  if (canConnectLocal) return true

  // Try binding on 0.0.0.0 - this will fail if ANY interface has the port in use
  const canBindAll = await canBind(port, '0.0.0.0')
  if (!canBindAll) return true

  // Also verify we can bind on IPv6
  const canBindIPv6 = await canBind(port, '::')
  if (!canBindIPv6) return true

  return false
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
