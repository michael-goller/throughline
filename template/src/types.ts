import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type { SlideConfig } from '@throughline/types'
export type * from '@throughline/types'

export type IconRef = LucideIcon | string

export interface SocialLink {
  platform: string
  url: string
  icon?: IconRef | ReactNode
}
