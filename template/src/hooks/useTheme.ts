import { useState, useEffect, useCallback, useRef } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'slide-deck-theme'
const CHANNEL_NAME = 'throughline-theme-sync'

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    // Check URL parameter first (for export/sharing)
    const params = new URLSearchParams(window.location.search)
    const urlTheme = params.get('theme')
    if (urlTheme === 'light' || urlTheme === 'dark') {
      return urlTheme
    }

    // Then check localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  }
  // Default to dark
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Set up BroadcastChannel for cross-tab sync
  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME)

    const handleMessage = (event: MessageEvent<{ theme: Theme }>) => {
      setThemeState(event.data.theme)
    }

    channelRef.current.addEventListener('message', handleMessage)

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage)
      channelRef.current?.close()
    }
  }, [])

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    // Broadcast to other tabs
    channelRef.current?.postMessage({ theme: newTheme })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      // Broadcast to other tabs
      channelRef.current?.postMessage({ theme: newTheme })
      return newTheme
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}

export default useTheme
