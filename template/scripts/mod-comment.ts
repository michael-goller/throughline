/**
 * Comment moderation CLI for the InstantDB feedback layer.
 *
 * The viewer's anonymous client cannot delete comments — `instant.perms.ts`
 * blocks `delete` and pins immutable fields. When something offensive or
 * incorrect lands in production we hide it from the laptop with the InstantDB
 * admin SDK (which bypasses the rules layer).
 *
 * Required env (load from a local .env, do NOT commit):
 *   INSTANT_APP_ID            (or VITE_INSTANTDB_APP_ID — same value)
 *   INSTANT_APP_ADMIN_TOKEN   (rotate from the InstantDB dashboard if leaked)
 *
 * Usage:
 *   tsx scripts/mod-comment.ts list <deckSlug> [--limit 50] [--unresolved]
 *   tsx scripts/mod-comment.ts show <commentId>
 *   tsx scripts/mod-comment.ts resolve <commentId>
 *   tsx scripts/mod-comment.ts stub <commentId> [--text "[removed by admin]"]
 *   tsx scripts/mod-comment.ts delete <commentId> [--yes]
 *
 * `resolve` is the lightest touch — flips `resolved=true` so the comment hides
 * from PresenterView's open-items list. `stub` overwrites `text` with a
 * placeholder when the body itself must disappear (e.g. PII). `delete` is the
 * nuclear option and prompts for confirmation unless `--yes` is passed.
 */

import { init } from '@instantdb/admin'
import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))

type Comment = {
  id: string
  deckId: string
  slideId: string
  type: string
  text: string
  authorName: string
  authorEmail: string
  timestamp: number
  resolved: boolean
  x: number
  y: number
  replies?: unknown
}

const [, , command, positional, ...rest] = process.argv

if (!command || command === '-h' || command === '--help') {
  printUsage()
  process.exit(command ? 0 : 1)
}

// Load .env from the template root so the script works from any cwd.
loadDotEnv(resolvePath(__dirname, '..', '.env'))
loadDotEnv(resolvePath(__dirname, '..', '.env.local'))

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANTDB_APP_ID
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing INSTANT_APP_ID and/or INSTANT_APP_ADMIN_TOKEN.')
  console.error('Set them in template/.env or export them in your shell.')
  process.exit(2)
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN })
const flags = parseFlags(rest)

try {
  switch (command) {
    case 'list':
      await runList(positional, flags)
      break
    case 'show':
      await runShow(positional)
      break
    case 'resolve':
      await runResolve(positional)
      break
    case 'stub':
      await runStub(positional, flags)
      break
    case 'delete':
      await runDelete(positional, flags)
      break
    default:
      printUsage()
      process.exit(1)
  }
} catch (err) {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
}

async function runList(deckId: string | undefined, opts: Flags) {
  if (!deckId) bail('list requires a deck slug. e.g. `mod-comment list my-deck-slug`')
  const limit = opts.limit ? Number(opts.limit) : 50
  if (!Number.isFinite(limit) || limit <= 0) bail('--limit must be a positive integer')

  const data = await db.query({
    comments: { $: { where: { deckId } } },
  })
  const all = (data.comments ?? []) as Comment[]
  const filtered = opts.unresolved ? all.filter((c) => !c.resolved) : all
  filtered.sort((a, b) => b.timestamp - a.timestamp)
  const rows = filtered.slice(0, limit)

  if (rows.length === 0) {
    console.log(`No${opts.unresolved ? ' unresolved' : ''} comments for deck "${deckId}".`)
    return
  }

  for (const c of rows) {
    const when = new Date(c.timestamp).toISOString()
    const flag = c.resolved ? 'resolved' : 'open    '
    const text = truncate(c.text.replace(/\s+/g, ' '), 80)
    console.log(`${flag}  ${when}  ${c.id}  [${c.type}]  ${c.authorName} — ${text}`)
  }
}

async function runShow(commentId: string | undefined) {
  if (!commentId) bail('show requires a comment id')
  const c = await loadComment(commentId)
  console.log(JSON.stringify(c, null, 2))
}

async function runResolve(commentId: string | undefined) {
  if (!commentId) bail('resolve requires a comment id')
  const before = await loadComment(commentId)
  if (before.resolved) {
    console.log(`Comment ${commentId} is already resolved.`)
    return
  }
  await db.transact([db.tx.comments[commentId].update({ resolved: true })])
  console.log(`Resolved comment ${commentId} on deck "${before.deckId}".`)
}

async function runStub(commentId: string | undefined, opts: Flags) {
  if (!commentId) bail('stub requires a comment id')
  const before = await loadComment(commentId)
  const replacement = typeof opts.text === 'string' && opts.text.length > 0
    ? opts.text
    : '[removed by admin]'
  await db.transact([
    db.tx.comments[commentId].update({ text: replacement, resolved: true }),
  ])
  console.log(`Stubbed comment ${commentId} on deck "${before.deckId}".`)
  console.log(`  before: ${truncate(before.text.replace(/\s+/g, ' '), 100)}`)
  console.log(`   after: ${replacement}`)
}

async function runDelete(commentId: string | undefined, opts: Flags) {
  if (!commentId) bail('delete requires a comment id')
  const before = await loadComment(commentId)
  if (!opts.yes) {
    const ok = await confirm(
      `Delete comment ${commentId} on deck "${before.deckId}" by ${before.authorName}? [y/N] `,
    )
    if (!ok) {
      console.log('Aborted.')
      return
    }
  }
  await db.transact([db.tx.comments[commentId].delete()])
  console.log(`Deleted comment ${commentId}.`)
}

async function loadComment(commentId: string): Promise<Comment> {
  const data = await db.query({
    comments: { $: { where: { id: commentId } } },
  })
  const row = (data.comments ?? [])[0] as Comment | undefined
  if (!row) bail(`Comment ${commentId} not found.`)
  return row
}

type Flags = { limit?: string; text?: string; unresolved?: boolean; yes?: boolean }

function parseFlags(args: string[]): Flags {
  const out: Flags = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--limit':
        out.limit = args[++i]
        break
      case '--text':
        out.text = args[++i]
        break
      case '--unresolved':
        out.unresolved = true
        break
      case '--yes':
      case '-y':
        out.yes = true
        break
      default:
        bail(`Unknown flag: ${arg}`)
    }
  }
  return out
}

function loadDotEnv(path: string) {
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    return
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    if (process.env[key] !== undefined) continue
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((res) => {
    rl.question(prompt, (answer) => {
      rl.close()
      res(/^y(es)?$/i.test(answer.trim()))
    })
  })
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max - 1) + '…'
}

function bail(message: string): never {
  console.error(message)
  process.exit(1)
}

function printUsage() {
  console.log(`Comment moderation (InstantDB admin)

  tsx scripts/mod-comment.ts list <deckSlug> [--limit 50] [--unresolved]
  tsx scripts/mod-comment.ts show <commentId>
  tsx scripts/mod-comment.ts resolve <commentId>
  tsx scripts/mod-comment.ts stub <commentId> [--text "..."]
  tsx scripts/mod-comment.ts delete <commentId> [--yes]
`)
}
