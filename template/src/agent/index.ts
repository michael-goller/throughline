/**
 * Throughline Agent Interface
 *
 * Provides everything needed for AI agents to create and modify
 * Throughline presentation decks via structured tool calls.
 *
 * @example
 * ```ts
 * import { tools, systemPrompt, applyTool, templates } from './agent'
 *
 * // Pass tools and systemPrompt to your AI model
 * // Apply returned tool calls with applyTool()
 * ```
 */

// Schema definitions (JSON Schema for structured output)
export { deckConfigSchema, slideConfigSchema, slideTypeSchemas, slideTypes } from './schema'

// Tool definitions and execution
export {
  tools,
  applyTool,
  applyCreateDeck,
  applyAddSlide,
  applyModifySlide,
  applyRemoveSlide,
  applyReorderSlides,
} from './tools'
export type { DeckConfig, ToolDefinition, ToolResult } from './tools'

// Prompt templates
export { systemPrompt, refinementPrompt, templates, fillTemplate, buildRefinementContext } from './prompts'
export type { PromptTemplate } from './prompts'

// Context ingestion pipeline
export {
  // Parsers
  parseCSV,
  parsePDF,
  parseDOCX,
  parsePPTX,
  parseExcel,
  parseText,
  // Pipeline
  ingestDocument,
  ingestDataFile,
  ingestFile,
  detectFormat,
  // Analysis
  analyzeDeckStyle,
  buildIngestContext,
} from './ingest'
export type {
  DocumentFormat,
  DataFormat,
  IngestSource,
  ExtractedSection,
  ExtractedContent,
  ExtractedMetric,
  DataTable,
  ColumnType,
  DeckStyleProfile,
  SlideRecommendation,
  IngestContext,
} from './ingest'

// Template library
export {
  getAllTemplates,
  getTemplate,
  getTemplatesByCategory,
  getCategories,
  matchTemplateToIntent,
  forkTemplate,
  templateRegistry,
} from './templates'
export type { DeckTemplate, TemplateCategory, TemplateMatch } from './templates'

// Iterative refinement protocol
export {
  computeDiff,
  previewChange,
  createEditSession,
  applyAndRecord,
  undoLastChange,
  summarizeDeck,
  getSlideConfig,
  formatHistory,
} from './refine'
export type {
  ChangeKind,
  SlideChange,
  FieldDiff,
  DeckDiff,
  EditHistoryEntry,
  EditSession,
  ChangePreview,
  SlideSummary,
  DeckSummary,
} from './refine'
