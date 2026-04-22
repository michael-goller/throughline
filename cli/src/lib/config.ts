/**
 * Configuration management for Throughline.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Get package directory (where throughline is installed)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const PACKAGE_DIR = join(__dirname, '..', '..')

// User config directory
export const THROUGHLINE_DIR = join(homedir(), '.throughline')
export const CONFIG_FILE = join(THROUGHLINE_DIR, 'config.json')
export const REGISTRY_FILE = join(THROUGHLINE_DIR, 'registry.json')

// Pre-rename config dir. We migrate from this on first load so users who
// upgraded across the Shine → Throughline rename keep their decks, login,
// and config without re-creating them by hand.
const LEGACY_SHINE_DIR = join(homedir(), '.shine')
const SHINE_MIGRATION_MARKER = join(THROUGHLINE_DIR, '.migrated-from-shine')

export interface Config {
  decks_path: string
  port_range: [number, number]
}

// Default configuration
const DEFAULT_CONFIG: Config = {
  decks_path: join(homedir(), 'decks'),
  port_range: [5173, 5199],
}

/**
 * Ensure the .throughline directory exists.
 */
export function ensureThroughlineDir(): void {
  if (!existsSync(THROUGHLINE_DIR)) {
    mkdirSync(THROUGHLINE_DIR, { recursive: true })
  }
  migrateFromShineOnce()
}

/**
 * One-shot migration from ~/.shine to ~/.throughline for users who upgraded
 * across the rename. Idempotent — gated by a marker file so it runs at most
 * once per machine. Throughline-side files always win on collision so a user
 * who already started fresh in ~/.throughline doesn't get clobbered.
 */
function migrateFromShineOnce(): void {
  if (existsSync(SHINE_MIGRATION_MARKER)) return
  if (!existsSync(LEGACY_SHINE_DIR)) {
    writeFileSync(SHINE_MIGRATION_MARKER, new Date().toISOString())
    return
  }

  // config.json + credentials.json: only copy if no throughline-side file yet.
  for (const fileName of ['config.json', 'credentials.json']) {
    const src = join(LEGACY_SHINE_DIR, fileName)
    const dst = join(THROUGHLINE_DIR, fileName)
    if (existsSync(src) && !existsSync(dst)) {
      try { copyFileSync(src, dst) } catch { /* best effort */ }
    }
  }

  // registry.json: merge — throughline entries win, legacy fills in the rest.
  const legacyRegistryPath = join(LEGACY_SHINE_DIR, 'registry.json')
  if (existsSync(legacyRegistryPath)) {
    try {
      const legacy = JSON.parse(readFileSync(legacyRegistryPath, 'utf-8'))
      let current: Record<string, unknown> = { decks: {} }
      if (existsSync(REGISTRY_FILE)) {
        current = JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
      }
      const merged: Record<string, unknown> = {
        ...legacy,
        ...current,
        decks: { ...(legacy.decks ?? {}), ...((current.decks as Record<string, unknown>) ?? {}) },
      }
      writeFileSync(REGISTRY_FILE, JSON.stringify(merged, null, 2))
    } catch { /* best effort — leave throughline registry as-is */ }
  }

  writeFileSync(SHINE_MIGRATION_MARKER, new Date().toISOString())
}

/**
 * Load configuration from file, creating defaults if needed.
 */
export function loadConfig(): Config {
  ensureThroughlineDir()

  if (!existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG)
    return { ...DEFAULT_CONFIG } as Config
  }

  const content = readFileSync(CONFIG_FILE, 'utf-8')
  return JSON.parse(content) as Config
}

/**
 * Save configuration to file.
 */
export function saveConfig(config: Config): void {
  ensureThroughlineDir()
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

/**
 * Get the path to the slide deck template (sibling to cli in monorepo).
 */
export function getTemplatePath(): string {
  return join(PACKAGE_DIR, '..', 'template')
}

/**
 * Get the path where decks are stored.
 */
export function getDecksPath(): string {
  const config = loadConfig()
  const path = config.decks_path
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
  return path
}

/**
 * Get the port range for deck servers.
 */
export function getPortRange(): [number, number] {
  const config = loadConfig()
  return config.port_range
}

/**
 * Format a path for display (replace home with ~).
 */
export function formatPath(path: string): string {
  const home = homedir()
  if (path.startsWith(home)) {
    return '~' + path.slice(home.length)
  }
  return path
}
