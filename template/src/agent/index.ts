/**
 * Shine Agent Interface
 *
 * Provides everything needed for AI agents to create and modify
 * Shine presentation decks via structured tool calls.
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
export { systemPrompt, templates, fillTemplate } from './prompts'
export type { PromptTemplate } from './prompts'
