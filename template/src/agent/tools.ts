/**
 * Agent tool definitions for Throughline deck manipulation.
 *
 * These tool definitions follow the standard AI tool-calling convention:
 * each tool has a name, description, and a JSON Schema for its parameters.
 *
 * Usage: Pass these definitions to an AI model (Claude, GPT, etc.) as
 * available tools. The model returns structured JSON that can be applied
 * to a deck config.
 */

import type { SlideConfig } from '../types'
import { deckConfigSchema, slideConfigSchema, slideTypes } from './schema'

// ── Types ─────────────────────────────────────────────────────

export interface DeckConfig {
  title: string
  description?: string
  author?: string
  createdAt?: string
  /** The "one claim" that anchors the deck (see `throughline shape`). */
  throughline?: string
  slides: SlideConfig[]
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ToolResult {
  success: boolean
  deck: DeckConfig
  message: string
}

// ── Tool: create_deck ─────────────────────────────────────────

const createDeckTool: ToolDefinition = {
  name: 'create_deck',
  description:
    'Create a new Throughline presentation deck from scratch. Returns a complete deck config with all slides. ' +
    'Use this when the user wants a new presentation. The slides array must contain at least one slide. ' +
    'Each slide needs a unique "id" and a "type" that determines its layout.',
  parameters: deckConfigSchema,
}

// ── Tool: add_slide ───────────────────────────────────────────

const addSlideTool: ToolDefinition = {
  name: 'add_slide',
  description:
    'Add a new slide to an existing deck. Specify the slide config and optionally where to insert it. ' +
    'If "afterSlideId" is omitted, the slide is appended at the end.',
  parameters: {
    type: 'object',
    properties: {
      slide: slideConfigSchema,
      afterSlideId: {
        type: 'string',
        description: 'Insert the new slide after the slide with this id. Omit to append at end.',
      },
    },
    required: ['slide'],
    additionalProperties: false,
  },
}

// ── Tool: modify_slide ────────────────────────────────────────

const modifySlideTool: ToolDefinition = {
  name: 'modify_slide',
  description:
    'Modify an existing slide in the deck. Provide the slide id and a partial update object. ' +
    'Only the fields you include will be changed; all other fields are preserved. ' +
    'You cannot change the slide type — to change type, remove and re-add the slide.',
  parameters: {
    type: 'object',
    properties: {
      slideId: {
        type: 'string',
        description: 'The id of the slide to modify',
      },
      updates: {
        type: 'object',
        description:
          'Partial slide config with only the fields to update. ' +
          'Do NOT include "id" or "type" — these cannot be changed.',
        additionalProperties: true,
      },
    },
    required: ['slideId', 'updates'],
    additionalProperties: false,
  },
}

// ── Tool: remove_slide ────────────────────────────────────────

const removeSlideTool: ToolDefinition = {
  name: 'remove_slide',
  description: 'Remove a slide from the deck by its id.',
  parameters: {
    type: 'object',
    properties: {
      slideId: {
        type: 'string',
        description: 'The id of the slide to remove',
      },
    },
    required: ['slideId'],
    additionalProperties: false,
  },
}

// ── Tool: reorder_slides ──────────────────────────────────────

const reorderSlidesTool: ToolDefinition = {
  name: 'reorder_slides',
  description:
    'Reorder slides in the deck. Provide the complete ordered array of slide ids. ' +
    'All existing slide ids must be included exactly once.',
  parameters: {
    type: 'object',
    properties: {
      slideIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ordered array of all slide ids defining the new order',
      },
    },
    required: ['slideIds'],
    additionalProperties: false,
  },
}

// ── All tools ─────────────────────────────────────────────────

export const tools: ToolDefinition[] = [
  createDeckTool,
  addSlideTool,
  modifySlideTool,
  removeSlideTool,
  reorderSlidesTool,
]

// ── Tool execution helpers ────────────────────────────────────

export function applyCreateDeck(params: DeckConfig): ToolResult {
  return {
    success: true,
    deck: {
      title: params.title,
      description: params.description,
      author: params.author,
      createdAt: params.createdAt ?? new Date().toISOString(),
      slides: params.slides,
    },
    message: `Created deck "${params.title}" with ${params.slides.length} slides`,
  }
}

