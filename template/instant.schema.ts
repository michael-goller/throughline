import { i } from '@instantdb/react'

const _schema = i.schema({
  entities: {
    reactions: i.entity({
      deckId: i.string().indexed(),
      slideId: i.string(),
      emoji: i.string(),
      x: i.number(),
      y: i.number(),
      timestamp: i.number(),
    }),
    comments: i.entity({
      deckId: i.string().indexed(),
      slideId: i.string(),
      type: i.string(),
      text: i.string(),
      x: i.number(),
      y: i.number(),
      authorName: i.string(),
      authorEmail: i.string(),
      timestamp: i.number(),
      resolved: i.boolean(),
      replies: i.json().optional(),
    }),
    presenterSessions: i.entity({
      deckId: i.string().indexed(),
      presenterId: i.string(),
      currentSlide: i.number(),
      totalSlides: i.number(),
      isLive: i.boolean().indexed(),
      startedAt: i.number(),
      updatedAt: i.number(),
      cursorActive: i.boolean().optional(),
      cursorX: i.number().optional(),
      cursorY: i.number().optional(),
      cursorTs: i.number().optional(),
      cursorClickTs: i.number().optional(),
    }),
  },
})

type _AppSchema = typeof _schema
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema

export type { AppSchema }
export default schema
