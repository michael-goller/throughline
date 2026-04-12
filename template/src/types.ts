import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Icon reference: either a Lucide component or a string name resolved at runtime */
export type IconRef = LucideIcon | string

// Base slide type
interface BaseSlide {
  id: string
  /** Speaker notes shown in PresenterView. Supports markdown formatting. */
  notes?: string | string[]
}

// Title slide - red gradient background with title/subtitle
export interface TitleSlideConfig extends BaseSlide {
  type: 'title'
  title: string
  subtitle?: string
  tagline?: string
}

// Title slide digital variant - with neural network and terminal prompt
export interface TitleSlideDigitalConfig extends BaseSlide {
  type: 'title-digital'
  title: string
  subtitle?: string
  tagline?: string
}

// Steps slide - dark background with numbered step cards
export interface StepItem {
  icon: IconRef
  title: string
  duration?: string
  description: string
}

export interface StepsSlideConfig extends BaseSlide {
  type: 'steps'
  title: string
  steps: StepItem[]
}

// Two column slide - 50/50 split layout
export interface ColumnCard {
  number?: string | number
  icon?: IconRef
  title: string
  body: string
  bullets?: string[]
}

export interface TwoColumnSlideConfig extends BaseSlide {
  type: 'two-column'
  title: string
  subtitle?: string
  left: ColumnCard
  right: ColumnCard
}

// Content slide - single column with title and body
export interface ContentSlideConfig extends BaseSlide {
  type: 'content'
  title: string
  subtitle?: string
  body?: string
  bullets?: string[]
}

// Quote slide
export interface QuoteSlideConfig extends BaseSlide {
  type: 'quote'
  quote: string
  author: string
  authorTitle?: string
  variant?: 'split' | 'full'
}

// Section divider
export interface DividerSlideConfig extends BaseSlide {
  type: 'divider'
  title: string
  subtitle?: string
  sectionNumber?: number
}

// Three column slide
export interface ThreeColumnItem {
  icon: IconRef
  title: string
  description: string
}

export interface ThreeColumnSlideConfig extends BaseSlide {
  type: 'three-column'
  title?: string
  columns: [ThreeColumnItem, ThreeColumnItem, ThreeColumnItem]
}

// Stats slide
export interface StatItem {
  value: number
  label: string
  suffix?: string
  prefix?: string
}

export interface StatsSlideConfig extends BaseSlide {
  type: 'stats'
  title?: string
  stats: StatItem[]
  layout?: '2x2' | '1x4'
}

// Image content slide
export interface ImageContentSlideConfig extends BaseSlide {
  type: 'image-content'
  title: string
  body?: string
  bullets?: string[]
  imageUrl?: string
  imageSrc?: string
  imagePlaceholder?: boolean
  imagePosition?: 'left' | 'right'
}

// Timeline slide
export interface TimelineNode {
  date: string
  title: string
  description?: string
}

export interface TimelineSlideConfig extends BaseSlide {
  type: 'timeline'
  title?: string
  nodes: TimelineNode[]
}

// Comparison slide
export interface ComparisonSlideConfig extends BaseSlide {
  type: 'comparison'
  title?: string
  leftLabel?: string
  rightLabel?: string
  leftItems: string[]
  rightItems: string[]
}

// Q&A slide
export interface QASlideConfig extends BaseSlide {
  type: 'qa'
  text?: string
  subtitle?: string
}

// Closing slide
export interface SocialLink {
  platform: string
  url: string
  icon?: IconRef | ReactNode
}

export interface ClosingSlideConfig extends BaseSlide {
  type: 'closing'
  tagline?: string
  contactEmail?: string
  socialLinks?: SocialLink[]
  logoSrc?: string
}

// Gantt chart slide
export interface GanttTask {
  name: string
  start: string        // ISO date or 'YYYY-MM-DD' format
  end: string          // ISO date or 'YYYY-MM-DD' format
  progress?: number    // 0-100, optional
  section?: string     // grouping label
  status?: 'done' | 'active' | 'crit' | 'milestone'
}

