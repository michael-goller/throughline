import { track } from '@vercel/analytics'

type Role = 'presenter' | 'viewer'

export function trackDeckOpened(slug: string, role: Role): void {
  if (!slug) return
  track('deck_opened', { slug, role })
}

export function trackSlideViewed(slug: string, slideId: string, slideIndex: number): void {
  if (!slug || !slideId) return
  track('slide_viewed', { slug, slideId, slideIndex })
}

export function trackCommentPosted(slug: string): void {
  if (!slug) return
  track('comment_posted', { slug })
}

export function trackQuestionPosted(slug: string): void {
  if (!slug) return
  track('question_posted', { slug })
}
