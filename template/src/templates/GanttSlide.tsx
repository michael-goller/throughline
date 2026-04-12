import { motion } from 'framer-motion'
import { useMemo } from 'react'
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
      return 'bg-text-secondary'
  }
}

export default function GanttSlide({ slide }: Props) {
  // Load tasks from file if source is provided
  const { tasks: fileTasks, loading, error } = useMermaidGantt(slide.source)

  // Use inline tasks or file tasks
  const tasks = slide.tasks || fileTasks
  const dateFormat = slide.dateFormat || 'month'

  // Calculate timeline bounds and positions
  const { timeLabels, taskPositions } = useMemo(() => {
    if (!tasks.length) {
      return { timeLabels: [], taskPositions: [] }
    }

    let min = parseDate(tasks[0].start)
    let max = parseDate(tasks[0].end)

    tasks.forEach(task => {
      const start = parseDate(task.start)
      const end = parseDate(task.end)
      if (start < min) min = start
      if (end > max) max = end
    })

    // Add padding to timeline
    const paddingDays = 7
    min = new Date(min.getTime() - paddingDays * 24 * 60 * 60 * 1000)
    max = new Date(max.getTime() + paddingDays * 24 * 60 * 60 * 1000)

    const totalMs = max.getTime() - min.getTime()

    // Generate time labels
    const labels: { label: string; position: number }[] = []
    const labelDate = new Date(min)

    // Round to start of month
    labelDate.setDate(1)
    if (dateFormat === 'quarter') {
      labelDate.setMonth(Math.floor(labelDate.getMonth() / 3) * 3)
    }

    // For relative-month, track the origin as the first visible label
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

      // Increment based on format
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

    // Calculate task positions
    const positions = tasks.map(task => {
      const start = parseDate(task.start)
      const end = parseDate(task.end)
      const left = ((start.getTime() - min.getTime()) / totalMs) * 100
      const width = ((end.getTime() - start.getTime()) / totalMs) * 100
      return { left, width }
    })

    return { timeLabels: labels, taskPositions: positions }
  }, [tasks, dateFormat])

  // Group tasks by section
  const groupedTasks = useMemo(() => {
    const groups: { section: string | undefined; tasks: { task: GanttTask; index: number }[] }[] = []
    let currentSection: string | undefined
    let currentGroup: { task: GanttTask; index: number }[] = []

    tasks.forEach((task, index) => {
      if (task.section !== currentSection) {
        if (currentGroup.length > 0) {
          groups.push({ section: currentSection, tasks: currentGroup })
        }
        currentSection = task.section
        currentGroup = []
      }
      currentGroup.push({ task, index })
    })

    if (currentGroup.length > 0) {
      groups.push({ section: currentSection, tasks: currentGroup })
    }

    return groups
  }, [tasks])

  // Calculate dynamic row height based on task count
  const totalRows = useMemo(() => {
    return groupedTasks.reduce((acc, g) => acc + g.tasks.length + (g.section ? 1 : 0), 0)
  }, [groupedTasks])

  // Scale row height: 40px for few tasks, down to 28px for many
  const rowHeight = Math.max(28, Math.min(40, 400 / Math.max(totalRows, 1)))
  const barHeight = Math.max(16, rowHeight - 14)

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

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* Red accent bar at top */}
      <motion.div
        {...accentBarAnimation}
        className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left"
      />

      {/* Content */}
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
          {/* Chart Area */}
          <div className="flex flex-1 min-h-0">
            {/* Task Names Column */}
            <div className="w-48 flex-shrink-0 pr-4">
              <div className="h-8" /> {/* Spacer for alignment with timeline header */}
              {groupedTasks.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.section && (
                    <motion.div
                      variants={itemFadeUpVariants}
                      className="text-text-secondary text-caption font-semibold uppercase tracking-wide border-t border-border mt-1 first:mt-0 first:border-t-0 flex items-center"
                      style={{ height: rowHeight }}
                    >
                      {group.section}
                    </motion.div>
                  )}
                  {group.tasks.map(({ task }, taskIndex) => (
                    <motion.div
                      key={taskIndex}
                      variants={itemFadeUpVariants}
                      className="flex items-center text-text-primary text-body-sm truncate"
                      style={{ height: rowHeight }}
                    >
                      {task.name}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Timeline Header */}
              <div className="h-8 relative border-b border-border">
                {timeLabels.map((label, index) => (
                  <motion.span
                    key={index}
                    variants={itemFadeUpVariants}
                    className="absolute text-text-muted text-caption whitespace-nowrap -translate-x-1/2"
                    style={{ left: `${label.position}%` }}
                  >
                    {label.label}
                  </motion.span>
                ))}
              </div>

              {/* Bars Area */}
              <div className="flex-1 relative">
                {/* Grid lines */}
                {timeLabels.map((label, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-px bg-border opacity-30"
                    style={{ left: `${label.position}%` }}
                  />
                ))}

                {/* Task bars */}
                {groupedTasks.map((group, groupIndex) => {
                  let rowOffset = groupedTasks
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.tasks.length + (g.section ? 1 : 0), 0)
                  if (group.section) rowOffset += 1

                  return group.tasks.map(({ task, index: taskIndex }, localIndex) => {
                    const pos = taskPositions[taskIndex]
                    if (!pos) return null

                    const rowTop = (rowOffset + localIndex) * rowHeight + (group.section ? 8 : 0)
                    const barOffset = (rowHeight - barHeight) / 2

                    return (
                      <motion.div
                        key={`${groupIndex}-${localIndex}`}
                        variants={barVariants}
                        className={`absolute rounded ${getStatusColor(task.status)} origin-left`}
                        style={{
                          left: `${pos.left}%`,
                          width: `${Math.max(pos.width, 1)}%`,
                          top: rowTop + barOffset,
                          height: barHeight,
                        }}
                      >
                        {/* Progress indicator */}
                        {task.progress !== undefined && task.progress < 100 && (
                          <div
                            className="absolute inset-0 bg-black/30 rounded"
                            style={{ left: `${task.progress}%` }}
                          />
                        )}

                        {/* Milestone diamond */}
                        {task.status === 'milestone' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-accent-blue rotate-45" />
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                })}
              </div>
            </div>
          </div>

          {/* Legend — only show when multiple statuses are used */}
          {(() => {
            const usedStatuses = new Set(tasks.map(t => t.status).filter(Boolean))
            if (usedStatuses.size < 2) return null
            return (
              <motion.div
                variants={itemFadeUpVariants}
                className="flex justify-center gap-6 mt-6 pt-4 border-t border-border"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded bg-accent-green" />
                  <span className="text-text-muted text-caption">Done</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded bg-brand-red" />
                  <span className="text-text-muted text-caption">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded bg-accent-orange" />
                  <span className="text-text-muted text-caption">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rotate-45 bg-accent-blue" />
                  <span className="text-text-muted text-caption">Milestone</span>
                </div>
              </motion.div>
            )
          })()}
        </div>
      </motion.div>

      {/* Classification mark */}
      <ClassificationMark />
    </div>
  )
}
