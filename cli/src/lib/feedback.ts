/**
 * `throughline feedback` — interactive readline dialog that submits a feedback
 * report to the cloud `/api/feedback` endpoint with `source: 'cli'`.
 *
 * Mirrors the four-question shape of `throughline shape`/`onboard`. Authenticates
 * via the Bearer token from `~/.throughline/credentials.json` (cloud login).
 */

import chalk from 'chalk'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createInterface, type Interface as ReadlineInterface } from 'readline'
import { createRequire } from 'node:module'
import { THROUGHLINE_DIR } from './config.js'
import { getApiUrl, loadCredentials } from './cloud.js'
import { getDeck } from './registry.js'

const require = createRequire(import.meta.url)
const { version: CLI_VERSION } = require('../../package.json') as { version: string }

const PENDING_DIR = join(THROUGHLINE_DIR, 'pending-feedback')

type Kind = 'bug' | 'suggestion' | 'question'

export interface FeedbackOptions {
  message?: string
  deck?: string
  kind?: Kind
}

interface FeedbackPayload {
  source: 'cli'
  context: 'cli'
  kind: Kind
  message: string
  deckSlug?: string
  cliVersion: string
  nodeVersion: string
  os: string
  apiUrl: string
}

function ask(rl: ReadlineInterface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))
}

async function readMultiline(rl: ReadlineInterface, prompt: string): Promise<string> {
  console.log(chalk.bold(prompt) + chalk.dim(' (empty line submits)'))
  const lines: string[] = []
  while (true) {
    const line = await ask(rl, '   ')
    if (line === '' && lines.length > 0) break
    if (line === '' && lines.length === 0) continue
    lines.push(line)
  }
  return lines.join('\n')
}

function parseKind(raw: string): Kind | null {
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'b' || normalized === 'bug') return 'bug'
  if (normalized === 's' || normalized === 'suggestion') return 'suggestion'
  if (normalized === 'q' || normalized === 'question') return 'question'
  return null
}

function buildPayload(input: {
  kind: Kind
  message: string
  deckSlug?: string
}): FeedbackPayload {
  return {
    source: 'cli',
    context: 'cli',
    kind: input.kind,
    message: `[${input.kind}] ${input.message}`,
    deckSlug: input.deckSlug,
    cliVersion: CLI_VERSION,
    nodeVersion: process.version,
    os: `${process.platform}-${process.arch}`,
    apiUrl: getApiUrl(),
  }
}

function spoolPending(payload: FeedbackPayload): string {
  if (!existsSync(PENDING_DIR)) mkdirSync(PENDING_DIR, { recursive: true })
  const path = join(PENDING_DIR, `${Date.now()}.json`)
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n', 'utf-8')
  return path
}

async function postFeedback(payload: FeedbackPayload): Promise<{ ok: true; id: string } | { ok: false; error: string; status?: number }> {
  const creds = loadCredentials()
  if (!creds) {
    return { ok: false, error: 'Not logged in. Run: throughline login' }
  }
  const apiUrl = getApiUrl()
  try {
    const res = await fetch(`${apiUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      return { ok: false, error: body.error || `HTTP ${res.status}`, status: res.status }
    }
    const data = await res.json() as { id: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function runFeedback(options: FeedbackOptions = {}): Promise<void> {
  let kind = options.kind
  let message = options.message
  let deckSlug = options.deck

  const interactive = !message

  if (interactive) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    try {
      console.log(chalk.bold('\nSend feedback to the Throughline team.'))
      console.log(chalk.dim('Four questions. Authenticated by your `throughline login`.\n'))

      if (!kind) {
        while (!kind) {
          const raw = await ask(rl, chalk.bold('1. Kind?') + chalk.dim(' (b)ug / (s)uggestion / (q)uestion: '))
          const parsed = parseKind(raw)
          if (parsed) {
            kind = parsed
          } else {
            console.log(chalk.yellow('   Please enter b, s, or q.'))
          }
        }
      }

      message = await readMultiline(rl, '\n2. What happened or what would you like to see?')
      if (!message) throw new Error('Message is required.')

      if (!deckSlug) {
        const answer = await ask(rl, '\n3. Deck name (optional, blank to skip): ')
        if (answer) {
          const deck = getDeck(answer)
          if (deck?.publishedUrl) {
            const match = deck.publishedUrl.match(/\/(?:view|d)\/([^/?#]+)/) || deck.publishedUrl.match(/\/([^/?#]+)$/)
            deckSlug = match?.[1] || answer
          } else {
            deckSlug = answer
          }
        }
      }
    } finally {
      rl.close()
    }
  }

  if (!kind) kind = 'bug'
  if (!message) throw new Error('--message is required when not interactive.')

  const payload = buildPayload({ kind, message, deckSlug })

  const result = await postFeedback(payload)
  if (result.ok) {
    console.log(chalk.green(`\n✓ Feedback sent (#${result.id.slice(0, 8)})`))
    console.log(chalk.dim('   Thanks — we read everything.'))
    return
  }

  if (result.status === 401) {
    const path = spoolPending(payload)
    console.log(chalk.yellow('\n! Not authenticated.'))
    console.log(`  Run ${chalk.bold('throughline login')} and re-send from ${path}.`)
    return
  }

  const path = spoolPending(payload)
  console.log(chalk.red(`\n✗ Could not send feedback: ${result.error}`))
  console.log(chalk.dim(`  Saved locally at ${path} — re-send manually with curl or retry later.`))
}
