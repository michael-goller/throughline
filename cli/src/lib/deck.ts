/**
 * Deck operations - create, serve, stop.
 */

import { spawn, type ChildProcess } from 'child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getDecksPath, getTemplatePath } from './config.js'
import {
  addDeck,
  allocatePort,
  getDeck,
  getGalleryState,
  isPortInUse,
  listDecks,
  pidExists,
  updateDeckStatus,
  updateGalleryState,
} from './registry.js'

/**
 * Read Vite's stdout to detect the actual port it bound to.
 * Falls back to the requested port after a timeout.
 */
function detectVitePort(proc: ChildProcess, fallbackPort: number): Promise<number> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(fallbackPort), 5000)
    let buffer = ''

    proc.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString()
      const match = buffer.match(/localhost:(\d+)/)
      if (match) {
        clearTimeout(timeout)
        resolve(parseInt(match[1], 10))
      }
    })

    proc.on('error', () => {
      clearTimeout(timeout)
      resolve(fallbackPort)
    })
  })
}

// Marker file that identifies a thin deck folder
const DECK_MARKER = '.throughline-deck'

/**
 * Check if a path is a thin deck (just config + assets, no app code).
 */
export function isThinDeck(deckPath: string): boolean {
  const hasMarker = existsSync(join(deckPath, DECK_MARKER))
  const hasSlides = existsSync(join(deckPath, 'slides.config.ts'))
  const hasNoPackage = !existsSync(join(deckPath, 'package.json'))

  return hasMarker || (hasSlides && hasNoPackage)
}

/**
 * Check if a path is a full deck (has app code).
 */
export function isFullDeck(deckPath: string): boolean {
  return (
    existsSync(join(deckPath, 'package.json')) &&
    existsSync(join(deckPath, 'src', 'slides.config.ts'))
  )
}

/**
 * Format a name into a nice title.
 */
