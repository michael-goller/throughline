/**
 * Iterative agent refinement protocol for Throughline decks.
 *
 * Builds on the core tools (add/modify/remove/reorder) to provide:
 * - Diff generation (human-readable before/after per slide)
 * - Edit session with history tracking and undo
 * - Compact deck summary for agent context windows
 * - Preview-before-apply workflow
 */

import type { SlideConfig } from '../types'
import type { DeckConfig, ToolResult } from './tools'
import { applyTool } from './tools'

// ── Types ─────────────────────────────────────────────────────

export type ChangeKind = 'add' | 'modify' | 'remove' | 'reorder'

export interface SlideChange {
  kind: ChangeKind
  slideId: string
  /** Slide index in original deck (undefined for adds) */
  fromIndex?: number
  /** Slide index in updated deck (undefined for removes) */
  toIndex?: number
  /** Changed field paths with old/new values (for modify) */
  fields?: FieldDiff[]
  /** Full slide config (for add) */
  slide?: SlideConfig
}

export interface FieldDiff {
  path: string
  oldValue: unknown
  newValue: unknown
}

export interface DeckDiff {
  changes: SlideChange[]
  summary: string
  slidesBefore: number
  slidesAfter: number
}

export interface EditHistoryEntry {
  timestamp: string
  toolName: string
  params: Record<string, unknown>
  deckBefore: DeckConfig
  deckAfter: DeckConfig
  diff: DeckDiff
  description: string
}

export interface EditSession {
  id: string
  deck: DeckConfig
  history: EditHistoryEntry[]
  createdAt: string
  updatedAt: string
}

// ── Diff generation ───────────────────────────────────────────

/** Shallow-diff two objects, returning changed field paths */
function diffFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  prefix = ''
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

  for (const key of allKeys) {
    if (key === 'id' || key === 'type') continue
    const path = prefix ? `${prefix}.${key}` : key
    const oldVal = oldObj[key]
    const newVal = newObj[key]

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ path, oldValue: oldVal, newValue: newVal })
    }
  }
  return diffs
}

/** Compare two deck configs and produce a structured diff */
export function computeDiff(before: DeckConfig, after: DeckConfig): DeckDiff {
  const changes: SlideChange[] = []
  const beforeMap = new Map(before.slides.map((s, i) => [s.id, { slide: s, index: i }]))
  const afterMap = new Map(after.slides.map((s, i) => [s.id, { slide: s, index: i }]))

  // Removed slides
  for (const [id, { index }] of beforeMap) {
    if (!afterMap.has(id)) {
      changes.push({ kind: 'remove', slideId: id, fromIndex: index })
    }
  }

  // Added slides
  for (const [id, { slide, index }] of afterMap) {
    if (!beforeMap.has(id)) {
      changes.push({ kind: 'add', slideId: id, toIndex: index, slide })
    }
  }

  // Modified slides
  for (const [id, { slide: afterSlide, index: afterIdx }] of afterMap) {
    const beforeEntry = beforeMap.get(id)
    if (!beforeEntry) continue
    const fields = diffFields(
      beforeEntry.slide as unknown as Record<string, unknown>,
      afterSlide as unknown as Record<string, unknown>
    )
    if (fields.length > 0) {
      changes.push({
        kind: 'modify',
        slideId: id,
        fromIndex: beforeEntry.index,
        toIndex: afterIdx,
        fields,
      })
    }
  }

  // Detect reorder (slides exist in both but order changed)
  const beforeOrder = before.slides.map((s) => s.id)
  const afterOrder = after.slides.map((s) => s.id)
  const commonBefore = beforeOrder.filter((id) => afterMap.has(id))
  const commonAfter = afterOrder.filter((id) => beforeMap.has(id))
  if (
    commonBefore.length > 0 &&
    JSON.stringify(commonBefore) !== JSON.stringify(commonAfter)
  ) {
    const existingModifyIds = new Set(
      changes.filter((c) => c.kind === 'modify').map((c) => c.slideId)
    )
    // Tag reorder on slides that moved position but weren't already captured as modify
    for (const id of commonAfter) {
      const bi = beforeMap.get(id)!.index
      const ai = afterMap.get(id)!.index
      if (bi !== ai && !existingModifyIds.has(id)) {
        changes.push({ kind: 'reorder', slideId: id, fromIndex: bi, toIndex: ai })
      }
    }
  }

  const summary = formatDiffSummary(changes)
  return {
    changes,
    summary,
    slidesBefore: before.slides.length,
    slidesAfter: after.slides.length,
  }
}

