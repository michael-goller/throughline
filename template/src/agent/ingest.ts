/**
 * Context ingestion pipeline for Shine deck generation.
 *
 * Extracts structured content from documents (PDF, DOCX, PPTX)
 * and data files (CSV, Excel), then transforms it into context
 * that the agent can use for slide creation.
 *
 * Parser dependencies are loaded dynamically — install as needed:
 * - PDF:   npm install pdf-parse
 * - DOCX:  npm install mammoth
 * - PPTX:  npm install jszip
 * - Excel: npm install xlsx
 * - CSV:   Built-in (no additional deps)
 *
 * Note: Binary parsers (PDF, DOCX, PPTX, Excel) require a Node.js runtime.
 * Text/CSV parsing works in any environment.
 *
 * @example
 * ```ts
 * import { ingestDocument, ingestDataFile, analyzeDeckStyle, buildIngestContext } from './agent'
 *
 * const doc = await ingestDocument({ type: 'pdf', data: pdfBuffer, name: 'Q1-report.pdf' })
 * const csv = ingestDataFile({ type: 'csv', data: csvText, name: 'metrics.csv' })
 * const style = analyzeDeckStyle(existingDeck)
 * const context = buildIngestContext([doc], [csv], style)
 * // Pass context.prompt to the AI model alongside the system prompt
 * ```
 */

import type { DeckConfig } from './tools'

// ── Types ─────────────────────────────────────────────────────

/** Supported document formats for content extraction */
export type DocumentFormat = 'pdf' | 'docx' | 'pptx' | 'txt' | 'md'

/** Supported data file formats */
export type DataFormat = 'csv' | 'xlsx' | 'tsv'

/** Input source for ingestion */
export interface IngestSource {
  /** File format */
  type: DocumentFormat | DataFormat
  /** File content as ArrayBuffer (binary) or string (text) */
  data: ArrayBuffer | Uint8Array | string
  /** Original file name (for context) */
  name?: string
}

/** A section of extracted content from a document */
export interface ExtractedSection {
  /** Section heading (empty string for untitled sections) */
  heading: string
  /** Section depth (1 = h1, 2 = h2, etc.) */
  depth: number
  /** Body text (paragraphs joined by newlines) */
  body: string
  /** Bullet points extracted from the section */
  bullets: string[]
  /** Key-value pairs found (e.g., "Revenue: $1.2M") */
  keyValues: Record<string, string>
}

/** Result of extracting content from a document */
export interface ExtractedContent {
  /** Source file name */
  source: string
  /** Document format */
  format: DocumentFormat
  /** Document title (if detected) */
  title?: string
  /** Extracted sections in document order */
  sections: ExtractedSection[]
  /** Full plain text (for fallback / search) */
  plainText: string
  /** Detected key metrics/numbers */
  metrics: ExtractedMetric[]
  /** Detected quotes or callouts */
  quotes: string[]
}

/** A numeric metric extracted from content */
export interface ExtractedMetric {
  label: string
  value: string
  /** Parsed numeric value (NaN if not parseable) */
  numericValue: number
  /** Detected unit or suffix (%, $, etc.) */
  unit?: string
  /** Detected trend direction */
  trend?: 'up' | 'down' | 'flat'
}

/** Structured tabular data from CSV/Excel */
export interface DataTable {
  /** Source file name */
  source: string
  /** Sheet name (for Excel with multiple sheets) */
  sheet?: string
  /** Column headers */
  headers: string[]
  /** Data rows (each row is an array of string values) */
  rows: string[][]
  /** Detected column types */
  columnTypes: ColumnType[]
}

export type ColumnType = 'numeric' | 'text' | 'date' | 'percentage' | 'currency'

/** Style profile extracted from an existing deck */
export interface DeckStyleProfile {
  /** Source deck title */
  deckTitle: string
  /** Slide type distribution (type → count) */
  slideTypeDistribution: Record<string, number>
  /** Average bullets per content slide */
  avgBulletsPerSlide: number
  /** Whether the deck uses section dividers */
  usesDividers: boolean
  /** Opening slide type */
  openingType: string
  /** Closing slide type */
  closingType: string
  /** Common icon names used */
  commonIcons: string[]
  /** Tone indicators extracted from text */
  toneIndicators: string[]
  /** Total slide count */
  slideCount: number
}

