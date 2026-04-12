import type { LucideIcon } from 'lucide-react'
import * as icons from 'lucide-react'

/**
 * Check whether a value is a valid React component (function or forwardRef object).
 * lucide-react v0.400+ exports forwardRef objects, not plain functions.
 */
function isComponent(value: unknown): value is LucideIcon {
  if (typeof value === 'function') return true
  if (typeof value === 'object' && value !== null && 'render' in value) return true
  return false
}

/**
 * Icon registry: maps string names to Lucide React components.
 * Built dynamically from the lucide-react package export.
 */
const iconRegistry = new Map<string, LucideIcon>()

// Populate registry from lucide-react exports.
// Each named export that looks like a component (PascalCase) is registered.
for (const [name, value] of Object.entries(icons)) {
  if (/^[A-Z]/.test(name) && isComponent(value)) {
    iconRegistry.set(name, value)
  }
}

/**
 * Resolve an icon that may be either a string name or an already-resolved LucideIcon.
 *
 * - If `icon` is already a component (function or forwardRef), returns it directly.
 * - If `icon` is a string, looks it up in the registry.
 * - Returns `undefined` if the string name is not found.
 */
export function resolveIcon(icon: string | LucideIcon): LucideIcon | undefined {
  if (isComponent(icon)) {
    return icon
  }
  if (typeof icon === 'string') {
    return iconRegistry.get(icon)
  }
  return undefined
}
