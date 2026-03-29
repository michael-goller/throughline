import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Copy, Trash2, EyeOff, Eye,
  GripVertical, ArrowUp, ArrowDown, Download,
  LayoutGrid, ChevronLeft, ChevronRight, Save,
} from 'lucide-react'
import type { SlideConfig } from '../types'
import { useDeckEditor } from '../hooks/useDeckEditor'
import { useSlideState } from '../hooks/useSlideState'
import SlideThumbnail from '../components/SlideThumbnail'
import SlideRenderer from '../templates'
import EditorPanel from './EditorPanel'
import SlideTypePicker from './SlideTypePicker'

interface SlideEditorProps {
  slides: SlideConfig[]
  deckId: string
  onClose: () => void
  onSave?: (slides: SlideConfig[]) => void
}

export default function SlideEditor({ slides: initialSlides, deckId, onClose, onSave }: SlideEditorProps) {
  const editor = useDeckEditor(initialSlides)
  const { isHidden, toggleHidden } = useSlideState(deckId)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const currentSlide = editor.slides[editor.selectedIndex]

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if ((e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]')) return

      if (e.key === 'Escape') {
        if (showTypePicker) return
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault()
        if (editor.selectedIndex > 0) {
          editor.moveSlide(editor.selectedIndex, editor.selectedIndex - 1)
        }
      } else if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault()
        if (editor.selectedIndex < editor.slides.length - 1) {
          editor.moveSlide(editor.selectedIndex, editor.selectedIndex + 1)
        }
      } else if (e.key === 'j' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        editor.selectSlide(Math.min(editor.selectedIndex + 1, editor.slides.length - 1))
      } else if (e.key === 'k' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        editor.selectSlide(Math.max(editor.selectedIndex - 1, 0))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editor, onClose, showTypePicker])

  // Scroll selected thumbnail into view
  useEffect(() => {
    const container = sidebarRef.current
    if (!container) return
    const thumb = container.querySelector(`[data-slide-index="${editor.selectedIndex}"]`)
    thumb?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [editor.selectedIndex])

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback((index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      editor.moveSlide(dragIndex, index)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragIndex, editor])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleSave = useCallback(() => {
    const slides = editor.getSlides()
    if (onSave) {
      onSave(slides)
      editor.markClean()
    } else {
      // Fallback: download as JSON
      const blob = new Blob([JSON.stringify({
        id: deckId,
        title: 'Untitled Deck',
        updatedAt: new Date().toISOString(),
        slides,
      }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deckId}.json`
      a.click()
      URL.revokeObjectURL(url)
      editor.markClean()
    }
  }, [editor, deckId, onSave])

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {/* Sidebar — slide thumbnails */}
      <div className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-background-elevated">
        {/* Sidebar header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Slides</span>
          <button
            onClick={() => setShowTypePicker(true)}
            className="p-1 rounded-md text-text-muted hover:text-brand-red hover:bg-background-accent"
            title="Add slide"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Slide list */}
        <div ref={sidebarRef} className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
          {editor.slides.map((slide, index) => {
            const isSelected = index === editor.selectedIndex
            const hidden = isHidden(slide.id)
            const isDragOver = dragOverIndex === index && dragIndex !== index

            return (
              <div
                key={slide.id}
                data-slide-index={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                onClick={() => editor.selectSlide(index)}
                className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-brand-red shadow-md shadow-brand-red/10'
                    : 'ring-1 ring-border hover:ring-border/80'
                } ${isDragOver ? 'ring-2 ring-brand-red/50' : ''} ${
                  hidden ? 'opacity-40' : ''
                }`}
              >
                {/* Thumbnail */}
                <SlideThumbnail
                  slide={slide}
                  width={192}
                  height={108}
                />

                {/* Slide number */}
                <div className={`absolute top-1 left-1 min-w-[1.2rem] h-4 flex items-center justify-center rounded text-[9px] font-mono px-0.5 ${
                  isSelected ? 'bg-brand-red text-white' : 'bg-background/80 text-text-muted backdrop-blur-sm'
                }`}>
                  {index + 1}
                </div>

                {/* Drag handle (visible on hover) */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity">
                  <GripVertical size={12} className="text-text-muted" />
                </div>

                {/* Quick actions (visible on hover) */}
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHidden(slide.id) }}
                    className="p-0.5 rounded bg-background/80 backdrop-blur-sm text-text-muted hover:text-text"
                    title={hidden ? 'Show slide' : 'Hide slide'}
                  >
                    {hidden ? <Eye size={10} /> : <EyeOff size={10} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); editor.duplicateSlide(index) }}
                    className="p-0.5 rounded bg-background/80 backdrop-blur-sm text-text-muted hover:text-text"
                    title="Duplicate"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); editor.deleteSlide(index) }}
                    className="p-0.5 rounded bg-background/80 backdrop-blur-sm text-text-muted hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sidebar footer */}
        <div className="px-3 py-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>{editor.slides.length} slides</span>
          <div className="flex gap-1">
            <button
              onClick={() => editor.selectedIndex > 0 && editor.moveSlide(editor.selectedIndex, editor.selectedIndex - 1)}
              className="p-1 rounded hover:bg-background-accent text-text-muted hover:text-text disabled:opacity-30"
              disabled={editor.selectedIndex === 0}
              title="Move up"
            >
              <ArrowUp size={12} />
            </button>
            <button
              onClick={() => editor.selectedIndex < editor.slides.length - 1 && editor.moveSlide(editor.selectedIndex, editor.selectedIndex + 1)}
              className="p-1 rounded hover:bg-background-accent text-text-muted hover:text-text disabled:opacity-30"
              disabled={editor.selectedIndex === editor.slides.length - 1}
              title="Move down"
            >
              <ArrowDown size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Center — slide preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-11 border-b border-border flex items-center px-4 gap-2 bg-background-elevated">
          <button
            onClick={() => setShowTypePicker(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-text-muted hover:text-text hover:bg-background-accent"
            title="Add new slide"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>

          <button
            onClick={() => editor.duplicateSlide(editor.selectedIndex)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-text-muted hover:text-text hover:bg-background-accent"
            title="Duplicate slide"
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => editor.deleteSlide(editor.selectedIndex)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-text-muted hover:text-red-400 hover:bg-background-accent"
            title="Delete slide"
            disabled={editor.slides.length <= 1}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <button
            onClick={() => {
              setShowTypePicker(true)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-text-muted hover:text-text hover:bg-background-accent"
            title="Change slide type"
          >
            <LayoutGrid size={14} />
            <span>Type</span>
          </button>

          <div className="flex-1" />

          {/* Save button */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              editor.dirty
                ? 'bg-brand-red text-white hover:bg-brand-red-dark'
                : 'bg-background-accent text-text-muted'
            }`}
          >
            {onSave ? <Save size={14} /> : <Download size={14} />}
            <span>{onSave ? 'Save' : 'Export JSON'}</span>
          </button>

          {/* Toggle panel */}
          <button
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-background-accent"
            title={panelCollapsed ? 'Show panel' : 'Hide panel'}
          >
            {panelCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-background-accent"
            title="Close editor (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center bg-[#0f0f0f] p-6 overflow-hidden">
          <div className="relative w-full h-full max-w-[1200px] max-h-[675px] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/5">
            {currentSlide && (
              <div
                className="w-full h-full"
                style={{
                  // Scale the full-resolution slide into the preview box
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '1920px',
                    height: '1080px',
                    transform: 'scale(var(--preview-scale))',
                    transformOrigin: 'top left',
                    // Calculate scale via CSS
                    ['--preview-scale' as string]: 'min(calc(100cqw / 1920), calc(100cqh / 1080))',
                  }}
                  className="[container-type:size] w-full h-full"
                >
                  {/* Wrap in a container that provides the size context */}
                  <PreviewWrapper slide={currentSlide} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — property editor */}
      <AnimatePresence initial={false}>
        {!panelCollapsed && currentSlide && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 border-l border-border bg-background-elevated overflow-hidden"
          >
            <div className="w-80">
              <EditorPanel
                key={currentSlide.id}
                slide={currentSlide}
                index={editor.selectedIndex}
                actions={editor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide type picker modal */}
      <AnimatePresence>
        {showTypePicker && (
          <SlideTypePicker
            onSelect={(newSlide) => {
              editor.addSlide(editor.selectedIndex, newSlide)
              setShowTypePicker(false)
            }}
            onClose={() => setShowTypePicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Preview wrapper — renders a full-size slide scaled to fit the preview area
 * using a simpler approach with a fixed container.
 */
function PreviewWrapper({ slide }: { slide: SlideConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current?.parentElement?.parentElement
    if (!container) return

    const updateScale = () => {
      const rect = container.getBoundingClientRect()
      const scaleX = rect.width / 1920
      const scaleY = rect.height / 1080
      setScale(Math.min(scaleX, scaleY))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="origin-top-left" style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}>
      <SlideRenderer slide={slide} />
    </div>
  )
}