/** Suggested mapping from extracted content to slide types */
export interface SlideRecommendation {
  /** Recommended slide type */
  slideType: string
  /** Why this type was recommended */
  reason: string
  /** Source section or data that maps to this slide */
  sourceRef: string
  /** Suggested slide content (partial) */
  suggestedContent: Record<string, unknown>
}

/** Final output of the ingestion pipeline */
export interface IngestContext {
  /** Extracted documents */
  documents: ExtractedContent[]
  /** Extracted data tables */
  dataTables: DataTable[]
  /** Style profile from reference deck (if provided) */
  styleProfile?: DeckStyleProfile
  /** Slide recommendations based on content analysis */
  recommendations: SlideRecommendation[]
  /** Formatted prompt string ready for agent context */
  prompt: string
}

// ── Helpers ──────────────────────────────────────────────────

/** Decode binary data to UTF-8 string */
function decodeText(data: ArrayBuffer | Uint8Array | string): string {
  if (typeof data === 'string') return data
  return new TextDecoder('utf-8').decode(data)
}

/** Ensure data is an ArrayBuffer for library consumption */
function toArrayBuffer(data: ArrayBuffer | Uint8Array | string): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  if (data instanceof Uint8Array) return new Uint8Array(data).buffer as ArrayBuffer
  return new TextEncoder().encode(data).buffer as ArrayBuffer
}

// ── CSV Parser (built-in, no deps) ──────────���────────────────

/**
 * Parse CSV/TSV text into a DataTable.
 * Handles quoted fields, embedded commas, and newlines within quotes.
 */
export function parseCSV(text: string, options?: { delimiter?: string; name?: string }): DataTable {
  const delimiter = options?.delimiter ?? (text.includes('\t') ? '\t' : ',')
  const rows = parseCSVRows(text, delimiter)

  if (rows.length === 0) {
    return { source: options?.name ?? 'data.csv', headers: [], rows: [], columnTypes: [] }
  }

  const headers = rows[0]
  const dataRows = rows.slice(1)
  const columnTypes = detectColumnTypes(headers, dataRows)

  return {
    source: options?.name ?? 'data.csv',
    headers,
    rows: dataRows,
    columnTypes,
  }
}

function parseCSVRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++ // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        current.push(field.trim())
        field = ''
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field.trim())
        if (current.some((c) => c !== '')) rows.push(current)
        current = []
        field = ''
        if (ch === '\r') i++ // skip \n in \r\n
      } else {
        field += ch
      }
    }
  }

  // Last field/row
  current.push(field.trim())
  if (current.some((c) => c !== '')) rows.push(current)

  return rows
}

