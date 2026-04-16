import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type { SlideConfig } from '@shine/types'
export type * from '@shine/types'

export type IconRef = LucideIcon | string

export interface SocialLink {
  platform: string
  url: string
  icon?: IconRef | ReactNode
}
