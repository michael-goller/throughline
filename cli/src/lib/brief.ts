/**
 * Scaffold a deck from a `.throughline-brief.json` — pre-populates the
 * `throughline` field and maps the brief's evidence to slide sections.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { createDeck } from './deck.js'
import type { ThroughlineBrief } from './shape.js'

function escapeTsString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')
}

function toIdSlug(s: string, fallback: string): string {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return slug || fallback
}

function formatTitle(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Render a `slides.config.ts` that default-exports a full DeckConfig with
 * the throughline statement and evidence mapped to content slides.
 */
export function renderBriefConfig(deckName: string, brief: ThroughlineBrief): string {
  const title = formatTitle(deckName)
  const lines: string[] = []

  lines.push("import type { SlideConfig } from './types'")
  lines.push('')
  lines.push('/**')
  lines.push(' * Generated from `.throughline-brief.json`.')
  lines.push(' * The `throughline` field is the single claim every slide must serve.')
  lines.push(' * Edit freely — this is just a starting argument, not a finished deck.')
  lines.push(' */')
  lines.push(`export const throughline = '${escapeTsString(brief.throughline)}'`)
  lines.push('')
  lines.push(`export const title = '${escapeTsString(title)}'`)
  lines.push('')
  lines.push('export const slides: SlideConfig[] = [')

  lines.push('  {')
  lines.push(`    id: 'intro',`)
  lines.push(`    type: 'title-digital',`)
  lines.push(`    title: '${escapeTsString(brief.throughline)}',`)
  lines.push(`    subtitle: 'For ${escapeTsString(brief.audience)}',`)
  lines.push('  },')

  lines.push('  {')
  lines.push(`    id: 'audience',`)
  lines.push(`    type: 'content',`)
  lines.push(`    title: 'Who this is for',`)
  lines.push(`    body: '${escapeTsString(brief.audience)}',`)
  lines.push('  },')

  lines.push('  {')
  lines.push(`    id: 'status-quo',`)
  lines.push(`    type: 'quote',`)
  lines.push(`    quote: '${escapeTsString(brief.currentBelief)}',`)
  lines.push(`    author: 'The room, right now',`)
  lines.push(`    variant: 'full',`)
  lines.push('  },')

  lines.push('  {')
  lines.push(`    id: 'evidence-divider',`)
  lines.push(`    type: 'divider',`)
  lines.push(`    title: 'Why this claim holds',`)
  lines.push(`    subtitle: 'The evidence that makes the case',`)
  lines.push('  },')

  brief.evidence.forEach((item, i) => {
    const slug = toIdSlug(item, `point-${i + 1}`)
    lines.push('  {')
    lines.push(`    id: 'evidence-${i + 1}-${slug}',`)
    lines.push(`    type: 'content',`)
    lines.push(`    title: 'Evidence ${i + 1}',`)
    lines.push(`    body: '${escapeTsString(item)}',`)
    lines.push('  },')
  })

  lines.push('  {')
  lines.push(`    id: 'closing',`)
  lines.push(`    type: 'closing',`)
  lines.push(`    tagline: '${escapeTsString(brief.throughline)}',`)
  lines.push('  },')

  lines.push(']')
  lines.push('')
  lines.push('const config = { title, throughline, slides }')
  lines.push('export default config')
  lines.push('')

  return lines.join('\n')
}

/**
 * Create a thin deck and overwrite its `slides.config.ts` with a config
 * generated from `brief`.
 */
export function createDeckFromBrief(
  deckName: string,
  brief: ThroughlineBrief,
  options: { targetDir?: string } = {}
): string {
  const deckPath = createDeck(deckName, { targetDir: options.targetDir, thin: true })
  const configPath = join(deckPath, 'slides.config.ts')
  writeFileSync(configPath, renderBriefConfig(deckName, brief), 'utf-8')
  return deckPath
}