function detectColumnTypes(headers: string[], rows: string[][]): ColumnType[] {
  return headers.map((_, colIdx) => {
    const values = rows.map((r) => r[colIdx] ?? '').filter(Boolean)
    if (values.length === 0) return 'text'

    const currencyPattern = /^[$€£¥][\d,]+\.?\d*$|^[\d,]+\.?\d*\s*[$€£¥]$/
    const percentPattern = /^[\d.]+%$/
    const datePattern = /^\d{4}[-/]\d{2}[-/]\d{2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/
    const numericPattern = /^-?[\d,]+\.?\d*$/

    const typeCounts = { currency: 0, percentage: 0, date: 0, numeric: 0, text: 0 }
    for (const v of values) {
      if (currencyPattern.test(v)) typeCounts.currency++
      else if (percentPattern.test(v)) typeCounts.percentage++
      else if (datePattern.test(v)) typeCounts.date++
      else if (numericPattern.test(v)) typeCounts.numeric++
      else typeCounts.text++
    }

    const threshold = values.length * 0.7
    if (typeCounts.currency >= threshold) return 'currency'
    if (typeCounts.percentage >= threshold) return 'percentage'
    if (typeCounts.date >= threshold) return 'date'
    if (typeCounts.numeric >= threshold) return 'numeric'
    return 'text'
  })
}

// ── PDF Parser ───────────────────────────────────────────────

/** Parse a PDF file into ExtractedContent. Requires `pdf-parse` package (Node.js). */
export async function parsePDF(data: ArrayBuffer | Uint8Array, name?: string): Promise<ExtractedContent> {
  let pdfParse: (buffer: ArrayBuffer | Uint8Array) => Promise<{ text: string; numpages: number; info?: { Title?: string } }>
  try {
    // @ts-expect-error — pdf-parse is an optional peer dependency
    const mod = await import('pdf-parse')
    pdfParse = mod.default ?? mod
  } catch {
    throw new Error('pdf-parse package required for PDF ingestion. Install with: npm install pdf-parse')
  }

  const result = await pdfParse(toArrayBuffer(data))

  return extractContentFromText(result.text, {
    source: name ?? 'document.pdf',
    format: 'pdf',
    title: result.info?.Title,
  })
}

// ── DOCX Parser ──────────────────────────────────────────────

/** Parse a DOCX file into ExtractedContent. Requires `mammoth` package (Node.js). */
export async function parseDOCX(data: ArrayBuffer | Uint8Array, name?: string): Promise<ExtractedContent> {
  let mammoth: { extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }
  try {
    // @ts-expect-error — mammoth is an optional peer dependency
    mammoth = await import('mammoth')
  } catch {
    throw new Error('mammoth package required for DOCX ingestion. Install with: npm install mammoth')
  }

  const result = await mammoth.extractRawText({ arrayBuffer: toArrayBuffer(data) })

  return extractContentFromText(result.value, {
    source: name ?? 'document.docx',
    format: 'docx',
  })
}

// ── PPTX Parser ──────────────────────────────────────────────

/** Parse a PPTX file into ExtractedContent. Requires `jszip` package. */
export async function parsePPTX(data: ArrayBuffer | Uint8Array, name?: string): Promise<ExtractedContent> {
  type ZipFiles = Record<string, { async: (type: string) => Promise<string> }>
  let JSZip: new () => { loadAsync: (data: ArrayBuffer) => Promise<{ files: ZipFiles }> }
  try {
    // @ts-expect-error — jszip is an optional peer dependency
    const mod = await import('jszip')
    JSZip = mod.default ?? mod
  } catch {
    throw new Error('jszip package required for PPTX ingestion. Install with: npm install jszip')
  }

  const zip = new JSZip()
  const contents = await zip.loadAsync(toArrayBuffer(data))

  // Extract text from slide XML files
  const slideTexts: string[] = []
  const slideFiles = Object.keys(contents.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0')
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0')
      return numA - numB
    })

  for (const slideFile of slideFiles) {
    const xml = await contents.files[slideFile].async('text')
    const text = extractTextFromXML(xml)
    if (text.trim()) slideTexts.push(text)
  }

  const plainText = slideTexts.join('\n\n---\n\n')
  const sections: ExtractedSection[] = slideTexts.map((text, i) => {
    const lines = text.split('\n').filter(Boolean)
    const heading = lines[0] ?? `Slide ${i + 1}`
    const body = lines.slice(1).join('\n')
    const bullets = lines.slice(1).filter((l) => l.startsWith('\u2022') || l.startsWith('-') || l.startsWith('*'))
      .map((l) => l.replace(/^[\u2022\-*]\s*/, ''))

    return {
      heading,
      depth: 1,
      body,
      bullets,
      keyValues: extractKeyValues(body),
    }
  })

  return {
    source: name ?? 'presentation.pptx',
    format: 'pptx',
    title: sections[0]?.heading,
    sections,
    plainText,
    metrics: extractMetrics(plainText),
    quotes: extractQuotes(plainText),
  }
}

/** Extract plain text from OOXML slide content */
function extractTextFromXML(xml: string): string {
  // Extract text runs from <a:t> tags (PowerPoint text elements)
  const textParts: string[] = []
  const paragraphs = xml.split(/<a:p[^>]*>/g)

  for (const para of paragraphs) {
    const textRuns = para.match(/<a:t>([^<]*)<\/a:t>/g)
    if (textRuns) {
      const line = textRuns
        .map((t) => t.replace(/<\/?a:t>/g, ''))
        .join('')
        .trim()
      if (line) textParts.push(line)
    }
  }

  return textParts.join('\n')
}

// ── Excel Parser ─────────────────────────────────────────────

