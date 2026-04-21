/**
 * @throughline/types — shared slide type definitions used by both
 * the local presentation app and the cloud backend.
 *
 * Icon references are plain strings here (Lucide icon names).
 * The template app widens this to LucideIcon | string at import.
 */

export type IconRef = string

// Base slide type
export interface BaseSlide {
  id: string
  notes?: string | string[]
}

export interface TitleSlideConfig extends BaseSlide {
  type: 'title'
  title: string
  subtitle?: string
  tagline?: string
}

export interface TitleSlideDigitalConfig extends BaseSlide {
  type: 'title-digital'
  title: string
  subtitle?: string
  tagline?: string
}

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

export interface ContentSlideConfig extends BaseSlide {
  type: 'content'
  title: string
  subtitle?: string
  body?: string
  bullets?: string[]
}

export interface QuoteSlideConfig extends BaseSlide {
  type: 'quote'
  quote: string
  author: string
  authorTitle?: string
  variant?: 'split' | 'full'
}

export interface DividerSlideConfig extends BaseSlide {
  type: 'divider'
  title: string
  subtitle?: string
  sectionNumber?: number
}

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

export interface ComparisonSlideConfig extends BaseSlide {
  type: 'comparison'
  title?: string
  leftLabel?: string
  rightLabel?: string
  leftItems: string[]
  rightItems: string[]
}

export interface QASlideConfig extends BaseSlide {
  type: 'qa'
  text?: string
  subtitle?: string
}

export interface SocialLink {
  platform: string
  url: string
  icon?: IconRef
}

export interface ClosingSlideConfig extends BaseSlide {
  type: 'closing'
  tagline?: string
  contactEmail?: string
  socialLinks?: SocialLink[]
  logoSrc?: string
}

export interface GanttTask {
  name: string
  start: string
  end: string
  progress?: number
  section?: string
  status?: 'done' | 'active' | 'crit' | 'milestone'
}

export interface GanttSlideConfig extends BaseSlide {
  type: 'gantt'
  title?: string
  tasks?: GanttTask[]
  source?: string
  dateFormat?: 'month' | 'quarter' | 'week' | 'relative-month'
}

export interface MatrixItem {
  label: string
  description?: string
}

export interface MatrixSlideConfig extends BaseSlide {
  type: 'matrix'
  title?: string
  xAxis: string
  yAxis: string
  quadrants: {
    topLeft: MatrixItem[]
    topRight: MatrixItem[]
    bottomLeft: MatrixItem[]
    bottomRight: MatrixItem[]
  }
}

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

export interface FeatureGridColumn {
  header: string
  highlight?: boolean
}

export interface FeatureGridRow {
  feature: string
  values: (boolean | string)[]
}

export interface FeatureGridSlideConfig extends BaseSlide {
  type: 'feature-grid'
  title?: string
  subtitle?: string
  columns: FeatureGridColumn[]
  rows: FeatureGridRow[]
  columnWidths?: string
}

export interface FishboneBranch {
  category: string
  causes: string[]
}

export interface FishboneSlideConfig extends BaseSlide {
  type: 'fishbone'
  title?: string
  problem: string
  branches: FishboneBranch[]
}

export interface ForceItem {
  label: string
  strength: 1 | 2 | 3
}

export interface ForceFieldSlideConfig extends BaseSlide {
  type: 'force-field'
  title?: string
  subject: string
  driving: ForceItem[]
  restraining: ForceItem[]
}

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

export interface NameRevealSlideConfig extends BaseSlide {
  type: 'name-reveal'
  fromText: string
  toText: string
  subtitle?: string
  tagline?: string
}

export interface ImageSlideConfig extends BaseSlide {
  type: 'image'
  src: string
  alt?: string
}

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

export interface OperatingLoopSlideConfig extends BaseSlide {
  type: 'operating-loop'
  title?: string
  nodes: TimelineNode[]
}

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

export interface SparklineGridRow {
  label: string
  values: number[]
}

export interface SparklineGridSlideConfig extends BaseSlide {
  type: 'sparkline-grid'
  title?: string
  subtitle?: string
  phases: string[]
  rows: SparklineGridRow[]
}

export interface BarometerGridItem {
  title: string
  description: string
  score: number
  maxScore: number
}

export interface BarometerGridSlideConfig extends BaseSlide {
  type: 'barometer-grid'
  title?: string
  subtitle?: string
  items: BarometerGridItem[]
  columns?: 2 | 3
}

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

/**
 * Top-level deck configuration. May be the default export of a deck's
 * `slides.config.ts`, or inferred from named exports (`slides`, `title`, …)
 * by the CLI publish pipeline.
 */
export interface DeckConfig {
  title: string
  description?: string
  author?: string
  createdAt?: string
  /**
   * The "one claim" that anchors the deck — the single argument every slide
   * must serve. Populated by `throughline shape` / `throughline new --from-brief`
   * and validated by `throughline check`.
   */
  throughline?: string
  slides: SlideConfig[]
}
