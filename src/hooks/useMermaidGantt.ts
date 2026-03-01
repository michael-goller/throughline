import { useState, useEffect } from 'react'
import type { GanttTask } from '../types'
import { parseMermaidGantt } from '../utils/parseMermaidGantt'

interface UseMermaidGanttResult {
  tasks: GanttTask[]
  loading: boolean
  error: string | null
}

// Simple cache to avoid re-fetching
const cache = new Map<string, GanttTask[]>()

/**
 * Hook to fetch and parse Mermaid Gantt files from public/gantt/
 *
 * @param source - Path to the .md file (relative to public/gantt/)
 * @returns { tasks, loading, error }
 */
export function useMermaidGantt(source: string | undefined): UseMermaidGanttResult {
  // Initialize from cache if available
  const cachedTasks = source ? cache.get(source) : undefined

  const [tasks, setTasks] = useState<GanttTask[]>(cachedTasks || [])
  const [loading, setLoading] = useState(!cachedTasks && !!source)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!source) {
      setTasks([])
      setLoading(false)
      setError(null)
      return
    }

    // Already have cached data - just make sure state is synced
    if (cache.has(source)) {
      setTasks(cache.get(source)!)
      setLoading(false)
      setError(null)
      return
    }

    const fetchGantt = async () => {
      setLoading(true)
      setError(null)

      try {
        // Construct the URL - source should be relative to public/gantt/
        const url = source.startsWith('/') ? source : `/gantt/${source}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to load ${source}: ${response.status}`)
        }

        const content = await response.text()
        const parsedTasks = parseMermaidGantt(content)

        // Cache the result
        cache.set(source, parsedTasks)

        setTasks(parsedTasks)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Gantt file')
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    fetchGantt()
  }, [source])

  return { tasks, loading, error }
}

export default useMermaidGantt