/** Parse an Excel file into DataTables. Requires `xlsx` package (Node.js). */
export async function parseExcel(data: ArrayBuffer | Uint8Array, name?: string): Promise<DataTable[]> {
  let XLSX: {
    read: (data: ArrayBuffer, opts?: { type?: string }) => {
      SheetNames: string[]
      Sheets: Record<string, unknown>
    }
    utils: {
      sheet_to_json: (sheet: unknown, opts?: { header?: number; raw?: boolean }) => string[][]
    }
  }
  try {
    // @ts-expect-error — xlsx is an optional peer dependency
    XLSX = await import('xlsx')
  } catch {
    throw new Error('xlsx package required for Excel ingestion. Install with: npm install xlsx')
  }

  const workbook = XLSX.read(toArrayBuffer(data), { type: 'array' })
  const tables: DataTable[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][]

    if (rows.length === 0) continue

    const headers = rows[0].map((h) => String(h ?? ''))
    const dataRows = rows.slice(1).map((r) => headers.map((_, i) => String(r[i] ?? '')))
    const columnTypes = detectColumnTypes(headers, dataRows)

    tables.push({
      source: name ?? 'data.xlsx',
      sheet: sheetName,
      headers,
      rows: dataRows,
      columnTypes,
    })
  }

  return tables
}

// ── Text/Markdown Parser ─────────────────────────────────────

/** Parse plain text or markdown into ExtractedContent */
export function parseText(text: string, options?: { name?: string; format?: 'txt' | 'md' }): ExtractedContent {
  return extractContentFromText(text, {
    source: options?.name ?? 'document.txt',
    format: options?.format ?? 'txt',
  })
}

// ── Shared extraction helpers ────────────────────────────────

interface ExtractionOptions {
  source: string
  format: DocumentFormat
  title?: string
}

function extractContentFromText(text: string, opts: ExtractionOptions): ExtractedContent {
  const lines = text.split('\n')
  const sections: ExtractedSection[] = []
  let currentSection: ExtractedSection | null = null

  // Detect heading patterns: markdown (#), ALL CAPS lines, or lines followed by === / ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue

    const mdHeading = trimmed.match(/^(#{1,6})\s+(.+)/)
    const isAllCaps = trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
    const nextLine = lines[i + 1]?.trim() ?? ''
    const isUnderlined = /^[=]+$/.test(nextLine) || /^[-]+$/.test(nextLine)

    if (mdHeading || isAllCaps || isUnderlined) {
      // Start new section
      if (currentSection) sections.push(currentSection)

      const heading = mdHeading ? mdHeading[2] : trimmed
      const depth = mdHeading ? mdHeading[1].length : (isAllCaps ? 1 : 2)

      currentSection = {
        heading,
        depth,
        body: '',
        bullets: [],
        keyValues: {},
      }

      if (isUnderlined) i++ // skip underline
    } else if (currentSection) {
      // Add to current section
      const isBullet = /^\s*[-\u2022*]\s+/.test(trimmed) || /^\s*\d+[.)]\s+/.test(trimmed)
      if (isBullet) {
        currentSection.bullets.push(trimmed.replace(/^\s*[-\u2022*\d.)\s]+/, ''))
      }
      currentSection.body += (currentSection.body ? '\n' : '') + trimmed
    } else {
      // Pre-heading content — create implicit section
      currentSection = {
        heading: '',
        depth: 0,
        body: trimmed,
        bullets: [],
        keyValues: {},
      }
    }
  }

  if (currentSection) sections.push(currentSection)

  // Extract key-values from each section
  for (const section of sections) {
    section.keyValues = extractKeyValues(section.body)
  }

  // Detect title from first heading or options
  const title = opts.title ?? sections.find((s) => s.depth <= 1 && s.heading)?.heading

  return {
    source: opts.source,
    format: opts.format,
    title,
    sections,
    plainText: text,
    metrics: extractMetrics(text),
    quotes: extractQuotes(text),
  }
}

/** Extract key: value pairs from text */
function extractKeyValues(text: string): Record<string, string> {
  const kvs: Record<string, string> = {}
  const lines = text.split('\n')
  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z\s]{1,30}):\s*(.+)$/)
    if (match) {
      kvs[match[1].trim()] = match[2].trim()
    }
  }
  return kvs
}

