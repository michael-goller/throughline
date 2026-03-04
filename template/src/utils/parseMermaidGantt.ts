import type { GanttTask } from '../types'

/**
 * Parse Mermaid Gantt chart syntax into GanttTask array
 *
 * Supported syntax:
 * ```
 * gantt
 *     title Project Roadmap
 *     dateFormat YYYY-MM-DD
 *
 *     section Discovery
 *     Research     :done, 2026-01-01, 30d
 *     Interviews   :done, 2026-01-15, 14d
 *
 *     section Development
 *     MVP          :active, 2026-02-01, 60d
 *     Testing      :2026-03-15, 30d
 *
 *     section Launch
 *     Release      :milestone, 2026-04-15, 1d
 * ```
 */

type TaskStatus = 'done' | 'active' | 'crit' | 'milestone'

function parseDate(dateStr: string): Date {
  // Handle ISO date format (YYYY-MM-DD)
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  }
  return new Date(dateStr)
}

function addDuration(startDate: Date, durationStr: string): Date {
  const match = durationStr.match(/^(\d+)(d|w|m)$/)
  if (!match) {
    // Try parsing as end date
    return parseDate(durationStr)
  }

  const amount = parseInt(match[1])
  const unit = match[2]
  const result = new Date(startDate)

  switch (unit) {
    case 'd':
      result.setDate(result.getDate() + amount)
      break
    case 'w':
      result.setDate(result.getDate() + amount * 7)
      break
    case 'm':
      result.setMonth(result.getMonth() + amount)
      break
  }

  return result
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidStatus(status: string): status is TaskStatus {
  return ['done', 'active', 'crit', 'milestone'].includes(status)
}

export function parseMermaidGantt(content: string): GanttTask[] {
  const lines = content.split('\n')
  const tasks: GanttTask[] = []
  let currentSection: string | undefined

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('%%')) continue

    // Skip header lines
    if (line === 'gantt') continue
    if (line.startsWith('title ')) continue
    if (line.startsWith('dateFormat ')) continue
    if (line.startsWith('excludes ')) continue
    if (line.startsWith('todayMarker ')) continue

    // Handle section
    if (line.startsWith('section ')) {
      currentSection = line.substring(8).trim()
      continue
    }

    // Parse task line
    // Format: taskName :status?, startDate, durationOrEndDate
    // Examples:
    //   Research :done, 2026-01-01, 30d
    //   MVP :active, 2026-02-01, 60d
    //   Testing :2026-03-15, 30d
    //   Review :2026-04-01, 2026-04-15
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const taskName = line.substring(0, colonIndex).trim()
    if (!taskName) continue

    const afterColon = line.substring(colonIndex + 1).trim()
    const parts = afterColon.split(',').map(p => p.trim())

    if (parts.length < 2) continue

    let status: TaskStatus | undefined
    let startDateStr: string
    let endOrDuration: string

    // Check if first part is a status
    const firstPart = parts[0].toLowerCase()
    if (isValidStatus(firstPart)) {
      status = firstPart
      // Skip ID if present (second part that doesn't look like a date)
      const secondPart = parts[1]
      if (secondPart && !secondPart.match(/^\d{4}-\d{2}-\d{2}$/) && !secondPart.match(/^after /)) {
        // It's an ID, skip it
        startDateStr = parts[2]
        endOrDuration = parts[3]
      } else {
        startDateStr = parts[1]
        endOrDuration = parts[2]
      }
    } else if (firstPart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // First part is a date
      startDateStr = firstPart
      endOrDuration = parts[1]
    } else {
      // First part might be an ID, skip it
      startDateStr = parts[1]
      endOrDuration = parts[2]
    }

    if (!startDateStr || !endOrDuration) continue

    const startDate = parseDate(startDateStr)
    const endDate = addDuration(startDate, endOrDuration)

    tasks.push({
      name: taskName,
      start: formatDate(startDate),
      end: formatDate(endDate),
      section: currentSection,
      status,
    })
  }

  return tasks
}

export default parseMermaidGantt
