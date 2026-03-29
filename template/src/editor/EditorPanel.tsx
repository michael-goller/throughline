import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { SlideConfig } from '../types'
import type { DeckEditorActions } from '../hooks/useDeckEditor'
import IconPicker from './IconPicker'

interface EditorPanelProps {
  slide: SlideConfig
  index: number
  actions: DeckEditorActions
}

// Field components
function TextField({ label, value, onChange, multiline }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean
}) {
  if (multiline) {
    return (
      <label className="block">
        <span className="text-xs text-text-muted font-medium mb-1 block">{label}</span>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full bg-background rounded-md border border-border px-3 py-2 text-sm text-text outline-none focus:border-brand-red/50 resize-y"
        />
      </label>
    )
  }
  return (
    <label className="block">
      <span className="text-xs text-text-muted font-medium mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-background rounded-md border border-border px-3 py-2 text-sm text-text outline-none focus:border-brand-red/50"
      />
    </label>
  )
}

function NumberField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <label className="block">
      <span className="text-xs text-text-muted font-medium mb-1 block">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-background rounded-md border border-border px-3 py-2 text-sm text-text outline-none focus:border-brand-red/50"
      />
    </label>
  )
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-text-muted font-medium mb-1 block">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-background rounded-md border border-border px-3 py-2 text-sm text-text outline-none focus:border-brand-red/50"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function BulletListEditor({ label, items, onChange }: {
  label: string; items: string[]; onChange: (items: string[]) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-xs text-text-muted font-medium mb-1 hover:text-text"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        {label} ({items.length})
      </button>
      {!collapsed && (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="text"
                value={item}
                onChange={e => {
                  const next = [...items]
                  next[i] = e.target.value
                  onChange(next)
                }}
                className="flex-1 bg-background rounded-md border border-border px-2 py-1 text-sm text-text outline-none focus:border-brand-red/50"
              />
              <button
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="p-1 text-text-muted hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...items, ''])}
            className="flex items-center gap-1 text-xs text-brand-red hover:text-brand-red-tint px-1 py-0.5"
          >
            <Plus size={12} /> Add item
          </button>
        </div>
      )}
    </div>
  )
}