/** Extract numeric metrics from text */
function extractMetrics(text: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = []
  const seen = new Set<string>()

  // Pattern: "Label: $1,234" or "Revenue $1.2M" or "Growth: 45%" etc.
  const patterns = [
    /(?:^|\n)\s*([A-Za-z][A-Za-z\s]{1,30}):\s*([$\u20ac\u00a3\u00a5]?[\d,]+\.?\d*[KMBTkmbt%]?)\s*(?:\(([^)]+)\))?/g,
    /(?:^|\n)\s*([A-Za-z][A-Za-z\s]{1,30})\s+([$\u20ac\u00a3\u00a5][\d,]+\.?\d*[KMBTkmbt]?)/g,
    /(?:^|\n)\s*([A-Za-z][A-Za-z\s]{1,30})\s+(\d[\d,]*\.?\d*%)/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const label = match[1].trim()
      const value = match[2].trim()
      const key = `${label}:${value}`
      if (seen.has(key)) continue
      seen.add(key)

      const cleanNum = value.replace(/[$\u20ac\u00a3\u00a5,%KMBTkmbt]/g, '').replace(/,/g, '')
      let numericValue = parseFloat(cleanNum)
      const suffix = value.match(/[KMBTkmbt]$/)?.[0]?.toUpperCase()
      if (suffix === 'K') numericValue *= 1_000
      else if (suffix === 'M') numericValue *= 1_000_000
      else if (suffix === 'B') numericValue *= 1_000_000_000
      else if (suffix === 'T') numericValue *= 1_000_000_000_000

      let unit: string | undefined
      if (value.includes('%')) unit = '%'
      else if (/[$\u20ac\u00a3\u00a5]/.test(value)) unit = value.match(/[$\u20ac\u00a3\u00a5]/)?.[0]

      // Check for trend indicators in surrounding text
      const trendContext = match[3]?.toLowerCase() ?? ''
      let trend: 'up' | 'down' | 'flat' | undefined
      if (/up|increase|grew|growth|\u2191|\+/.test(trendContext)) trend = 'up'
      else if (/down|decrease|declined|drop|\u2193|-/.test(trendContext)) trend = 'down'
      else if (/flat|unchanged|stable/.test(trendContext)) trend = 'flat'

      metrics.push({ label, value, numericValue, unit, trend })
    }
  }

  return metrics
}

/** Extract notable quotes from text */
function extractQuotes(text: string): string[] {
  const quotes: string[] = []

  // Quoted text with attribution
  const quotePatterns = [
    /"([^"]{20,200})"/g,
    /\u201c([^\u201d]{20,200})\u201d/g, // smart quotes
    /^>\s*(.{20,200})$/gm, // blockquote
  ]

  for (const pattern of quotePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const quote = match[1].trim()
      if (!quotes.includes(quote)) quotes.push(quote)
    }
  }

  return quotes.slice(0, 5) // Limit to 5 most relevant
}

// ── Deck Style Analysis ──────────────────────────────────────

/** Analyze an existing deck to extract style patterns for consistency */
export function analyzeDeckStyle(deck: DeckConfig): DeckStyleProfile {
  const slides = deck.slides as Array<Record<string, unknown> & { id: string; type: string }>

  // Slide type distribution
  const slideTypeDistribution: Record<string, number> = {}
  for (const slide of slides) {
    slideTypeDistribution[slide.type] = (slideTypeDistribution[slide.type] ?? 0) + 1
  }

  // Average bullets per slide
  let totalBullets = 0
  let slidesWithBullets = 0
  for (const slide of slides) {
    const bullets = slide.bullets as string[] | undefined
    const items = slide.items as unknown[] | undefined
    const steps = slide.steps as unknown[] | undefined
    const count = bullets?.length ?? items?.length ?? steps?.length ?? 0
    if (count > 0) {
      totalBullets += count
      slidesWithBullets++
    }
  }

  // Icon collection
  const iconList: string[] = []
  for (const slide of slides) {
    for (const value of Object.values(slide)) {
      if (typeof value === 'string' && /^[A-Z][a-zA-Z]+\d*$/.test(value)) {
        if (!iconList.includes(value)) iconList.push(value)
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object' && item !== null && 'icon' in item) {
            const icon = (item as { icon: unknown }).icon
            if (typeof icon === 'string' && !iconList.includes(icon)) iconList.push(icon)
          }
        }
      }
    }
  }

  // Tone analysis from text content
  const allText = slides
    .map((s) => [s.title, s.subtitle, s.body, ...(s.bullets as string[] ?? [])].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase()

  const toneIndicators: string[] = []
  if (/strategic|vision|transform/.test(allText)) toneIndicators.push('strategic')
  if (/data|metric|measure|kpi/.test(allText)) toneIndicators.push('data-driven')
  if (/team|collaborate|together/.test(allText)) toneIndicators.push('collaborative')
  if (/innovat|disrupt|cutting.?edge/.test(allText)) toneIndicators.push('innovative')
  if (/risk|challenge|concern/.test(allText)) toneIndicators.push('risk-aware')
  if (/action|execute|deliver/.test(allText)) toneIndicators.push('action-oriented')

  return {
    deckTitle: deck.title,
    slideTypeDistribution,
    avgBulletsPerSlide: slidesWithBullets > 0 ? Math.round(totalBullets / slidesWithBullets) : 0,
    usesDividers: 'divider' in slideTypeDistribution,
    openingType: slides[0]?.type ?? 'title',
    closingType: slides[slides.length - 1]?.type ?? 'closing',
    commonIcons: iconList.slice(0, 15),
    toneIndicators,
    slideCount: slides.length,
  }
}

