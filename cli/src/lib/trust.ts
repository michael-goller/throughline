/**
 * Trust-on-first-use guard for `slides.config.ts` evaluation.
 *
 * Both `throughline publish` and `throughline check` evaluate the deck's
 * `slides.config.ts` through `npx tsx`, which means the file runs with the
 * current user's full host privileges. A malicious deck (e.g. one received
 * from a colleague or downloaded from the web) could exfiltrate secrets,
 * write to ~/.ssh, or install persistence. See DIG-122 (CVSS 8.6, CWE-94).
 *
 * This module gates that execution behind an explicit user consent prompt
 * the first time a given deck is evaluated, and re-prompts whenever the
 * config file's contents change. Trusted decks are remembered in
 * ~/.throughline/trusted-decks.json (SSH-known-hosts style).
 *
 * Bypass paths for non-interactive use:
 *   - --trust flag: trust this deck now (and persist the decision)
 *   - --no-trust-prompt flag: refuse to prompt; fail unless already trusted
 *   - THROUGHLINE_TRUST_ALL=1: bypass entirely (CI escape hatch, dangerous)
 */

import { createHash } from 'crypto'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'
import { THROUGHLINE_DIR, ensureThroughlineDir, formatPath } from './config.js'

const TRUSTED_DECKS_FILE = join(THROUGHLINE_DIR, 'trusted-decks.json')

interface TrustEntry {
  trustedAt: string
  configHash: string
}

interface TrustedDecksFile {
  version: 1
  decks: Record<string, TrustEntry>
}

export interface TrustOptions {
  /** Trust this deck for this run (and persist). Skips the prompt. */
  trust?: boolean
  /** Refuse to prompt — fail with a clear error unless already trusted. */
  noPrompt?: boolean
}

function loadTrustedDecks(): TrustedDecksFile {
  if (!existsSync(TRUSTED_DECKS_FILE)) {
    return { version: 1, decks: {} }
  }
  try {
    const parsed = JSON.parse(readFileSync(TRUSTED_DECKS_FILE, 'utf-8')) as Partial<TrustedDecksFile>
    if (parsed.version !== 1 || typeof parsed.decks !== 'object' || parsed.decks === null) {
      return { version: 1, decks: {} }
    }
    return { version: 1, decks: parsed.decks }
  } catch {
    return { version: 1, decks: {} }
  }
}

function saveTrustedDecks(file: TrustedDecksFile): void {
  ensureThroughlineDir()
  writeFileSync(TRUSTED_DECKS_FILE, JSON.stringify(file, null, 2), 'utf-8')
}

function hashFile(path: string): string {
  const contents = readFileSync(path)
  return createHash('sha256').update(contents).digest('hex')
}

function canonicalPath(configFile: string): string {
  try {
    return realpathSync(configFile)
  } catch {
    return configFile
  }
}

function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      const a = answer.trim().toLowerCase()
      resolve(a === 'y' || a === 'yes')
    })
  })
}

/**
 * Ensure the deck's config file is trusted before any evaluator subprocess
 * runs. Throws when consent is refused or impossible.
 */
export async function requireDeckTrust(configFile: string, options: TrustOptions = {}): Promise<void> {
  // Escape hatch for CI: opt out entirely.
  if (process.env.THROUGHLINE_TRUST_ALL === '1') {
    process.stderr.write(
      `! THROUGHLINE_TRUST_ALL=1 — skipping deck trust check. This evaluates ${formatPath(configFile)} as host code.\n`,
    )
    return
  }

  const canonical = canonicalPath(configFile)
  const currentHash = hashFile(canonical)
  const file = loadTrustedDecks()
  const existing = file.decks[canonical]
  const alreadyTrusted = existing?.configHash === currentHash

  if (alreadyTrusted) return

  if (options.trust) {
    file.decks[canonical] = { trustedAt: new Date().toISOString(), configHash: currentHash }
    saveTrustedDecks(file)
    return
  }

  // Untrusted, and either non-interactive or explicit no-prompt requested.
  const isTty = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  if (options.noPrompt || !isTty) {
    const reason = existing
      ? 'has changed since you last trusted it'
      : 'has not been trusted on this machine'
    throw new Error(
      [
        `Refusing to evaluate ${formatPath(canonical)}: this slides.config.ts ${reason}.`,
        `Running publish/check executes the file as host code, so Throughline requires explicit consent.`,
        `Re-run with --trust to approve this deck, or set THROUGHLINE_TRUST_ALL=1 to bypass (dangerous).`,
      ].join('\n'),
    )
  }

  // Interactive prompt.
  process.stdout.write('\n')
  process.stdout.write(`! Throughline is about to evaluate ${formatPath(canonical)}.\n`)
  process.stdout.write(`  This file runs as host code — a malicious deck could read your files,\n`)
  process.stdout.write(`  exfiltrate credentials, or install persistence. Only trust decks you wrote\n`)
  process.stdout.write(`  or sources you fully trust.\n`)
  if (existing) {
    process.stdout.write(`  (You trusted an earlier version on ${existing.trustedAt}; the file has changed since.)\n`)
  }
  const ok = await promptYesNo('  Trust this deck and remember the decision? [y/N] ')
  if (!ok) {
    throw new Error('Aborted: deck not trusted. No subprocess was started.')
  }

  file.decks[canonical] = { trustedAt: new Date().toISOString(), configHash: currentHash }
  saveTrustedDecks(file)
}

/**
 * Build a minimal env for the tsx subprocess. Drops credentials-bearing
 * variables (AWS_*, GH_*, OPENAI_*, etc.) so a malicious config that did
 * slip past the trust prompt cannot trivially harvest them via process.env.
 *
 * Callers should add NODE_PATH (and any other strictly required vars)
 * after spreading this base.
 */
export function sandboxedEnv(): NodeJS.ProcessEnv {
  const allowList = new Set([
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'SHELL',
    'SHLVL',
    'TMPDIR',
    'TMP',
    'TEMP',
    'LANG',
    'LC_ALL',
    'LC_CTYPE',
    'LC_MESSAGES',
    'TZ',
    'XDG_CACHE_HOME',
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
    'NODE_VERSION',
    'NVM_DIR',
    'NVM_BIN',
    'NVM_INC',
  ])
  const out: NodeJS.ProcessEnv = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string' && allowList.has(k)) out[k] = v
  }
  return out
}
