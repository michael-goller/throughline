/**
 * Hook for managing user identity (name/email) in localStorage
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'shine-deck-identity'

export interface Identity {
  name: string
  email: string
}

interface UseIdentityResult {
  identity: Identity | null
  setIdentity: (identity: Identity) => void
  clearIdentity: () => void
  isIdentified: boolean
}

export function useIdentity(): UseIdentityResult {
  const [identity, setIdentityState] = useState<Identity | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const setIdentity = useCallback((newIdentity: Identity) => {
    setIdentityState(newIdentity)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity))
    } catch {
      // localStorage might be unavailable
    }
  }, [])

  const clearIdentity = useCallback(() => {
    setIdentityState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage might be unavailable
    }
  }, [])

  return {
    identity,
    setIdentity,
    clearIdentity,
    isIdentified: identity !== null,
  }
}