// ── Slide Recommendations ────────────────────────────────────

/** Map extracted content and data to recommended slide types */
function generateRecommendations(
  documents: ExtractedContent[],
  dataTables: DataTable[],
): SlideRecommendation[] {
  const recs: SlideRecommendation[] = []

  for (const doc of documents) {
    // Title from document
    if (doc.title) {
      recs.push({
        slideType: 'title',
        reason: 'Document title detected',
        sourceRef: `${doc.source}: title`,
        suggestedContent: { title: doc.title },
      })
    }

    for (const section of doc.sections) {
      if (!section.heading && !section.body) continue

      // Sections with metrics → stats slide
      const sectionMetrics = extractMetrics(section.body)
      if (sectionMetrics.length >= 2) {
        recs.push({
          slideType: 'stats',
          reason: `${sectionMetrics.length} metrics found in section`,
          sourceRef: `${doc.source}: "${section.heading}"`,
          suggestedContent: {
            title: section.heading || 'Key Metrics',
            stats: sectionMetrics.slice(0, 4).map((m) => ({
              label: m.label,
              value: m.value,
              suffix: m.unit ?? '',
            })),
          },
        })
        continue
      }

      // Sections with many bullets → content or steps slide
      if (section.bullets.length >= 4) {
        recs.push({
          slideType: 'steps',
          reason: `${section.bullets.length} bullet points suitable for steps layout`,
          sourceRef: `${doc.source}: "${section.heading}"`,
          suggestedContent: {
            title: section.heading,
            steps: section.bullets.slice(0, 6).map((b) => ({
              title: b.length > 40 ? b.slice(0, 37) + '...' : b,
              description: b,
            })),
          },
        })
      } else if (section.bullets.length > 0) {
        recs.push({
          slideType: 'content',
          reason: 'Section with heading and bullet points',
          sourceRef: `${doc.source}: "${section.heading}"`,
          suggestedContent: {
            title: section.heading,
            bullets: section.bullets,
          },
        })
      }

      // Sections with key-value pairs → two-column or content
      if (Object.keys(section.keyValues).length >= 3) {
        recs.push({
          slideType: 'two-column',
          reason: 'Multiple key-value pairs suitable for two-column layout',
          sourceRef: `${doc.source}: "${section.heading}"`,
          suggestedContent: {
            title: section.heading,
          },
        })
      }

      // Long prose sections → content slide with body
      if (!section.bullets.length && section.body.length > 100) {
        recs.push({
          slideType: 'content',
          reason: 'Substantial text content',
          sourceRef: `${doc.source}: "${section.heading}"`,
          suggestedContent: {
            title: section.heading,
            body: section.body.length > 200 ? section.body.slice(0, 197) + '...' : section.body,
          },
        })
      }
    }

    // Quotes → quote slide
    for (const quote of doc.quotes.slice(0, 2)) {
      recs.push({
        slideType: 'quote',
        reason: 'Notable quote detected',
        sourceRef: `${doc.source}: quote`,
        suggestedContent: { quote },
      })
    }
  }

  // Data tables → chart/metric slides
  for (const table of dataTables) {
    const numericCols = table.columnTypes.filter((t) => t === 'numeric' || t === 'currency' || t === 'percentage')

    if (numericCols.length >= 2 && table.rows.length >= 2) {
      recs.push({
        slideType: 'stats',
        reason: `Data table with ${numericCols.length} numeric columns and ${table.rows.length} rows`,
        sourceRef: `${table.source}${table.sheet ? ` (${table.sheet})` : ''}`,
        suggestedContent: {
          title: table.sheet ?? table.source.replace(/\.[^.]+$/, ''),
          stats: summarizeTableMetrics(table),
        },
      })
    }

    if (table.rows.length >= 3 && table.headers.length >= 2) {
      recs.push({
        slideType: 'feature-grid',
        reason: 'Tabular data suitable for comparison grid',
        sourceRef: `${table.source}${table.sheet ? ` (${table.sheet})` : ''}`,
        suggestedContent: {
          title: table.sheet ?? table.source.replace(/\.[^.]+$/, ''),
        },
      })
    }
  }

  return recs
}

