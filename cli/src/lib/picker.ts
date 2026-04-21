/**
 * fzf-based interactive pickers.
 */

import { execSync, spawnSync } from 'child_process'
import { listDecks } from './registry.js'

/**
 * Check if fzf is available.
 */
export function hasFzf(): boolean {
  try {
    execSync('which fzf', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Pick a deck using fzf.
 */
export function pickDeck(prompt: string): string | null {
  const decks = listDecks()

  if (decks.length === 0) {
    return null
  }

  const names = decks.map(([name]) => name)

  if (!hasFzf()) {
    // Fallback: show numbered list
    console.log(`\n${prompt}:`)
    names.forEach((name, i) => console.log(`  ${i + 1}. ${name}`))
    console.log('\nRun with deck name: throughline <command> <name>')
    return null
  }

  const input = names.join('\n')

  try {
    const result = spawnSync('fzf', ['--prompt', `${prompt} > `, '--height', '40%', '--border'], {
      input,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit'],
    })

    if (result.status === 0 && result.stdout) {
      return result.stdout.trim()
    }
  } catch {
    // fzf failed or was cancelled
  }

  return null
}
