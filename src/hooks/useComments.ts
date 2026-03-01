/**
 * Hook for managing comments and questions via InstantDB
 */

import { useMemo } from 'react'
import { id, tx } from '@instantdb/react'
import { db, isInstantDBConfigured, type Comment, type Reply } from '../lib/instantdb'
import type { Identity } from './useIdentity'

interface UseCommentsResult {
  comments: Comment[]
  questions: Comment[]
  allItems: Comment[]
  addComment: (slideId: string, text: string, x: number, y: number, author: Identity) => void
  addQuestion: (slideId: string, text: string, x: number, y: number, author: Identity | null) => void
  addReply: (item: Comment, text: string, author: Identity) => void
  resolveItem: (itemId: string) => void
  deleteItem: (itemId: string) => void
  clearSlide: (slideId: string) => void
  clearAll: () => void
  isConfigured: boolean
  isLoading: boolean
  error: Error | null
}

export function useComments(deckId: string, slideId?: string): UseCommentsResult {
  // Query comments for this deck
  const query = db?.useQuery({
    comments: {
      $: {
        where: slideId
          ? { deckId, slideId }
          : { deckId }
      }
    }
  })

  const allItems = (query?.data?.comments ?? []) as Comment[]
  const isLoading = query?.isLoading ?? false
  const error = query?.error ?? null

  // Split into comments and questions
  const { comments, questions } = useMemo(() => {
    const comments: Comment[] = []
    const questions: Comment[] = []

    for (const item of allItems) {
      if (item.type === 'comment') {
        comments.push(item)
      } else {
        questions.push(item)
      }
    }

    return { comments, questions }
  }, [allItems])

  const addComment = (slideId: string, text: string, x: number, y: number, author: Identity) => {
    if (!db) {
      console.warn('InstantDB not configured')
      return
    }

    db.transact(
      tx.comments[id()].update({
        deckId,
        slideId,
        type: 'comment',
        text,
        x,
        y,
        authorName: author.name,
        authorEmail: author.email,
        timestamp: Date.now(),
        resolved: false,
      })
    )
  }

  const addQuestion = (slideId: string, text: string, x: number, y: number, author: Identity | null) => {
    if (!db) {
      console.warn('InstantDB not configured')
      return
    }

    db.transact(
      tx.comments[id()].update({
        deckId,
        slideId,
        type: 'question',
        text,
        x,
        y,
        authorName: author?.name ?? 'Anonymous',
        authorEmail: author?.email ?? '',
        timestamp: Date.now(),
        resolved: false,
      })
    )
  }

  const addReply = (item: Comment, text: string, author: Identity) => {
    if (!db) return
    const newReply: Reply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      authorName: author.name,
      authorEmail: author.email,
      timestamp: Date.now(),
    }
    const existingReplies = item.replies || []
    db.transact(tx.comments[item.id].update({
      replies: [...existingReplies, newReply],
    }))
  }

  const resolveItem = (itemId: string) => {
    if (!db) return
    db.transact(tx.comments[itemId].update({ resolved: true }))
  }

  const deleteItem = (itemId: string) => {
    if (!db) return
    db.transact(tx.comments[itemId].delete())
  }

  const clearSlide = (slideId: string) => {
    if (!db) return
    const slideItems = allItems.filter(item => item.slideId === slideId)
    const transactions = slideItems.map(item => tx.comments[item.id].delete())
    if (transactions.length > 0) {
      db.transact(transactions)
    }
  }

  const clearAll = () => {
    if (!db) return
    const transactions = allItems.map(item => tx.comments[item.id].delete())
    if (transactions.length > 0) {
      db.transact(transactions)
    }
  }

  return {
    comments,
    questions,
    allItems,
    addComment,
    addQuestion,
    addReply,
    resolveItem,
    deleteItem,
    clearSlide,
    clearAll,
    isConfigured: isInstantDBConfigured,
    isLoading,
    error,
  }
}