function IconField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const iconName = typeof value === 'string' ? value : 'Circle'

  return (
    <div>
      <span className="text-xs text-text-muted font-medium mb-1 block">{label}</span>
      <button
        onClick={() => setShowPicker(true)}
        className="w-full flex items-center gap-2 bg-background rounded-md border border-border px-3 py-2 text-sm text-text hover:border-brand-red/50"
      >
        <span className="flex-1 text-left truncate">{iconName}</span>
        <span className="text-xs text-text-muted">Change</span>
      </button>
      <AnimatePresence>
        {showPicker && (
          <IconPicker
            currentIcon={iconName}
            onSelect={name => { onChange(name); setShowPicker(false) }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Type-specific field renderers
function renderFields(
  slide: SlideConfig,
  index: number,
  actions: DeckEditorActions
) {
  const update = (patch: Record<string, unknown>) => {
    actions.updateSlide(index, patch as Partial<SlideConfig>)
  }

  switch (slide.type) {
    case 'title':
    case 'title-digital':
      return (
        <>
          <TextField label="Title" value={slide.title} onChange={v => update({ title: v })} />
          <TextField label="Subtitle" value={slide.subtitle ?? ''} onChange={v => update({ subtitle: v })} />
          <TextField label="Tagline" value={slide.tagline ?? ''} onChange={v => update({ tagline: v })} />
        </>
      )

    case 'content':
      return (
        <>
          <TextField label="Title" value={slide.title} onChange={v => update({ title: v })} />
          <TextField label="Subtitle" value={slide.subtitle ?? ''} onChange={v => update({ subtitle: v })} />
          <TextField label="Body" value={slide.body ?? ''} onChange={v => update({ body: v })} multiline />
          <BulletListEditor
            label="Bullets"
            items={slide.bullets ?? []}
            onChange={v => update({ bullets: v })}
          />
        </>
      )

    case 'divider':
      return (
        <>
          <TextField label="Title" value={slide.title} onChange={v => update({ title: v })} />
          <TextField label="Subtitle" value={slide.subtitle ?? ''} onChange={v => update({ subtitle: v })} />
          <NumberField label="Section Number" value={slide.sectionNumber ?? 0} onChange={v => update({ sectionNumber: v || undefined })} />
        </>
      )

    case 'quote':
      return (
        <>
          <TextField label="Quote" value={slide.quote} onChange={v => update({ quote: v })} multiline />
          <TextField label="Author" value={slide.author} onChange={v => update({ author: v })} />
          <TextField label="Author Title" value={slide.authorTitle ?? ''} onChange={v => update({ authorTitle: v })} />
          <SelectField
            label="Variant"
            value={slide.variant ?? 'split'}
            options={[{ value: 'split', label: 'Split' }, { value: 'full', label: 'Full' }]}
            onChange={v => update({ variant: v })}
          />
        </>
      )

    case 'steps':
      return (
        <>
          <TextField label="Title" value={slide.title} onChange={v => update({ title: v })} />
          <div className="border-t border-border/50 pt-2 mt-2">
            <span className="text-xs text-text-muted font-medium">Steps</span>
            {slide.steps.map((step, i) => (
              <div key={i} className="mt-2 p-2 bg-background rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Step {i + 1}</span>
                  <button
                    onClick={() => {
                      const steps = slide.steps.filter((_, j) => j !== i)
                      update({ steps })
                    }}
                    className="p-0.5 text-text-muted hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <IconField
                  label="Icon"
                  value={typeof step.icon === 'string' ? step.icon : 'Circle'}
                  onChange={v => {
                    const steps = [...slide.steps]
                    steps[i] = { ...steps[i], icon: v }
                    update({ steps })
                  }}
                />
                <TextField
                  label="Title"
                  value={step.title}
                  onChange={v => {
                    const steps = [...slide.steps]
                    steps[i] = { ...steps[i], title: v }
                    update({ steps })
                  }}
                />
                <TextField
                  label="Description"
                  value={step.description}
                  onChange={v => {
                    const steps = [...slide.steps]
                    steps[i] = { ...steps[i], description: v }
                    update({ steps })
                  }}
                />
                <TextField
                  label="Duration"
                  value={step.duration ?? ''}
                  onChange={v => {
                    const steps = [...slide.steps]
                    steps[i] = { ...steps[i], duration: v || undefined }
                    update({ steps })
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                const steps = [...slide.steps, { icon: 'Circle', title: 'New Step', description: '' }]
                update({ steps })
              }}
              className="flex items-center gap-1 text-xs text-brand-red hover:text-brand-red-tint mt-2 px-1"
            >
              <Plus size={12} /> Add step
            </button>
          </div>
        </>
      )

    case 'two-column':
      return (
        <>
          <TextField label="Title" value={slide.title} onChange={v => update({ title: v })} />
          <TextField label="Subtitle" value={slide.subtitle ?? ''} onChange={v => update({ subtitle: v })} />
          {(['left', 'right'] as const).map(side => (
            <div key={side} className="border-t border-border/50 pt-2 mt-2">
              <span className="text-xs text-text-muted font-medium capitalize">{side} Column</span>
              <div className="space-y-2 mt-1">
                <TextField
                  label="Title"
                  value={slide[side].title}
                  onChange={v => update({ [side]: { ...slide[side], title: v } })}
                />
                <TextField
                  label="Body"
                  value={slide[side].body}
                  onChange={v => update({ [side]: { ...slide[side], body: v } })}
                  multiline
                />
                <BulletListEditor
                  label="Bullets"
                  items={slide[side].bullets ?? []}
                  onChange={v => update({ [side]: { ...slide[side], bullets: v } })}
                />
              </div>
            </div>
          ))}
        </>
      )

    case 'three-column':
      return (
        <>
          <TextField label="Title" value={slide.title ?? ''} onChange={v => update({ title: v })} />
          {slide.columns.map((col, i) => (
            <div key={i} className="border-t border-border/50 pt-2 mt-2">
              <span className="text-xs text-text-muted font-medium">Column {i + 1}</span>
              <div className="space-y-2 mt-1">
                <IconField
                  label="Icon"
                  value={typeof col.icon === 'string' ? col.icon : 'Circle'}
                  onChange={v => {
                    const columns = [...slide.columns] as typeof slide.columns
                    columns[i] = { ...columns[i], icon: v }
                    update({ columns })
                  }}
                />
                <TextField
                  label="Title"
                  value={col.title}
                  onChange={v => {
                    const columns = [...slide.columns] as typeof slide.columns
                    columns[i] = { ...columns[i], title: v }
                    update({ columns })
                  }}
                />
                <TextField
                  label="Description"
                  value={col.description}
                  onChange={v => {
                    const columns = [...slide.columns] as typeof slide.columns
                    columns[i] = { ...columns[i], description: v }
                    update({ columns })
                  }}
                />
              </div>
            </div>
          ))}
        </>
      )

    case 'stats':
      return (
        <>
          <TextField label="Title" value={slide.title ?? ''} onChange={v => update({ title: v })} />
          <SelectField
            label="Layout"
            value={slide.layout ?? '2x2'}
            options={[{ value: '2x2', label: '2x2 Grid' }, { value: '1x4', label: '1x4 Row' }]}
            onChange={v => update({ layout: v })}
          />
          {slide.stats.map((stat, i) => (
            <div key={i} className="border-t border-border/50 pt-2 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Stat {i + 1}</span>
                <button
                  onClick={() => update({ stats: slide.stats.filter((_, j) => j !== i) })}
                  className="p-0.5 text-text-muted hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <NumberField label="Value" value={stat.value} onChange={v => {
                const stats = [...slide.stats]; stats[i] = { ...stats[i], value: v }; update({ stats })
              }} />
              <TextField label="Label" value={stat.label} onChange={v => {
                const stats = [...slide.stats]; stats[i] = { ...stats[i], label: v }; update({ stats })
              }} />
              <TextField label="Prefix" value={stat.prefix ?? ''} onChange={v => {
                const stats = [...slide.stats]; stats[i] = { ...stats[i], prefix: v || undefined }; update({ stats })
              }} />
              <TextField label="Suffix" value={stat.suffix ?? ''} onChange={v => {
                const stats = [...slide.stats]; stats[i] = { ...stats[i], suffix: v || undefined }; update({ stats })
              }} />
            </div>
          ))}
          <button
            onClick={() => update({ stats: [...slide.stats, { value: 0, label: 'New Stat' }] })}
            className="flex items-center gap-1 text-xs text-brand-red hover:text-brand-red-tint mt-2 px-1"
          >
            <Plus size={12} /> Add stat
          </button>
        </>
      )

    case 'image-content':
      return (
        <>
          <TextField label="Title" value={slide.title} onChange={v => update({ title: v })} />
          <TextField label="Body" value={slide.body ?? ''} onChange={v => update({ body: v })} multiline />
          <BulletListEditor
            label="Bullets"
            items={slide.bullets ?? []}
            onChange={v => update({ bullets: v })}
          />
          <TextField label="Image URL" value={slide.imageUrl ?? slide.imageSrc ?? ''} onChange={v => update({ imageUrl: v, imageSrc: undefined, imagePlaceholder: !v })} />
          <SelectField
            label="Image Position"
            value={slide.imagePosition ?? 'right'}
            options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]}
            onChange={v => update({ imagePosition: v })}
          />
        </>
      )

    case 'timeline':
      return (
        <>
          <TextField label="Title" value={slide.title ?? ''} onChange={v => update({ title: v })} />
          {slide.nodes.map((node, i) => (
            <div key={i} className="border-t border-border/50 pt-2 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Node {i + 1}</span>
                <button
                  onClick={() => update({ nodes: slide.nodes.filter((_, j) => j !== i) })}
                  className="p-0.5 text-text-muted hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <TextField label="Date" value={node.date} onChange={v => {
                const nodes = [...slide.nodes]; nodes[i] = { ...nodes[i], date: v }; update({ nodes })
              }} />
              <TextField label="Title" value={node.title} onChange={v => {
                const nodes = [...slide.nodes]; nodes[i] = { ...nodes[i], title: v }; update({ nodes })
              }} />
              <TextField label="Description" value={node.description ?? ''} onChange={v => {
                const nodes = [...slide.nodes]; nodes[i] = { ...nodes[i], description: v || undefined }; update({ nodes })
              }} />
            </div>
          ))}
          <button
            onClick={() => update({ nodes: [...slide.nodes, { date: '', title: 'New Event' }] })}
            className="flex items-center gap-1 text-xs text-brand-red hover:text-brand-red-tint mt-2 px-1"
          >
            <Plus size={12} /> Add node
          </button>
        </>
      )

    case 'comparison':
      return (
        <>
          <TextField label="Title" value={slide.title ?? ''} onChange={v => update({ title: v })} />
          <TextField label="Left Label" value={slide.leftLabel ?? 'Before'} onChange={v => update({ leftLabel: v })} />
          <TextField label="Right Label" value={slide.rightLabel ?? 'After'} onChange={v => update({ rightLabel: v })} />
          <BulletListEditor label="Left Items" items={slide.leftItems} onChange={v => update({ leftItems: v })} />
          <BulletListEditor label="Right Items" items={slide.rightItems} onChange={v => update({ rightItems: v })} />
        </>
      )

    case 'icon-grid':
      return (
        <>
          <TextField label="Title" value={slide.title ?? ''} onChange={v => update({ title: v })} />
          <SelectField
            label="Columns"
            value={String(slide.columns ?? 3)}
            options={[{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }]}
            onChange={v => update({ columns: Number(v) as 2 | 3 | 4 })}
          />
          {slide.items.map((item, i) => (
            <div key={i} className="border-t border-border/50 pt-2 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Item {i + 1}</span>
                <button
                  onClick={() => update({ items: slide.items.filter((_, j) => j !== i) })}
                  className="p-0.5 text-text-muted hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <IconField
                label="Icon"
                value={typeof item.icon === 'string' ? item.icon : 'Circle'}
                onChange={v => {
                  const items = [...slide.items]; items[i] = { ...items[i], icon: v }; update({ items })
                }}
              />
              <TextField label="Title" value={item.title} onChange={v => {
                const items = [...slide.items]; items[i] = { ...items[i], title: v }; update({ items })
              }} />
              <TextField label="Description" value={item.description ?? ''} onChange={v => {
                const items = [...slide.items]; items[i] = { ...items[i], description: v || undefined }; update({ items })
              }} />
            </div>
          ))}
          <button
            onClick={() => update({ items: [...slide.items, { icon: 'Star', title: 'New Item' }] })}
            className="flex items-center gap-1 text-xs text-brand-red hover:text-brand-red-tint mt-2 px-1"
          >
            <Plus size={12} /> Add item
          </button>
        </>
      )

    case 'qa':
      return (
        <>
          <TextField label="Text" value={slide.text ?? 'Q+A'} onChange={v => update({ text: v })} />
          <TextField label="Subtitle" value={slide.subtitle ?? ''} onChange={v => update({ subtitle: v })} />
        </>
      )

    case 'closing':
      return (
        <>
          <TextField label="Tagline" value={slide.tagline ?? ''} onChange={v => update({ tagline: v })} />
          <TextField label="Contact Email" value={slide.contactEmail ?? ''} onChange={v => update({ contactEmail: v })} />
        </>
      )

    case 'image':
      return (
        <>
          <TextField label="Image URL" value={slide.src} onChange={v => update({ src: v })} />
          <TextField label="Alt Text" value={slide.alt ?? ''} onChange={v => update({ alt: v })} />
        </>
      )

    case 'name-reveal':
      return (
        <>
          <TextField label="From Text" value={slide.fromText} onChange={v => update({ fromText: v })} />
          <TextField label="To Text" value={slide.toText} onChange={v => update({ toText: v })} />
          <TextField label="Subtitle" value={slide.subtitle ?? ''} onChange={v => update({ subtitle: v })} />
          <TextField label="Tagline" value={slide.tagline ?? ''} onChange={v => update({ tagline: v })} />
        </>
      )

    // For complex data types, show a JSON editor as fallback
    default:
      return <FallbackJsonEditor slide={slide} index={index} actions={actions} />
  }
}

function FallbackJsonEditor({
  slide,
  index,
  actions,
}: {
  slide: SlideConfig
  index: number
  actions: DeckEditorActions
}) {
  const [json, setJson] = useState(() => JSON.stringify(slide, null, 2))
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(() => {
    try {
      const parsed = JSON.parse(json) as SlideConfig
      if (!parsed.id || !parsed.type) {
        setError('Must have id and type')
        return
      }
      actions.replaceSlide(index, parsed)
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [json, index, actions])

  return (
    <div className="space-y-2">
      <span className="text-xs text-text-muted">JSON Editor (slide type: {slide.type})</span>
      <textarea
        value={json}
        onChange={e => setJson(e.target.value)}
        rows={16}
        className="w-full bg-background rounded-md border border-border px-3 py-2 text-xs text-text font-mono outline-none focus:border-brand-red/50 resize-y"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={apply}
        className="px-3 py-1.5 bg-brand-red text-white text-xs rounded-md hover:bg-brand-red-dark"
      >
        Apply JSON
      </button>
    </div>
  )
}

export default function EditorPanel({ slide, index, actions }: EditorPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Properties</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Slide {index + 1} — <span className="font-mono">{slide.type}</span>
          </p>
        </div>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* ID field (read-only) */}
        <label className="block">
          <span className="text-xs text-text-muted font-medium mb-1 block">ID</span>
          <input
            type="text"
            value={slide.id}
            readOnly
            className="w-full bg-background/50 rounded-md border border-border/50 px-3 py-2 text-xs text-text-muted font-mono cursor-not-allowed"
          />
        </label>

        {/* Type-specific fields */}
        {renderFields(slide, index, actions)}
      </div>
    </div>
  )
}
