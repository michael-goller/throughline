/**
 * Configuration management for Throughline.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
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
