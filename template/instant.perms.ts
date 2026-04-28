import type { InstantRules } from '@instantdb/react'
import type { AppSchema } from './instant.schema'

/**
 * InstantDB authorization rules for Throughline.
 *
 * Push to the dashboard with:
 *   npx instant-cli@latest push perms
 *
 * Threat model: the public viewer URL is password-gated by the cloud, but the
 * InstantDB app id is shipped in the bundle and the client is unauthenticated.
 * These rules harden what an attacker who has the app id can do without
 * breaking the existing anonymous reaction/comment UX.
 *
 * What anonymous clients can do:
 *   - read reactions/comments/presenterSessions for any deck (deck ids are
 *     already public on the viewer URL)
 *   - create reactions/comments with required fields populated
 *   - flip resolved=true and append replies on existing comments
 *   - update isLive/currentSlide/totalSlides/updatedAt on a presenter session
 *
 * What is rejected at the rules layer:
 *   - any delete (mass-delete via `clearAll` was the primary abuse path)
 *   - mutating immutable fields on a comment (text, author, position, etc.)
 *   - re-pointing a presenter session to a different deck or presenter
 *
 * Follow-up DIG-130 wires real authentication via the InstantDB admin SDK so
 * we can require `auth.id == data.authorId` instead of relying on field-shape.
 */
const rules: InstantRules<AppSchema> = {
  reactions: {
    allow: {
      view: 'true',
      create: "newData.deckId != '' && newData.slideId != '' && newData.emoji != ''",
      update: 'false',
      delete: 'false',
    },
  },
  comments: {
    allow: {
      view: 'true',
      create:
        "newData.deckId != '' && newData.slideId != '' && newData.text != '' && newData.resolved == false",
      // resolved + replies are the only fields anonymous clients may change.
      update:
        'newData.deckId == data.deckId && ' +
        'newData.slideId == data.slideId && ' +
        'newData.type == data.type && ' +
        'newData.text == data.text && ' +
        'newData.authorEmail == data.authorEmail && ' +
        'newData.authorName == data.authorName && ' +
        'newData.x == data.x && ' +
        'newData.y == data.y && ' +
        'newData.timestamp == data.timestamp',
      delete: 'false',
    },
  },
  presenterSessions: {
    allow: {
      view: 'true',
      create:
        "newData.deckId != '' && newData.presenterId != '' && newData.totalSlides > 0",
      // deckId / presenterId / startedAt are pinned at create time; only the
      // live cursor (currentSlide, totalSlides, isLive, updatedAt) may change.
      update:
        'newData.deckId == data.deckId && ' +
        'newData.presenterId == data.presenterId && ' +
        'newData.startedAt == data.startedAt',
      delete: 'false',
    },
  },
}

export default rules
