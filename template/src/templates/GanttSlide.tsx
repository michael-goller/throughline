import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import type { GanttSlideConfig, GanttTask } from '../types'
import { ClassificationMark } from '../components'
import { useMermaidGantt } from '../hooks/useMermaidGantt'
import { containerFastVariants, itemFadeUpVariants, accentBarAnimation, EASE_OUT } from '../utils/animations'

const barVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

interface Props {
  slide: GanttSlideConfig
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

function formatDateLabel(date: Date, format: 'month' | 'quarter' | 'week' | 'relative-month', originDate?: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  switch (format) {
    case 'relative-month':
      if (originDate) {
        const monthDiff = (date.getFullYear() - originDate.getFullYear()) * 12 + (date.getMonth() - originDate.getMonth()) + 1
        return `Month ${monthDiff}`
      }
      return `${months[date.getMonth()]}`
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `Q${quarter} ${date.getFullYear()}`
    case 'week':
      return `${months[date.getMonth()]} ${date.getDate()}`
    case 'month':
    default:
      return `${months[date.getMonth()]} ${date.getFullYear()}`
  }
}

function getStatusColor(status?: GanttTask['status']): string {
  switch (status) {
    case 'done':
      return 'bg-accent-green'
    case 'active':
      return 'bg-brand-red'
    case 'crit':
      return 'bg-accent-orange'
    case 'milestone':
      return 'bg-accent-blue'
    default:
      return 'bg-text-secondary/60'
  }
}

const ROW_HEIGHT = 32
const SECTION_GAP = 18
const SECTION_HEADER_HEIGHT = 30

export default function GanttSlide({ slide }: Props) {
  // Load tasks from file if source is provided
  const { tasks: fileTasks, loading, error } = useMermaidGantt(slide.source)

  // Use inline tasks or file tasks
  const tasks = slide.tasks || fileTasks
  const dateFormat = slide.dateFormat || 'month'

  // Calculate timeline bounds and positions
  const { timeLabels, taskPositions, totalChartHeight, sectionLayout } = useMemo(() => {
    if (!tasks.length) {
      return { timeLabels: [], taskPositions: [], totalChartHeight: 0, sectionLayout: [] }
    }

    // Determine timeline bounds
    let min: Date
    let max: Date
    if (slide.viewWindowStart && slide.viewWindowEnd) {
      min = parseDate(slide.viewWindowStart)
      max = parseDate(slide.viewWindowEnd)
    } else {
      min = parseDate(tasks[0].start)
      max = parseDate(tasks[0].end)
      tasks.forEach(task => {
        const start = parseDate(task.start)
        const end = parseDate(task.end)
        if (start < min) min = start
        if (end > max) max = end
      })
      // Add padding to timeline (only when auto-computed)
      const paddingDays = 7
      min = new Date(min.getTime() - paddingDays * 24 * 60 * 60 * 1000)
      max = new Date(max.getTime() + paddingDays * 24 * 60 * 60 * 1000)
    }

    const totalMs = max.getTime() - min.getTime()

    // Generate time labels (snap to start of period)
    const labels: { label: string; position: number }[] = []
    const labelDate = new Date(min)
    labelDate.setDate(1)
    if (dateFormat === 'quarter') {
      labelDate.setMonth(Math.floor(labelDate.getMonth() / 3) * 3)
    }

    let originDate: Date | undefined = undefined

    while (labelDate <= max) {
      const position = ((labelDate.getTime() - min.getTime()) / totalMs) * 100
      if (position >= 0 && position <= 100) {
        if (dateFormat === 'relative-month' && !originDate) {
          originDate = new Date(labelDate)
        }
        labels.push({
          label: formatDateLabel(labelDate, dateFormat, originDate),
          position,
        })
      }

      switch (dateFormat) {
        case 'quarter':
          labelDate.setMonth(labelDate.getMonth() + 3)
          break
        case 'week':
          labelDate.setDate(labelDate.getDate() + 7)
          break
        case 'month':
        case 'relative-month':
        default:
          labelDate.setMonth(labelDate.getMonth() + 1)
      }
    }

    // Calculate task positions with clipping detection
    const positions = tasks.map(task => {
      const start = parseDate(task.start)
      const end = parseDate(task.end)
      const rawLeft = ((start.getTime() - min.getTime()) / totalMs) * 100
      const rawRight = ((end.getTime() - min.getTime()) / totalMs) * 100
      const clipLeft = rawLeft < 0
      const clipRight = rawRight > 100
      const left = Math.max(0, rawLeft)
      const right = Math.min(100, rawRight)
      const width = Math.max(0.5, right - left)
      return { left, width, clipLeft, clipRight, end }
    })

    // Group tasks by section and pre-compute Y offsets with section gaps
    const layout: {
      section?: string
      sectionTop?: number
      taskTops: number[]
      taskIndices: number[]
    }[] = []
    let cumulativeY = 0
    let currentGroup: { task: GanttTask; index: number }[] = []
    let currentSection: string | undefined = undefined

    const flush = (isFirst: boolean) => {
      if (currentGroup.length === 0 && !currentSection) return
      const group: typeof layout[number] = { section: currentSection, taskTops: [], taskIndices: [] }
      if (!isFirst) cumulativeY += SECTION_GAP
      if (currentSection) {
        group.sectionTop = cumulativeY
        cumulativeY += SECTION_HEADER_HEIGHT
      }
      currentGroup.forEach(({ index }) => {
        group.taskTops.push(cumulativeY)
        group.taskIndices.push(index)
        cumulativeY += ROW_HEIGHT
      })
      layout.push(group)
    }

    let isFirst = true
    tasks.forEach((task, index) => {
      if (task.section !== currentSection) {
        flush(isFirst)
        isFirst = layout.length === 0
        currentSection = task.section
        currentGroup = []
      }
      currentGroup.push({ task, index })
    })
    flush(isFirst)

    return {
      timeLabels: labels,
      taskPositions: positions,
      totalChartHeight: cumulativeY,
      sectionLayout: layout,
    }
  }, [tasks, dateFormat, slide.viewWindowStart, slide.viewWindowEnd])

  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-text-secondary text-body"
        >
          Loading Gantt chart...
        </motion.div>
        <ClassificationMark />
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-brand-red text-body"
        >
          Error: {error}
        </motion.div>
        <ClassificationMark />
      </div>
    )
  }

  const barHeight = 18
  const barOffset = (ROW_HEIGHT - barHeight) / 2

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* Red accent bar at top */}
      <motion.div
        {...accentBarAnimation}
        className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
      />

      <motion.div
        variants={containerFastVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-16 py-12 max-w-[1400px] w-full h-full flex flex-col"
      >
        {/* Title */}
        {slide.title && (
          <motion.h2
            variants={itemFadeUpVariants}
            className="font-display text-brand-red text-h2 md:text-h1 font-bold mb-8 text-center"
          >
            {slide.title}
          </motion.h2>
        )}

        {/* Gantt Chart Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-1 min-h-0">
            {/* Task Names Column */}
            <div className="w-56 flex-shrink-0 pr-4 relative" style={{ height: totalChartHeight + 40 }}>
              <div className="h-10" /> {/* Spacer for timeline header alignment */}
              {sectionLayout.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.section && group.sectionTop !== undefined && (
                    <motion.div
                      variants={itemFadeUpVariants}
                      className="absolute left-0 right-0 pr-4 flex items-center"
                      style={{ top: group.sectionTop + 40, height: SECTION_HEADER_HEIGHT }}
                    >
                      <span className="font-display text-brand-red text-caption font-bold uppercase tracking-wider">
                        {group.section}
                      </span>
                    </motion.div>
                  )}
                  {group.taskIndices.map((taskIndex, i) => (
                    <motion.div
                      key={i}
                      variants={itemFadeUpVariants}
                      className="absolute left-0 right-0 pr-4 pl-3 flex items-center text-text-primary text-body-sm truncate"
                      style={{ top: group.taskTops[i] + 40, height: ROW_HEIGHT }}
                    >
                      {tasks[taskIndex].name}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Timeline Header */}
              <div className="h-10 relative border-b border-border">
                {timeLabels.map((label, index) => (
                  <motion.span
                    key={index}
                    variants={itemFadeUpVariants}
                    className="absolute top-2 text-text-muted text-caption font-medium whitespace-nowrap -translate-x-1/2"
                    style={{ left: `${label.position}%` }}
                  >
                    {label.label}
                  </motion.span>
                ))}
              </div>

              {/* Bars Area */}
              <div className="relative" style={{ height: totalChartHeight }}>
                {/* Vertical grid lines */}
                {timeLabels.map((label, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-px bg-border opacity-30"
                    style={{ left: `${label.position}%` }}
                  />
                ))}

                {/* Section divider lines */}
                {sectionLayout.map((group, groupIndex) =>
                  group.sectionTop !== undefined && groupIndex > 0 ? (
                    <div
                      key={`sd-${groupIndex}`}
                      className="absolute left-0 right-0 h-px bg-border/60"
                      style={{ top: group.sectionTop - SECTION_GAP / 2 }}
                    />
                  ) : null
                )}

                {/* Task bars */}
                {sectionLayout.map((group, groupIndex) =>
                  group.taskIndices.map((taskIndex, i) => {
                    const pos = taskPositions[taskIndex]
                    const task = tasks[taskIndex]
                    if (!pos) return null
                    const top = group.taskTops[i] + barOffset

                    if (task.status === 'milestone') {
                      return (
                        <motion.div
                          key={`${groupIndex}-${i}`}
                          variants={barVariants}
                          className="absolute origin-left"
                          style={{
                            left: `${pos.left}%`,
                            top,
                            width: barHeight,
                            height: barHeight,
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-accent-blue rotate-45" />
                          </div>
                        </motion.div>
                      )
                    }

                    return (
                      <motion.div
                        key={`${groupIndex}-${i}`}
                        variants={barVariants}
                        className={`absolute rounded ${getStatusColor(task.status)} origin-left`}
                        style={{
                          left: `${pos.left}%`,
                          width: `${pos.width}%`,
                          top,
                          height: barHeight,
                        }}
                      >
                        {/* Right-edge continuation indicator */}
                        {pos.clipRight && !task.hideContinuation && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex items-center pl-1.5 whitespace-nowrap">
                            <ChevronRight className="w-3.5 h-3.5 text-text-muted" strokeWidth={3} />
                            <span className="text-tiny text-text-muted font-semibold ml-0.5">
                              {task.continuationLabel ?? formatDateLabel(pos.end, dateFormat)}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Legend — only show when multiple statuses are used */}
          {(() => {
            const usedStatuses = new Set(tasks.map(t => t.status))
            const hasMultiple = usedStatuses.size >= 2
            if (!hasMultiple) return null
            const showDone = usedStatuses.has('done')
            const showActive = usedStatuses.has('active')
            const showCrit = usedStatuses.has('crit')
            const showMilestone = usedStatuses.has('milestone')
            const hasContinuation = tasks.some((t, i) => {
              const p = taskPositions[i]
              return p?.clipRight && !t.hideContinuation
            })
            return (
              <motion.div
                variants={itemFadeUpVariants}
                className="flex justify-center gap-6 mt-6 pt-4 border-t border-border"
              >
                {showDone && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-accent-green" />
                    <span className="text-text-muted text-caption">Done</span>
                  </div>
                )}
                {showActive && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-brand-red" />
                    <span className="text-text-muted text-caption">Active</span>
                  </div>
                )}
                {showCrit && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-accent-orange" />
                    <span className="text-text-muted text-caption">Critical</span>
                  </div>
                )}
                {showMilestone && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rotate-45 bg-accent-blue" />
                    <span className="text-text-muted text-caption">Decision</span>
                  </div>
                )}
                {hasContinuation && (
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" strokeWidth={3} />
                    <span className="text-text-muted text-caption">Continues beyond window</span>
                  </div>
                )}
              </motion.div>
            )
          })()}
        </div>
      </motion.div>

      <ClassificationMark />
    </div>
  )
}