export interface GanttSlideConfig extends BaseSlide {
  type: 'gantt'
  title?: string
  tasks?: GanttTask[]           // Option A: inline data
  source?: string               // Option B: path to .md file (in public/gantt/)
  dateFormat?: 'month' | 'quarter' | 'week' | 'relative-month'
}

// Matrix/Quadrant slide (2x2 grid for prioritization, risk, SWOT)
export interface MatrixItem {
  label: string
  description?: string
}

export interface MatrixSlideConfig extends BaseSlide {
  type: 'matrix'
  title?: string
  xAxis: string  // Label shown at bottom with arrow pointing right
  yAxis: string  // Label shown on left with arrow pointing up
  quadrants: {
    topLeft: MatrixItem[]
    topRight: MatrixItem[]
    bottomLeft: MatrixItem[]
    bottomRight: MatrixItem[]
  }
}

// Org Chart slide
export interface OrgNode {
  name: string
  role: string
  children?: OrgNode[]
}

export interface OrgChartSlideConfig extends BaseSlide {
  type: 'org-chart'
  title?: string
  root: OrgNode
}

// Feature Grid slide (comparison table with checkmarks)
export interface FeatureGridColumn {
  header: string
  highlight?: boolean
}

export interface FeatureGridRow {
  feature: string
  values: (boolean | string)[]  // true = checkmark, false = x, string = custom text
}

export interface FeatureGridSlideConfig extends BaseSlide {
  type: 'feature-grid'
  title?: string
  subtitle?: string
  columns: FeatureGridColumn[]
  rows: FeatureGridRow[]
  columnWidths?: string  // Custom CSS grid-template-columns override
}

// Fishbone/Tree diagram slide
export interface FishboneBranch {
  category: string
  causes: string[]
}

export interface FishboneSlideConfig extends BaseSlide {
  type: 'fishbone'
  title?: string
  problem: string  // The head of the fish
  branches: FishboneBranch[]
}

// Force Field Analysis slide
export interface ForceItem {
  label: string
  strength: 1 | 2 | 3  // Arrow length
}

export interface ForceFieldSlideConfig extends BaseSlide {
  type: 'force-field'
  title?: string
  subject: string  // What's being changed
  driving: ForceItem[]
  restraining: ForceItem[]
}

// Pricing Table slide
export interface PricingTier {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  cta?: string
  highlight?: boolean
}

export interface PricingSlideConfig extends BaseSlide {
  type: 'pricing'
  title?: string
  tiers: PricingTier[]
}

// Icon Grid slide (capabilities, values, features)
export interface IconGridItem {
  icon: IconRef
  title: string
  description?: string
  owner?: string
  deadline?: string
}

export interface IconGridSlideConfig extends BaseSlide {
  type: 'icon-grid'
  title?: string
  subtitle?: string
  items: IconGridItem[]
  columns?: 1 | 2 | 3 | 4
  callout?: string
}

// Name reveal slide - dissolve old name, reassemble as new name
export interface NameRevealSlideConfig extends BaseSlide {
  type: 'name-reveal'
  fromText: string
  toText: string
  subtitle?: string
  tagline?: string
}

// Full-screen static image slide
export interface ImageSlideConfig extends BaseSlide {
  type: 'image'
  src: string
  alt?: string
}

// Team-Objectives slide — one team/function on the left, objectives on the right
export interface TeamKR {
  title: string
  description: string
}

export interface TeamObjectiveGroup {
  icon: IconRef
  objective: string
  primary?: boolean
  keyResults: TeamKR[]
}

export interface TeamObjectivesSlideConfig extends BaseSlide {
  type: 'team-objectives'
  teamName: string
  teamIcon: IconRef
  subtitle?: string
  objectives: TeamObjectiveGroup[]
}

// Operating Loop slide — circular cadence view
export interface OperatingLoopSlideConfig extends BaseSlide {
  type: 'operating-loop'
  title?: string
  nodes: TimelineNode[]
}