function formatDiffSummary(changes: SlideChange[]): string {
  if (changes.length === 0) return 'No changes.'
  const lines: string[] = []

  for (const c of changes) {
    switch (c.kind) {
      case 'add':
        lines.push(
          `+ Added slide "${c.slideId}" (${c.slide?.type ?? 'unknown'}) at position ${(c.toIndex ?? 0) + 1}`
        )
        break
      case 'remove':
        lines.push(`- Removed slide "${c.slideId}" from position ${(c.fromIndex ?? 0) + 1}`)
        break
      case 'modify': {
        const fieldList = (c.fields ?? []).map((f) => f.path).join(', ')
        lines.push(`~ Modified slide "${c.slideId}": ${fieldList}`)
        break
      }
      case 'reorder':
        lines.push(
          `↕ Moved slide "${c.slideId}" from position ${(c.fromIndex ?? 0) + 1} → ${(c.toIndex ?? 0) + 1}`
        )
        break
    }
  }
  return lines.join('\n')
}

// ── Preview ───────────────────────────────────────────────────

export interface ChangePreview {
  description: string
  diff: DeckDiff
  proposedDeck: DeckConfig
}

/** Preview what a tool call would do without committing to history */
export function previewChange(
  session: EditSession,
  toolName: string,
  params: Record<string, unknown>
): ChangePreview {
  const result = applyTool(toolName, params, session.deck)
  const diff = computeDiff(session.deck, result.deck)
  return {
    description: result.message,
    diff,
    proposedDeck: result.deck,
  }
}

// ── Edit session management ───────────────────────────────────

let sessionCounter = 0

/** Create a new editing session for an existing deck */
export function createEditSession(deck: DeckConfig): EditSession {
  return {
    id: `session-${Date.now()}-${++sessionCounter}`,
    deck: structuredClone(deck),
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/** Apply a tool call, record it in history, and return the result */
export function applyAndRecord(
  session: EditSession,
  toolName: string,
  params: Record<string, unknown>,
  description?: string
): ToolResult & { diff: DeckDiff } {
  const deckBefore = structuredClone(session.deck)
  const result = applyTool(toolName, params, session.deck)

  if (!result.success) {
    return { ...result, diff: { changes: [], summary: 'No changes (operation failed).', slidesBefore: session.deck.slides.length, slidesAfter: session.deck.slides.length } }
  }

  const diff = computeDiff(deckBefore, result.deck)

  session.history.push({
    timestamp: new Date().toISOString(),
    toolName,
    params,
    deckBefore,
    deckAfter: structuredClone(result.deck),
    diff,
    description: description ?? result.message,
  })

  session.deck = result.deck
  session.updatedAt = new Date().toISOString()

  return { ...result, diff }
}

/** Undo the most recent change, returning the reverted deck */
export function undoLastChange(session: EditSession): DeckConfig | null {
  const last = session.history.pop()
  if (!last) return null

  session.deck = structuredClone(last.deckBefore)
  session.updatedAt = new Date().toISOString()
  return session.deck
}

// ── Deck summary for agent context ────────────────────────────

export interface SlideSummary {
  position: number
  id: string
  type: string
  title?: string
  /** Key field names present on this slide (for agent reference) */
  fields: string[]
}

export interface DeckSummary {
  title: string
  description?: string
  slideCount: number
  slides: SlideSummary[]
  text: string
}

/** Generate a compact deck summary suitable for agent context windows */
export function summarizeDeck(deck: DeckConfig): DeckSummary {
  const slides: SlideSummary[] = deck.slides.map((slide, i) => {
    const { id, type, ...rest } = slide as Record<string, unknown> & { id: string; type: string }
    const fields = Object.keys(rest).filter((k) => k !== 'notes')
    const title = typeof rest.title === 'string' ? rest.title : undefined
    return { position: i + 1, id, type, title, fields }
  })

  const lines = [
    `# ${deck.title}`,
    deck.description ? `> ${deck.description}` : '',
    `${deck.slides.length} slides:\n`,
    ...slides.map((s) => {
      const titlePart = s.title ? ` — "${s.title}"` : ''
      const fieldsPart = s.fields.length > 0 ? ` [${s.fields.join(', ')}]` : ''
      return `  ${s.position}. \`${s.id}\` (${s.type})${titlePart}${fieldsPart}`
    }),
  ]

  return {
    title: deck.title,
    description: deck.description,
    slideCount: deck.slides.length,
    slides,
    text: lines.filter(Boolean).join('\n'),
  }
}

/** Get full config for a specific slide (for agent to read before modifying) */
export function getSlideConfig(deck: DeckConfig, slideId: string): SlideConfig | null {
  return deck.slides.find((s) => s.id === slideId) ?? null
}

/** Format edit history as a conversation-style log */
export function formatHistory(session: EditSession): string {
  if (session.history.length === 0) return 'No edits yet.'

  return session.history
    .map((entry, i) => {
      const num = i + 1
      return `${num}. [${entry.timestamp}] ${entry.description}\n   ${entry.diff.summary.split('\n').join('\n   ')}`
    })
    .join('\n\n')
}