function formatTitle(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Create a new deck.
 */
export function createDeck(
  name: string,
  options: { targetDir?: string; thin?: boolean } = {}
): string {
  const { targetDir, thin = true } = options
  const templatePath = getTemplatePath()

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`)
  }

  // Determine target path
  const deckPath = targetDir ?? join(getDecksPath(), name)

  // Check if target already exists
  if (existsSync(deckPath)) {
    if (existsSync(join(deckPath, DECK_MARKER))) {
      throw new Error(`Deck already exists: ${deckPath}`)
    }
    if (existsSync(join(deckPath, 'slides.config.ts'))) {
      throw new Error(`Deck already exists: ${deckPath}`)
    }
    if (existsSync(join(deckPath, 'src', 'slides.config.ts'))) {
      throw new Error(`Deck already exists: ${deckPath}`)
    }
  }

  if (thin) {
    return createThinDeck(name, deckPath, templatePath)
  } else {
    return createFullDeck(name, deckPath, templatePath)
  }
}

/**
 * Create a thin deck with just slides.config.ts and public/.
 */
function createThinDeck(name: string, deckPath: string, templatePath: string): string {
  mkdirSync(deckPath, { recursive: true })

  // Copy slides.config.ts
  const srcConfig = join(templatePath, 'src', 'slides.config.ts')
  const destConfig = join(deckPath, 'slides.config.ts')
  cpSync(srcConfig, destConfig)

  // Create public/ directory
  mkdirSync(join(deckPath, 'public'), { recursive: true })

  // Create marker file
  const marker = join(deckPath, DECK_MARKER)
  writeFileSync(marker, `# Throughline thin deck\n# Created from template\nname: ${name}\n`)

  // Update title
  updateDeckTitle(destConfig, name)

  // Register the deck
  addDeck(name, deckPath)

  return deckPath
}

/**
 * Create a full deck by copying the entire template.
 */
function createFullDeck(name: string, deckPath: string, templatePath: string): string {
  // Copy template (excluding node_modules, dist, .git)
  cpSync(templatePath, deckPath, {
    recursive: true,
    filter: (src) => {
      const basename = src.split('/').pop() ?? ''
      return !['node_modules', 'dist', '.git'].includes(basename)
    },
  })

  // Update title
  const configPath = join(deckPath, 'src', 'slides.config.ts')
  updateDeckTitle(configPath, name)

  // Register the deck
  addDeck(name, deckPath)

  return deckPath
}

/**
 * Update the title in a slides.config.ts file.
 */
function updateDeckTitle(configPath: string, name: string): void {
  if (!existsSync(configPath)) return

  const title = formatTitle(name)
  const content = readFileSync(configPath, 'utf-8')
  const updated = content.replace('Your Presentation Title', title)
  writeFileSync(configPath, updated)
}

/**
 * Start a deck's dev server.
 */
export async function startDeck(
  name: string,
  port?: number
): Promise<{ pid: number; port: number }> {
  const deck = getDeck(name)

  if (!deck) {
    throw new Error(`Deck '${name}' not found`)
  }

  if (deck.pid && pidExists(deck.pid)) {
    throw new Error(
      `Deck '${name}' is already running on port ${deck.port} (PID: ${deck.pid})`
    )
  }

  const deckPath = deck.path

  if (!existsSync(deckPath)) {
    throw new Error(`Deck path doesn't exist: ${deckPath}`)
  }

  // Allocate port if not specified
  if (!port) {
    port = await allocatePort()
  } else if (await isPortInUse(port)) {
    throw new Error(`Port ${port} is already in use`)
  }

  // Determine if thin or full deck
  if (isThinDeck(deckPath)) {
    return startThinDeck(name, deckPath, port)
  } else {
    return startFullDeck(name, deckPath, port)
  }
}

/**
 * Start a thin deck by running vite from the template with DECK_PATH.
 */
async function startThinDeck(
  name: string,
  deckPath: string,
  port: number
): Promise<{ pid: number; port: number }> {
  const templatePath = getTemplatePath()

  const proc = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: templatePath,
    env: { ...process.env, DECK_PATH: deckPath },
    detached: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  const actualPort = await detectVitePort(proc, port)
  proc.stdout?.destroy()
  proc.unref()

  updateDeckStatus(name, { pid: proc.pid, port: actualPort })

  return { pid: proc.pid!, port: actualPort }
}

/**
 * Start a full deck by running vite from its directory.
 */
async function startFullDeck(
  name: string,
  deckPath: string,
  port: number
): Promise<{ pid: number; port: number }> {
  const proc = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: deckPath,
    detached: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  const actualPort = await detectVitePort(proc, port)
  proc.stdout?.destroy()
  proc.unref()

  updateDeckStatus(name, { pid: proc.pid, port: actualPort })

  return { pid: proc.pid!, port: actualPort }
}

/**
 * Stop a deck's dev server.
 */
export function stopDeck(name: string): boolean {
  const deck = getDeck(name)

  if (!deck) {
    throw new Error(`Deck '${name}' not found`)
  }

  if (!deck.pid) {
    return false
  }

  if (!pidExists(deck.pid)) {
    updateDeckStatus(name, { pid: null, port: null })
    return false
  }

  try {
    process.kill(process.platform === 'win32' ? deck.pid : -deck.pid, 'SIGTERM')
  } catch {
    // Process might have already exited
  }

  updateDeckStatus(name, { pid: null, port: null })

  return true
}

/**
 * Stop all running decks.
 */
export function stopAllDecks(): string[] {
  const stopped: string[] = []

  for (const [name, deck] of listDecks()) {
    if (deck.pid) {
      if (stopDeck(name)) {
        stopped.push(name)
      }
    }
  }

  return stopped
}

/**
 * Check if a deck is currently running.
 */
export function isRunning(name: string): boolean {
  const deck = getDeck(name)

  if (!deck || !deck.pid) {
    return false
  }

  return pidExists(deck.pid)
}

/**
 * Open a URL in the default browser.
 */
export function openUrl(url: string): boolean {
  const { platform } = process
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'

  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref()
  return true
}

/**
 * Open a deck in the default browser (navigates to /decks/:name).
 */
export function openInBrowser(name: string): boolean {
  const deck = getDeck(name)

  if (!deck) {
    throw new Error(`Deck '${name}' not found`)
  }

  if (!deck.port || !isRunning(name)) {
    return false
  }

  const url = `http://localhost:${deck.port}/decks/${encodeURIComponent(name)}`
  return openUrl(url)
}

/**
 * Start the gallery server (no specific deck — shows all decks overview).
 */
export async function startGallery(port?: number): Promise<{ pid: number; port: number }> {
  const state = getGalleryState()

  if (state.pid && pidExists(state.pid)) {
    throw new Error(
      `Library is already running on http://localhost:${state.port} (PID: ${state.pid})`
    )
  }

  const templatePath = getTemplatePath()

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`)
  }

  if (!port) {
    port = await allocatePort()
  } else if (await isPortInUse(port)) {
    throw new Error(`Port ${port} is already in use`)
  }

  const proc = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: templatePath,
    detached: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  const actualPort = await detectVitePort(proc, port)
  proc.stdout?.destroy()
  proc.unref()

  updateGalleryState({ pid: proc.pid!, port: actualPort })

  return { pid: proc.pid!, port: actualPort }
}

/**
 * Check if the gallery server is running.
 */
export function isGalleryRunning(): boolean {
  const state = getGalleryState()
  return !!(state.pid && pidExists(state.pid))
}

/**
 * Stop the gallery server.
 */
export function stopGallery(): boolean {
  const state = getGalleryState()

  if (!state.pid) return false

  if (!pidExists(state.pid)) {
    updateGalleryState({ pid: null, port: null })
    return false
  }

  try {
    process.kill(process.platform === 'win32' ? state.pid : -state.pid, 'SIGTERM')
  } catch {
    // Process might have already exited
  }

  updateGalleryState({ pid: null, port: null })
  return true
}
