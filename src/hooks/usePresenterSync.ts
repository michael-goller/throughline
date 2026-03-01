/**
 * Hook for syncing presenter view with main presentation via BroadcastChannel
 */

import { useEffect, useCallback, useRef } from 'react'

type MessageType =
  | { type: 'goto'; slide: number }
  | { type: 'sync-request' }
  | { type: 'sync-response'; slide: number; total: number }

interface UsePresenterSyncOptions {
  onSlideChange?: (slide: number) => void
  onSyncResponse?: (slide: number, total: number) => void
}

const CHANNEL_NAME = 'shine-presenter-sync'

export function usePresenterSync(
  currentSlide: number,
  totalSlides: number,
  options: UsePresenterSyncOptions = {}
) {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const { onSlideChange, onSyncResponse } = options

  // Initialize channel
  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME)

    const handleMessage = (event: MessageEvent<MessageType>) => {
      const { data } = event

      switch (data.type) {
        case 'goto':
          onSlideChange?.(data.slide)
          break
        case 'sync-request':
          // Respond with current state
          channelRef.current?.postMessage({
            type: 'sync-response',
            slide: currentSlide,
            total: totalSlides,
          } as MessageType)
          break
        case 'sync-response':
          onSyncResponse?.(data.slide, data.total)
          break
      }
    }

    channelRef.current.addEventListener('message', handleMessage)

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage)
      channelRef.current?.close()
    }
  }, [currentSlide, totalSlides, onSlideChange, onSyncResponse])

  // Send navigation command to other tabs
  const goToSlide = useCallback((slide: number) => {
    channelRef.current?.postMessage({ type: 'goto', slide } as MessageType)
  }, [])

  // Request sync from other tabs
  const requestSync = useCallback(() => {
    channelRef.current?.postMessage({ type: 'sync-request' } as MessageType)
  }, [])

  return {
    goToSlide,
    requestSync,
  }
}
