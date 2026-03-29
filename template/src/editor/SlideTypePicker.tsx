import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Search } from 'lucide-react'
import type { SlideConfig } from '../types'
import { generateSlideId } from '../hooks/useDeckEditor'

interface SlideTypePickerProps {
  onSelect: (slide: SlideConfig) => void
  onClose: () => void
}

interface SlideTypeInfo {
  type: string
  label: string
  description: string
  category: 'content' | 'layout' | 'data' | 'special'
  factory: () => SlideConfig
}

const SLIDE_TYPES: SlideTypeInfo[] = [
  {
    type: 'title', label: 'Title', description: 'Red gradient hero with title/subtitle',
    category: 'content',
    factory: () => ({ id: generateSlideId(), type: 'title', title: 'New Title Slide', subtitle: 'Subtitle' }),
  },
  {
    type: 'title-digital', label: 'Title Digital', description: 'Title with neural network animation',
    category: 'content',
    factory: () => ({ id: generateSlideId(), type: 'title-digital', title: 'New Digital Title', subtitle: 'Subtitle' }),
  },
  {
    type: 'content', label: 'Content', description: 'Single column with title, body, bullets',
    category: 'content',
    factory: () => ({ id: generateSlideId(), type: 'content', title: 'New Content Slide', bullets: ['Point 1', 'Point 2'] }),
  },
  {
    type: 'two-column', label: 'Two Column', description: '50/50 split layout with content cards',
    category: 'layout',
    factory: () => ({ id: generateSlideId(), type: 'two-column', title: 'Two Column',
      left: { title: 'Left', body: 'Content' }, right: { title: 'Right', body: 'Content' } }),
  },
  {
    type: 'three-column', label: 'Three Column', description: 'Three equal columns with icons',
    category: 'layout',
    factory: () => ({ id: generateSlideId(), type: 'three-column', title: 'Three Column',
      columns: [
        { icon: 'Target', title: 'First', description: 'Description' },
        { icon: 'Users', title: 'Second', description: 'Description' },
        { icon: 'Zap', title: 'Third', description: 'Description' },
      ] }),
  },
  {
    type: 'steps', label: 'Steps', description: 'Numbered step cards',
    category: 'content',
    factory: () => ({ id: generateSlideId(), type: 'steps', title: 'Steps',
      steps: [{ icon: 'Target', title: 'Step 1', description: 'Description' }] }),
  },
  {
    type: 'divider', label: 'Divider', description: 'Full-color section divider',
    category: 'special',
    factory: () => ({ id: generateSlideId(), type: 'divider', title: 'Section Title' }),
  },
  {
    type: 'quote', label: 'Quote', description: 'Quote with author attribution',
    category: 'content',
    factory: () => ({ id: generateSlideId(), type: 'quote', quote: 'Your quote here', author: 'Author Name' }),
  },
  {
    type: 'stats', label: 'Stats', description: 'Animated count-up statistics',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'stats', title: 'Key Stats',
      stats: [{ value: 100, label: 'Metric', suffix: '%' }] }),
  },
  {
    type: 'image-content', label: 'Image + Content', description: '50/50 image and text split',
    category: 'layout',
    factory: () => ({ id: generateSlideId(), type: 'image-content', title: 'Title', bullets: ['Point 1'], imagePlaceholder: true }),
  },
  {
    type: 'timeline', label: 'Timeline', description: 'Horizontal timeline with nodes',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'timeline', title: 'Timeline',
      nodes: [{ date: 'Q1', title: 'Event', description: 'Description' }] }),
  },
  {
    type: 'comparison', label: 'Comparison', description: 'Before/After with animated arrow',
    category: 'layout',
    factory: () => ({ id: generateSlideId(), type: 'comparison', title: 'Comparison',
      leftLabel: 'Before', rightLabel: 'After', leftItems: ['Item 1'], rightItems: ['Item 1'] }),
  },
  {
    type: 'icon-grid', label: 'Icon Grid', description: 'Grid of icons with titles',
    category: 'layout',
    factory: () => ({ id: generateSlideId(), type: 'icon-grid', title: 'Features',
      items: [{ icon: 'Star', title: 'Feature', description: 'Description' }] }),
  },
  {
    type: 'matrix', label: 'Matrix', description: '2x2 quadrant grid',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'matrix', title: 'Matrix', xAxis: 'Impact', yAxis: 'Effort',
      quadrants: { topLeft: [], topRight: [], bottomLeft: [], bottomRight: [] } }),
  },
  {
    type: 'feature-grid', label: 'Feature Grid', description: 'Comparison table with checkmarks',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'feature-grid', title: 'Feature Comparison',
      columns: [{ header: 'Option A' }, { header: 'Option B' }],
      rows: [{ feature: 'Feature 1', values: [true, false] }] }),
  },
  {
    type: 'gantt', label: 'Gantt', description: 'Project Gantt chart',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'gantt', title: 'Project Timeline',
      tasks: [{ name: 'Task 1', start: '2025-01-01', end: '2025-03-31', status: 'active' as const }] }),
  },
  {
    type: 'org-chart', label: 'Org Chart', description: 'Hierarchical tree structure',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'org-chart', title: 'Organization',
      root: { name: 'CEO', role: 'Chief Executive', children: [] } }),
  },
  {
    type: 'fishbone', label: 'Fishbone', description: 'Root cause analysis diagram',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'fishbone', title: 'Root Cause', problem: 'Problem Statement',
      branches: [{ category: 'Category', causes: ['Cause 1'] }] }),
  },
  {
    type: 'force-field', label: 'Force Field', description: 'Driving vs restraining forces',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'force-field', title: 'Force Field', subject: 'Change Proposal',
      driving: [{ label: 'Driver', strength: 2 as const }], restraining: [{ label: 'Barrier', strength: 2 as const }] }),
  },
  {
    type: 'pricing', label: 'Pricing', description: 'Pricing tiers table',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'pricing', title: 'Pricing',
      tiers: [{ name: 'Basic', price: '$9', features: ['Feature 1'] }] }),
  },
  {
    type: 'team-objectives', label: 'Team Objectives', description: 'Team with OKRs',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'team-objectives', teamName: 'Team', teamIcon: 'Users',
      objectives: [{ icon: 'Target', objective: 'Objective', keyResults: [{ title: 'KR1', description: 'Key Result' }] }] }),
  },
  {
    type: 'okr-score', label: 'OKR Score', description: 'Dense OKR scorecard',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'okr-score', title: 'OKR Scorecard',
      objectives: [{ icon: 'Target', objective: 'Objective',
        keyResults: [{ title: 'KR1', owner: 'Owner', progress: 'on-track' as const }] }] }),
  },
  {
    type: 'operating-loop', label: 'Operating Loop', description: 'Circular cadence view',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'operating-loop', title: 'Operating Loop',
      nodes: [{ date: 'Mon', title: 'Activity', description: 'Description' }] }),
  },
  {
    type: 'sparkline-grid', label: 'Sparkline Grid', description: 'Resource intensity heatmap',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'sparkline-grid', title: 'Resource Map',
      phases: ['Phase 1', 'Phase 2'], rows: [{ label: 'Team A', values: [1, 2] }] }),
  },
  {
    type: 'barometer-grid', label: 'Barometer Grid', description: 'Themes with barometer scores',
    category: 'data',
    factory: () => ({ id: generateSlideId(), type: 'barometer-grid', title: 'Barometer',
      items: [{ title: 'Theme', description: 'Description', score: 8, maxScore: 10 }] }),
  },
  {
    type: 'image', label: 'Image', description: 'Full-screen static image',
    category: 'special',
    factory: () => ({ id: generateSlideId(), type: 'image', src: '', alt: 'Image' }),
  },
  {
    type: 'name-reveal', label: 'Name Reveal', description: 'Dissolve old name, reveal new',
    category: 'special',
    factory: () => ({ id: generateSlideId(), type: 'name-reveal', fromText: 'Old Name', toText: 'New Name' }),
  },
  {
    type: 'qa', label: 'Q&A', description: 'Large Q+A text on red background',
    category: 'special',
    factory: () => ({ id: generateSlideId(), type: 'qa' }),
  },
  {
    type: 'closing', label: 'Closing', description: 'Closing slide with tagline',
    category: 'special',
    factory: () => ({ id: generateSlideId(), type: 'closing', tagline: 'Thank you' }),
  },
]

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'content', label: 'Content' },
  { key: 'layout', label: 'Layout' },
  { key: 'data', label: 'Data' },
  { key: 'special', label: 'Special' },
] as const

export default function SlideTypePicker({ onSelect, onClose }: SlideTypePickerProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    let items = SLIDE_TYPES
    if (category !== 'all') {
      items = items.filter(t => t.category === category)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      items = items.filter(t =>
        t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }
    return items
  }, [query, category])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="bg-background-elevated rounded-xl border border-border shadow-2xl w-[640px] max-h-[75vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search slide types..."
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-muted/50"
            autoFocus
          />
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-border/50">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                category === c.key
                  ? 'bg-brand-red text-white'
                  : 'text-text-muted hover:text-text hover:bg-background-accent'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            {filtered.map(t => (
              <button
                key={t.type}
                onClick={() => onSelect(t.factory())}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border hover:border-brand-red/50 hover:bg-background-accent transition-colors text-left"
              >
                <span className="text-sm font-medium text-text">{t.label}</span>
                <span className="text-xs text-text-muted leading-snug">{t.description}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">No slide types match your search</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
