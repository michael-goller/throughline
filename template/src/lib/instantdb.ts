/**
 * InstantDB configuration for Shine Decks
 *
 * Set VITE_INSTANTDB_APP_ID in your environment or .env file
 * Get your app ID from https://instantdb.com/dash
 */

import { init } from '@instantdb/react'

// Schema for reactions and comments
export interface Reaction {
  id: string
  deckId: string
  slideId: string
  emoji: string
  x: number  // 0-1 relative position
  y: number  // 0-1 relative position
  timestamp: number
}

export interface Reply {
  id: string
  text: string
  authorName: string
  authorEmail: string
  timestamp: number
}

export interface Comment {
  id: string
  deckId: string
  slideId: string
  type: 'comment' | 'question'
  text: string
  x: number
  y: number
  authorName: string
  authorEmail: string
  timestamp: number
  resolved: boolean
  replies?: Reply[]
}

// Initialize InstantDB
const APP_ID = import.meta.env.VITE_INSTANTDB_APP_ID as string | undefined

// Only initialize if we have an app ID
export const db = APP_ID
  ? init({ appId: APP_ID })
  : null

export const isInstantDBConfigured = !!APP_ID

// Available reaction emojis
export const REACTION_EMOJIS = [
  { emoji: '👍', label: 'Thumbs up' },
  { emoji: '👎', label: 'Thumbs down' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '❓', label: 'Question' },
] as const

export type ReactionEmoji = typeof REACTION_EMOJIS[number]['emoji']
