import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Clock,
  Layers,
  ArrowLeft,
  Briefcase,
  Rocket,
  Compass,
  Users,
  MessageSquare,
  ChevronRight,
  X,
} from 'lucide-react'
import {
  getAllTemplates,
  getCategories,
  forkTemplate,
  type DeckTemplate,
  type TemplateCategory,
} from '../agent/templates'
import SlideThumbnail from './SlideThumbnail'

const categoryIcons: Record<TemplateCategory, typeof Briefcase> = {
  'business-review': Briefcase,
  project: Rocket,
  strategy: Compass,
  team: Users,
  communication: MessageSquare,
}

interface TemplateGalleryProps {
  onBack: () => void
  onUseTemplate: (deckId: string) => void
}

function TemplateCard({
  template,
  index,
  onSelect,
}: {
  template: DeckTemplate
  index: number
  onSelect: (t: DeckTemplate) => void
}) {
  const CategoryIcon = categoryIcons[template.category] ?? Layers
  const category = getCategories().find((c) => c.id === template.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => onSelect(template)}
      className="group cursor-pointer rounded-xl border border-border bg-background-elevated overflow-hidden transition-all duration-200 hover:border-border-accent hover:shadow-lg hover:shadow-brand-red/5 hover:-translate-y-0.5"
    >
      {/* Preview area */}
      <div className="relative aspect-video bg-background-accent overflow-hidden">
        {template.slides[0] && (
          <SlideThumbnail
            slide={template.slides[0]}
            width={400}
            height={225}
            className="w-full h-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/70 backdrop-blur-sm text-tiny text-text-muted">
            <CategoryIcon size={11} />
            {category?.label}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/70 backdrop-blur-sm text-tiny text-text-muted ml-auto">
            <Layers size={11} />
            {template.slideCount}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/70 backdrop-blur-sm text-tiny text-text-muted">
            <Clock size={11} />
            {template.estimatedMinutes}m
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-display text-text font-semibold text-body-sm truncate">
          {template.name}
        </h3>
        <p className="text-text-muted text-caption mt-1 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {template.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-tiny text-text-muted bg-background-accent"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function TemplateDetail({
  template,
  onClose,
  onUse,
}: {
  template: DeckTemplate
  onClose: () => void
  onUse: () => void
}) {
  const category = getCategories().find((c) => c.id === template.category)
  const CategoryIcon = categoryIcons[template.category] ?? Layers

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background-elevated border border-border shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-background-elevated/95 backdrop-blur-sm">
          <div>
            <h2 className="font-display text-text text-h4 font-bold">{template.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-caption text-text-muted">
              <span className="flex items-center gap-1">
                <CategoryIcon size={13} />
                {category?.label}
              </span>
              <span className="flex items-center gap-1">
                <Layers size={13} />
                {template.slideCount} slides
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                ~{template.estimatedMinutes} min
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUse}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white rounded-lg text-caption font-semibold hover:bg-brand-red-dark transition-colors shadow-sm"
            >
              Use Template
              <ChevronRight size={14} />
            </motion.button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-text-secondary text-body-sm">{template.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-tiny text-text-muted bg-background-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Slide previews */}
        <div className="px-6 py-4">
          <h3 className="text-text text-caption font-semibold uppercase tracking-wider mb-4">
            Slide Preview ({template.slides.length} slides)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {template.slides.map((slide, i) => (
              <div key={slide.id} className="relative rounded-lg overflow-hidden border border-border">
                <SlideThumbnail
                  slide={slide}
                  width={280}
                  height={158}
                  className="w-full"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-2 py-1.5">
                  <span className="text-tiny text-text-muted">
                    {i + 1}. {'title' in slide ? (slide as { title?: string }).title ?? slide.type : slide.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customization hints */}
        {template.customizationHints.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <h3 className="text-text text-caption font-semibold uppercase tracking-wider mb-2">
              Customization Points
            </h3>
            <ul className="text-caption text-text-muted space-y-1">
              {template.customizationHints.map((hint, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-red mt-0.5">•</span>
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function TemplateGallery({ onBack, onUseTemplate }: TemplateGalleryProps) {
  const templates = useMemo(() => getAllTemplates(), [])
  const categories = useMemo(() => getCategories(), [])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<DeckTemplate | null>(null)

  const filtered = useMemo(() => {
    let result = templates

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
      )
    }

    return result
  }, [templates, search, activeCategory])

  const handleUseTemplate = useCallback(
    (template: DeckTemplate) => {
      const deckId = `${template.id}-${Date.now()}`
      const deck = forkTemplate(template.id, deckId, {
        author: 'You',
      })
      if (deck) {
        onUseTemplate(deckId)
      }
    },
    [onUseTemplate]
  )

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-nav-bg transition-colors"
        >
          <ArrowLeft size={18} />
        </motion.button>
        <h2 className="font-display text-text text-h4 font-bold">Templates</h2>
        <span className="text-text-muted text-caption">
          {filtered.length} {filtered.length === 1 ? 'template' : 'templates'}
        </span>
      </div>

      {/* Search & category filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background-accent border border-border text-text text-caption placeholder:text-text-muted/60 focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-border-accent transition-colors"
          />
        </div>
        <div className="flex items-center rounded-lg bg-background-accent border border-border overflow-hidden">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-2 text-tiny font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-nav-bg text-text'
                : 'text-text-muted hover:text-text hover:bg-nav-bg/50'
            }`}
          >
            All
          </button>
          {categories.map(({ id, label }) => {
            const Icon = categoryIcons[id]
            return (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`flex items-center gap-1 px-3 py-2 text-tiny font-medium transition-colors ${
                  activeCategory === id
                    ? 'bg-nav-bg text-text'
                    : 'text-text-muted hover:text-text hover:bg-nav-bg/50'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Search size={36} className="text-text-muted/40" />
          <p className="text-text text-body-sm font-semibold">No templates found</p>
          <button
            onClick={() => {
              setSearch('')
              setActiveCategory('all')
            }}
            className="text-brand-red text-caption hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={i}
              onSelect={setSelectedTemplate}
            />
          ))}
        </div>
      )}

      {/* Template detail modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <TemplateDetail
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
            onUse={() => {
              handleUseTemplate(selectedTemplate)
              setSelectedTemplate(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