export function applyAddSlide(
  deck: DeckConfig,
  params: { slide: SlideConfig; afterSlideId?: string }
): ToolResult {
  const newSlides = [...deck.slides]

  if (params.afterSlideId) {
    const idx = newSlides.findIndex((s) => s.id === params.afterSlideId)
    if (idx === -1) {
      return { success: false, deck, message: `Slide "${params.afterSlideId}" not found` }
    }
    newSlides.splice(idx + 1, 0, params.slide)
  } else {
    newSlides.push(params.slide)
  }

  const updated = { ...deck, slides: newSlides }
  return { success: true, deck: updated, message: `Added slide "${params.slide.id}"` }
}

export function applyModifySlide(
  deck: DeckConfig,
  params: { slideId: string; updates: Partial<SlideConfig> }
): ToolResult {
  const idx = deck.slides.findIndex((s) => s.id === params.slideId)
  if (idx === -1) {
    return { success: false, deck, message: `Slide "${params.slideId}" not found` }
  }

  const newSlides = [...deck.slides]
  newSlides[idx] = { ...newSlides[idx], ...params.updates, id: deck.slides[idx].id, type: deck.slides[idx].type } as SlideConfig
  return { success: true, deck: { ...deck, slides: newSlides }, message: `Modified slide "${params.slideId}"` }
}

export function applyRemoveSlide(
  deck: DeckConfig,
  params: { slideId: string }
): ToolResult {
  const idx = deck.slides.findIndex((s) => s.id === params.slideId)
  if (idx === -1) {
    return { success: false, deck, message: `Slide "${params.slideId}" not found` }
  }

  const newSlides = deck.slides.filter((s) => s.id !== params.slideId)
  return { success: true, deck: { ...deck, slides: newSlides }, message: `Removed slide "${params.slideId}"` }
}

export function applyReorderSlides(
  deck: DeckConfig,
  params: { slideIds: string[] }
): ToolResult {
  const slideMap = new Map(deck.slides.map((s) => [s.id, s]))

  // Validate all ids exist
  for (const id of params.slideIds) {
    if (!slideMap.has(id)) {
      return { success: false, deck, message: `Slide "${id}" not found` }
    }
  }

  // Validate all slides accounted for
  if (params.slideIds.length !== deck.slides.length) {
    return {
      success: false,
      deck,
      message: `Expected ${deck.slides.length} slide ids, got ${params.slideIds.length}`,
    }
  }

  const newSlides = params.slideIds.map((id) => slideMap.get(id)!)
  return { success: true, deck: { ...deck, slides: newSlides }, message: 'Slides reordered' }
}

/** Dispatch a tool call to the appropriate handler */
export function applyTool(
  toolName: string,
  params: Record<string, unknown>,
  deck?: DeckConfig
): ToolResult {
  switch (toolName) {
    case 'create_deck':
      return applyCreateDeck(params as unknown as DeckConfig)
    case 'add_slide':
      if (!deck) return { success: false, deck: { title: '', slides: [] }, message: 'No deck provided' }
      return applyAddSlide(deck, params as { slide: SlideConfig; afterSlideId?: string })
    case 'modify_slide':
      if (!deck) return { success: false, deck: { title: '', slides: [] }, message: 'No deck provided' }
      return applyModifySlide(deck, params as { slideId: string; updates: Partial<SlideConfig> })
    case 'remove_slide':
      if (!deck) return { success: false, deck: { title: '', slides: [] }, message: 'No deck provided' }
      return applyRemoveSlide(deck, params as { slideId: string })
    case 'reorder_slides':
      if (!deck) return { success: false, deck: { title: '', slides: [] }, message: 'No deck provided' }
      return applyReorderSlides(deck, params as { slideIds: string[] })
    default:
      return { success: false, deck: deck ?? { title: '', slides: [] }, message: `Unknown tool: ${toolName}` }
  }
}

/** List of available slide types for agent reference */
export { slideTypes }
