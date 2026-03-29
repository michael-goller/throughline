import type { LucideIcon } from 'lucide-react'
import * as icons from 'lucide-react'

/**
 * Icon registry: maps string names to Lucide React components.
 * Built dynamically from the lucide-react package export.
 */
const iconRegistry = new Map<string, LucideIcon>()

// Populate registry from lucide-react exports.
// Each named export that looks like a component (PascalCase function) is registered.
for (const [name, value] of Object.entries(icons)) {
  if (typeof value === 'function' && /^[A-Z]/.test(name)) {
    iconRegistry.set(name, value as LucideIcon)
  }
}

/**
 * Resolve an icon that may be either a string name or an already-resolved LucideIcon.
 *
 * - If `icon` is a function (LucideIcon component), returns it directly (backward compat).
 * - If `icon` is a string, looks it up in the registry.
 * - Returns `undefined` if the string name is not found.
 */
export function resolveIcon(icon: string | LucideIcon): LucideIcon | undefined {
  if (typeof icon === 'function') {
    return icon as LucideIcon
  }
  return iconRegistry.get(icon)
}