function summarizeTableMetrics(table: DataTable): Array<{ label: string; value: string }> {
  const metrics: Array<{ label: string; value: string }> = []

  // Use last row as current values if table has time series
  const lastRow = table.rows[table.rows.length - 1]
  if (!lastRow) return metrics

  for (let i = 0; i < table.headers.length && metrics.length < 4; i++) {
    if (table.columnTypes[i] === 'numeric' || table.columnTypes[i] === 'currency' || table.columnTypes[i] === 'percentage') {
      metrics.push({
        label: table.headers[i],
        value: lastRow[i] ?? '',
      })
    }
  }

  return metrics
}

// ── Context Builder ──────────────────────────────────────────

/**
 * Build a complete ingestion context from extracted content.
 * Returns structured data + a formatted prompt string for the agent.
 */
export function buildIngestContext(
  documents: ExtractedContent[],
  dataTables: DataTable[] = [],
  styleProfile?: DeckStyleProfile,
): IngestContext {
  const recommendations = generateRecommendations(documents, dataTables)
  const prompt = formatIngestPrompt(documents, dataTables, styleProfile, recommendations)

  return { documents, dataTables, styleProfile, recommendations, prompt }
}

function formatIngestPrompt(
  documents: ExtractedContent[],
  dataTables: DataTable[],
  style: DeckStyleProfile | undefined,
  recommendations: SlideRecommendation[],
): string {
  const parts: string[] = []

  parts.push('## Ingested Context\n')
  parts.push('The following content has been extracted from source documents and data files. Use this context to generate an appropriate presentation deck.\n')

  // Document summaries
  for (const doc of documents) {
    parts.push(`### Source: ${doc.source} (${doc.format.toUpperCase()})`)
    if (doc.title) parts.push(`**Title:** ${doc.title}`)

    for (const section of doc.sections) {
      if (section.heading) {
        parts.push(`\n**${section.heading}**`)
      }
      if (section.bullets.length > 0) {
        parts.push(section.bullets.map((b) => `- ${b}`).join('\n'))
      } else if (section.body) {
        // Truncate long sections
        const body = section.body.length > 300 ? section.body.slice(0, 297) + '...' : section.body
        parts.push(body)
      }
    }

    if (doc.metrics.length > 0) {
      parts.push('\n**Key Metrics:**')
      for (const m of doc.metrics) {
        const trend = m.trend ? ` (${m.trend})` : ''
        parts.push(`- ${m.label}: ${m.value}${trend}`)
      }
    }

    if (doc.quotes.length > 0) {
      parts.push('\n**Notable Quotes:**')
      for (const q of doc.quotes) {
        parts.push(`> "${q}"`)
      }
    }

    parts.push('')
  }

  // Data tables
  for (const table of dataTables) {
    const sheetInfo = table.sheet ? ` (${table.sheet})` : ''
    parts.push(`### Data: ${table.source}${sheetInfo}`)
    parts.push(`Columns: ${table.headers.join(', ')}`)
    parts.push(`Rows: ${table.rows.length}`)

    // Show first 5 rows as markdown table
    const maxRows = Math.min(table.rows.length, 5)
    if (maxRows > 0) {
      parts.push(`| ${table.headers.join(' | ')} |`)
      parts.push(`| ${table.headers.map(() => '---').join(' | ')} |`)
      for (let i = 0; i < maxRows; i++) {
        parts.push(`| ${table.rows[i].join(' | ')} |`)
      }
      if (table.rows.length > 5) {
        parts.push(`_...and ${table.rows.length - 5} more rows_`)
      }
    }
    parts.push('')
  }

  // Style guidance
  if (style) {
    parts.push('### Style Reference')
    parts.push(`Based on existing deck "${style.deckTitle}" (${style.slideCount} slides):`)
    parts.push(`- Opens with: \`${style.openingType}\`, closes with: \`${style.closingType}\``)
    parts.push(`- Uses dividers: ${style.usesDividers ? 'yes' : 'no'}`)
    parts.push(`- Avg bullets per slide: ${style.avgBulletsPerSlide}`)
    if (style.toneIndicators.length > 0) {
      parts.push(`- Tone: ${style.toneIndicators.join(', ')}`)
    }
    const topTypes = Object.entries(style.slideTypeDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => `\`${type}\` (${count})`)
    parts.push(`- Preferred slide types: ${topTypes.join(', ')}`)
    if (style.commonIcons.length > 0) {
      parts.push(`- Icons used: ${style.commonIcons.slice(0, 8).join(', ')}`)
    }
    parts.push('')
  }

  // Recommendations
  if (recommendations.length > 0) {
    parts.push('### Slide Recommendations')
    parts.push('Based on the ingested content, these slide types are recommended:\n')
    for (const rec of recommendations.slice(0, 15)) {
      parts.push(`- **\`${rec.slideType}\`** \u2014 ${rec.reason} (from ${rec.sourceRef})`)
    }
    parts.push('\nUse these as guidance, but adjust based on the overall narrative flow.')
  }

  return parts.join('\n')
}