// OKR Scorecard slide — dense one-page view of all objectives + KRs + status
export interface OKRScoreItem {
  title: string
  description?: string
  owner: string
  progress: 'not-started' | 'on-track' | 'at-risk' | 'behind' | 'done'
}

export interface OKRScoreObjective {
  icon: IconRef
  objective: string
  tagline?: string
  keyResults: OKRScoreItem[]
}

export interface OKRScoreSlideConfig extends BaseSlide {
  type: 'okr-score'
  title?: string
  subtitle?: string
  objectives: OKRScoreObjective[]
}

// Sparkline Grid slide (resource intensity heatmap with bars)
export interface SparklineGridRow {
  label: string
  values: number[]  // 0 = none, 1 = low, 2 = medium, 3 = high
}

export interface SparklineGridSlideConfig extends BaseSlide {
  type: 'sparkline-grid'
  title?: string
  subtitle?: string
  phases: string[]
  rows: SparklineGridRow[]
}

// Barometer Grid slide (themes with session-count barometer)
export interface BarometerGridItem {
  title: string
  description: string
  score: number     // e.g. 10
  maxScore: number  // e.g. 12
}

export interface BarometerGridSlideConfig extends BaseSlide {
  type: 'barometer-grid'
  title?: string
  subtitle?: string
  items: BarometerGridItem[]
  columns?: 2 | 3
}

// ── Scorecard slide ──

export interface ScorecardMetric {
  label: string
  actual: string
  target?: string
  trend?: 'up' | 'flat' | 'down'
}

export interface ScorecardRAGItem {
  label: string
  status: 'green' | 'amber' | 'red' | 'not-started'
}

export interface ScorecardSlideConfig extends BaseSlide {
  type: 'scorecard'
  title?: string
  headline: string
  ragItems: ScorecardRAGItem[]
  metrics: ScorecardMetric[]
  confidence?: { score: number; max?: number }
  decisionsNeeded?: boolean
  decisionsNote?: string
}

// ── Status table slide ──

export interface StatusTableColumn {
  header: string
  width?: string
}

export interface StatusTableRow {
  cells: string[]
  status?: 'green' | 'amber' | 'red' | 'not-started' | 'done'
}

export interface StatusTableSlideConfig extends BaseSlide {
  type: 'status-table'
  title?: string
  subtitle?: string
  columns: StatusTableColumn[]
  rows: StatusTableRow[]
  showStatusDot?: boolean
  summary?: string
}

// ── Risk card slide ──

export interface RiskItem {
  title: string
  status: 'amber' | 'red'
  currentState: string
  rootCause: string
  businessImpact: string
  action: string
  pathToGreen?: string
}

export interface RiskCardSlideConfig extends BaseSlide {
  type: 'risk-card'
  title?: string
  risks: RiskItem[]
}

// Union type for all slides
export type SlideConfig =
  | TitleSlideConfig
  | TitleSlideDigitalConfig
  | StepsSlideConfig
  | TwoColumnSlideConfig
  | ContentSlideConfig
  | QuoteSlideConfig
  | DividerSlideConfig
  | ThreeColumnSlideConfig
  | StatsSlideConfig
  | ImageContentSlideConfig
  | TimelineSlideConfig
  | ComparisonSlideConfig
  | QASlideConfig
  | ClosingSlideConfig
  | GanttSlideConfig
  | MatrixSlideConfig
  | OrgChartSlideConfig
  | FeatureGridSlideConfig
  | FishboneSlideConfig
  | ForceFieldSlideConfig
  | PricingSlideConfig
  | IconGridSlideConfig
  | NameRevealSlideConfig
  | ImageSlideConfig
  | TeamObjectivesSlideConfig
  | OperatingLoopSlideConfig
  | OKRScoreSlideConfig
  | SparklineGridSlideConfig
  | BarometerGridSlideConfig
  | ScorecardSlideConfig
  | StatusTableSlideConfig
  | RiskCardSlideConfig
