/**
 * Hook for managing slide reactions via InstantDB
 */

import { useMemo } from 'react'
import { id, tx } from '@instantdb/react'
import { db, isInstantDBConfigured, type Reaction, type ReactionEmoji } from '../lib/instantdb'

interface AggregatedReaction {
  emoji: ReactionEmoji
  count: number
  x: number  // average position
  y: number
}

interface UseReactionsResult {
  reactions: Reaction[]
  aggregatedReactions: AggregatedReaction[]
  addReaction: (slideId: string, emoji: ReactionEmoji, x: number, y: number) => void
  isConfigured: boolean
  isLoading: boolean
  error: Error | null
}

export function useReactions(deckId: string, slideId?: string): UseReactionsResult {
  // Query reactions for this deck (and optionally filter by slide)
  const query = db?.useQuery({
    reactions: {
      $: {
        where: slideId
          ? { deckId, slideId }
          : { deckId }
      }
    }
  })

  const reactions = (query?.data?.reactions ?? []) as Reaction[]
  const isLoading = query?.isLoading ?? false
  const error = query?.error ?? null

  // Aggregate reactions by emoji and approximate position (cluster nearby reactions)
  const aggregatedReactions = useMemo(() => {
    if (!slideId) return []

    const slideReactions = reactions.filter(r => r.slideId === slideId)

    // Group by emoji
    const byEmoji = new Map<ReactionEmoji, Reaction[]>()
    for (const r of slideReactions) {
      const list = byEmoji.get(r.emoji as ReactionEmoji) || []
      list.push(r)
      byEmoji.set(r.emoji as ReactionEmoji, list)
    }

    // Cluster reactions that are close together (within 10% of slide dimensions)
    const CLUSTER_THRESHOLD = 0.1
    const aggregated: AggregatedReaction[] = []

    for (const [emoji, emojiReactions] of byEmoji) {
      // Simple clustering: group by proximity
      const clusters: Reaction[][] = []

      for (const r of emojiReactions) {
        let foundCluster = false
        for (const cluster of clusters) {
          const centerX = cluster.reduce((sum, c) => sum + c.x, 0) / cluster.length
          const centerY = cluster.reduce((sum, c) => sum + c.y, 0) / cluster.length
          const dist = Math.sqrt((r.x - centerX) ** 2 + (r.y - centerY) ** 2)

          if (dist < CLUSTER_THRESHOLD) {
            cluster.push(r)
            foundCluster = true
            break
          }
        }

        if (!foundCluster) {
          clusters.push([r])
        }
      }

      // Convert clusters to aggregated reactions
      for (const cluster of clusters) {
        aggregated.push({
          emoji,
          count: cluster.length,
          x: cluster.reduce((sum, c) => sum + c.x, 0) / cluster.length,
          y: cluster.reduce((sum, c) => sum + c.y, 0) / cluster.length,
        })
      }
    }

    return aggregated
  }, [reactions, slideId])

  const addReaction = (slideId: string, emoji: ReactionEmoji, x: number, y: number) => {
    if (!db) {
      console.warn('InstantDB not configured. Set VITE_INSTANTDB_APP_ID in your .env file.')
      return
    }

    db.transact(
      tx.reactions[id()].update({
        deckId,
        slideId,
        emoji,
        x,
        y,
        timestamp: Date.now(),
      })
    )
  }

  return {
    reactions,
    aggregatedReactions,
    addReaction,
    isConfigured: isInstantDBConfigured,
    isLoading,
    error,
  }
}