// ── High-level pipeline functions ────────────���───────────────

/**
 * Ingest a document file and extract structured content.
 * Dispatches to the appropriate parser based on file type.
 */
export async function ingestDocument(source: IngestSource): Promise<ExtractedContent> {
  switch (source.type) {
    case 'pdf':
      return parsePDF(source.data as ArrayBuffer | Uint8Array, source.name)
    case 'docx':
      return parseDOCX(source.data as ArrayBuffer | Uint8Array, source.name)
    case 'pptx':
      return parsePPTX(source.data as ArrayBuffer | Uint8Array, source.name)
    case 'txt':
    case 'md':
      return parseText(decodeText(source.data), { name: source.name, format: source.type })
    default:
      throw new Error(`Unsupported document format: ${source.type}`)
  }
}

/**
 * Ingest a data file and extract structured table data.
 * Dispatches to the appropriate parser based on file type.
 */
export async function ingestDataFile(source: IngestSource): Promise<DataTable[]> {
  switch (source.type) {
    case 'csv':
    case 'tsv': {
      const text = decodeText(source.data)
      const delimiter = source.type === 'tsv' ? '\t' : ','
      return [parseCSV(text, { delimiter, name: source.name })]
    }
    case 'xlsx':
      return parseExcel(source.data as ArrayBuffer | Uint8Array, source.name)
    default:
      throw new Error(`Unsupported data format: ${source.type}`)
  }
}

/**
 * Detect file format from extension.
 * Returns undefined for unsupported formats.
 */
export function detectFormat(filename: string): DocumentFormat | DataFormat | undefined {
  const ext = filename.split('.').pop()?.toLowerCase()
  const formatMap: Record<string, DocumentFormat | DataFormat> = {
    pdf: 'pdf',
    docx: 'docx',
    pptx: 'pptx',
    txt: 'txt',
    md: 'md',
    csv: 'csv',
    tsv: 'tsv',
    xlsx: 'xlsx',
    xls: 'xlsx',
  }
  return formatMap[ext ?? '']
}

/**
 * Convenience: auto-detect format and ingest any supported file.
 * Returns an IngestContext with documents and/or data tables.
 */
export async function ingestFile(
  data: ArrayBuffer | Uint8Array | string,
  filename: string,
): Promise<{ document?: ExtractedContent; tables?: DataTable[] }> {
  const format = detectFormat(filename)
  if (!format) {
    throw new Error(`Unsupported file format: ${filename}. Supported: pdf, docx, pptx, txt, md, csv, tsv, xlsx`)
  }

  const source: IngestSource = { type: format, data, name: filename }

  if (['pdf', 'docx', 'pptx', 'txt', 'md'].includes(format)) {
    return { document: await ingestDocument(source) }
  } else {
    return { tables: await ingestDataFile(source) }
  }
}
