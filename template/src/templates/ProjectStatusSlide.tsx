import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle, Flag, Link2, CheckCircle2 } from 'lucide-react'
import type {
  ProjectStatusSlideConfig,
  ProjectRAG,
  ProjectPhase,
  ProjectChangeRow,
  ProjectImpactBlock,
  ProjectNextStep,
} from '../types'
import { ClassificationMark, SlideBackground } from '../components'
import {
  containerFastVariants,
  itemFadeUpVariants,
  rowVariants,
  accentBarAnimation,
} from '../utils/animations'

const RAG_COLORS: Record<ProjectRAG, { bg: string; ring: string; dot: string; label: string }> = {
  green: {
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/40',
    dot: '#22c55e',
    label: 'On track',
  },
  amber: {
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/40',
    dot: '#eab308',
    label: 'At risk',
  },
  red: {
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/40',
    dot: '#ef4444',
    label: 'Blocked',
  },
}

const PHASE_ORDER: ProjectPhase[] = ['Diagnose', 'Decide', 'Execute', 'Stabilize']

function StatusChip({ status }: { status: ProjectRAG }) {
  const c = RAG_COLORS[status]
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${c.bg} ${c.ring}`}
    >
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: c.dot }}
      />
      <span className="text-tiny font-semibold uppercase tracking-wider text-text-primary">
        {c.label}
      </span>
    </div>
  )
}

function PhaseChip({ phase }: { phase: ProjectPhase }) {
  const activeIndex = PHASE_ORDER.indexOf(phase)
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-elevated ring-1 ring-border">
      <div className="flex items-center gap-1">
        {PHASE_ORDER.map((p, i) => (
          <div
            key={p}
            className={`h-1.5 rounded-full transition-all ${
              i <= activeIndex ? 'bg-brand-red w-3' : 'bg-border w-1.5'
            }`}
            title={p}
          />
        ))}
      </div>
      <span className="text-tiny font-semibold uppercase tracking-wider text-text-primary">
        {phase}
      </span>
    </div>
  )
}

function TargetChip({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-elevated ring-1 ring-border">
      <span className="text-tiny font-medium uppercase tracking-wider text-text-muted">
        Target
      </span>
      <span className="text-tiny font-semibold text-text-primary">{date}</span>
    </div>
  )
}

function ChangeRow({ row }: { row: ProjectChangeRow }) {
  return (
    <motion.div
      variants={rowVariants}
      className="grid grid-cols-[110px_1fr_24px_1fr] items-start gap-3 py-2.5 border-b border-border/40 last:border-b-0"
    >
      <div className="text-tiny font-semibold uppercase tracking-wider text-text-muted pt-0.5">
        {row.label}
      </div>
      <div className="text-caption text-text-secondary leading-snug">
        {row.today}
      </div>
      <div className="flex items-center justify-center pt-0.5">
        <ArrowRight size={14} className="text-brand-red" />
      </div>
      <div className="text-caption text-text-primary leading-snug font-medium">
        {row.tomorrow}
      </div>
    </motion.div>
  )
}

function ImpactBlock({ block }: { block: ProjectImpactBlock }) {
  return (
    <motion.div variants={itemFadeUpVariants} className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-shrink-0 w-3 bg-brand-red" />
        <h4 className="text-tiny font-bold uppercase tracking-wider text-brand-red">
          {block.heading}
        </h4>
      </div>
      <ul className="space-y-1 pl-5">
        {block.bullets.map((b, i) => (
          <li
            key={i}
            className="text-caption text-text-secondary leading-snug relative before:content-['•'] before:absolute before:-left-3 before:text-text-muted"
          >
            {b}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function NextStepRow({
  step,
  showPill,
  isLastOfGroup,
}: {
  step: ProjectNextStep
  showPill: boolean
  isLastOfGroup: boolean
}) {
  return (
    <motion.div
      variants={rowVariants}
      className={`grid grid-cols-[56px_1fr_auto] items-start gap-3 py-1.5 ${
        isLastOfGroup ? 'border-b border-border/40 last:border-b-0 pb-2' : ''
      }`}
    >
      <div className="flex items-center justify-center pt-0.5">
        {showPill ? (
          <span className="text-tiny font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded">
            {step.horizon}
          </span>
        ) : null}
      </div>
      <div className="text-caption text-text-primary leading-snug">
        {step.action}
      </div>
      <div className="text-tiny text-text-muted whitespace-nowrap pt-1">
        {[step.owner, step.by].filter(Boolean).join(' · ')}
      </div>
    </motion.div>
  )
}

interface Props {
  slide: ProjectStatusSlideConfig
}

export default function ProjectStatusSlide({ slide }: Props) {
  const {
    title,
    thesis,
    status,
    phase,
    targetDate,
    changeRows,
    impact,
    confidence,
    confidenceReason,
    statusNotes,
    topRisks,
    decisionNeeded,
    decisionOwner,
    decisionBy,
    nextSteps,
    dependencies,
  } = slide

  return (
    <SlideBackground variant="gradient-subtle">
      <div className="relative w-full h-full flex flex-col">
        {/* Red accent bar at top */}
        <motion.div
          {...accentBarAnimation}
          className="absolute top-0 left-0 right-0 h-1 bg-brand-red origin-left z-10"
        />

        <motion.div
          variants={containerFastVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex-1 flex flex-col px-12 py-10 max-w-[1280px] w-full mx-auto"
        >
          {/* ─── Header ─────────────────────────────────────────── */}
          <motion.div
            variants={itemFadeUpVariants}
            className="flex items-start justify-between gap-6 mb-3"
          >
            <div className="min-w-0">
              <h2 className="font-display text-brand-red text-h2 font-bold leading-tight">
                {title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-2">
              <StatusChip status={status} />
              <PhaseChip phase={phase} />
              <TargetChip date={targetDate} />
            </div>
          </motion.div>
          <motion.p
            variants={itemFadeUpVariants}
            className="text-text-secondary text-body leading-relaxed mb-8 pr-32"
          >
            {thesis}
          </motion.p>

          {/* ─── Body: Change | Impact ─────────────────────────── */}
          <motion.div
            variants={itemFadeUpVariants}
            className="grid grid-cols-[1.35fr_1fr] gap-5 items-start"
          >
            {/* The Change */}
            <div className="rounded-2xl border border-border bg-background-elevated/50 shadow-lg shadow-black/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-background-accent/40 flex items-center justify-between">
                <h3 className="font-display font-semibold text-caption uppercase tracking-wider text-text-primary">
                  The Change
                </h3>
                <div className="grid grid-cols-[1fr_24px_1fr] gap-3 text-tiny font-medium uppercase tracking-wider text-text-muted w-[60%]">
                  <span className="text-center">Today</span>
                  <span />
                  <span className="text-center text-brand-red">Tomorrow</span>
                </div>
              </div>
              <div className="px-5 py-3">
                {changeRows.map((row, i) => (
                  <ChangeRow key={i} row={row} />
                ))}
              </div>
            </div>

            {/* Impact */}
            <div className="rounded-2xl border border-border bg-background-elevated/50 shadow-lg shadow-black/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-background-accent/40">
                <h3 className="font-display font-semibold text-caption uppercase tracking-wider text-text-primary">
                  Impact
                </h3>
              </div>
              <div className="px-5 py-4 space-y-4">
                {impact.map((b, i) => (
                  <ImpactBlock key={i} block={b} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── Footer: Status | Next 90 days ─────────────────── */}
          <motion.div
            variants={itemFadeUpVariants}
            className="grid grid-cols-2 gap-5 mt-7"
          >
            {/* Status */}
            <div className="rounded-2xl border border-border bg-background-elevated/50 shadow-lg shadow-black/10 overflow-hidden">
              <div className="px-5 py-2.5 border-b border-border bg-background-accent/40 flex items-center justify-between">
                <h3 className="font-display font-semibold text-caption uppercase tracking-wider text-text-primary">
                  Status
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-tiny text-text-muted uppercase tracking-wider">
                    Confidence
                  </span>
                  <span className="text-tiny font-bold text-brand-red">
                    {confidence}
                  </span>
                  {confidenceReason && (
                    <span className="text-tiny text-text-muted">
                      — {confidenceReason}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 space-y-2.5">
                {statusNotes && statusNotes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      <span className="text-tiny font-bold uppercase tracking-wider text-text-muted">
                        Highlights
                      </span>
                    </div>
                    <ul className="space-y-0.5 pl-4">
                      {statusNotes.slice(0, 3).map((n, i) => (
                        <li
                          key={i}
                          className="text-caption text-text-secondary leading-snug relative before:content-['•'] before:absolute before:-left-3 before:text-text-muted"
                        >
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {topRisks.length > 0 && (
                  <div className={statusNotes && statusNotes.length > 0 ? 'pt-2 border-t border-border/40' : ''}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={11} className="text-amber-500" />
                      <span className="text-tiny font-bold uppercase tracking-wider text-text-muted">
                        Top risks
                      </span>
                    </div>
                    <ul className="space-y-0.5 pl-4">
                      {topRisks.slice(0, 3).map((r, i) => (
                        <li
                          key={i}
                          className="text-caption text-text-secondary leading-snug relative before:content-['•'] before:absolute before:-left-3 before:text-text-muted"
                        >
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {decisionNeeded && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flag size={11} className="text-brand-red" />
                      <span className="text-tiny font-bold uppercase tracking-wider text-brand-red">
                        Decision needed
                      </span>
                    </div>
                    <p className="text-caption text-text-primary leading-snug font-medium">
                      {decisionNeeded}
                    </p>
                    {(decisionOwner || decisionBy) && (
                      <p className="text-tiny text-text-muted mt-0.5">
                        {[decisionOwner, decisionBy].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Next 90 days */}
            <div className="rounded-2xl border border-border bg-background-elevated/50 shadow-lg shadow-black/10 overflow-hidden">
              <div className="px-5 py-2.5 border-b border-border bg-background-accent/40">
                <h3 className="font-display font-semibold text-caption uppercase tracking-wider text-text-primary">
                  Next 90 days
                </h3>
              </div>
              <div className="px-5 py-2">
                {nextSteps.map((step, i) => {
                  const showPill = i === 0 || nextSteps[i - 1].horizon !== step.horizon
                  const isLastOfGroup =
                    i === nextSteps.length - 1 || nextSteps[i + 1].horizon !== step.horizon
                  return (
                    <NextStepRow
                      key={i}
                      step={step}
                      showPill={showPill}
                      isLastOfGroup={isLastOfGroup}
                    />
                  )
                })}
                {dependencies && (
                  <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-border/40">
                    <Link2 size={11} className="text-text-muted" />
                    <span className="text-tiny font-semibold uppercase tracking-wider text-text-muted">
                      Depends on:
                    </span>
                    <span className="text-tiny text-text-secondary">
                      {dependencies}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <ClassificationMark />
      </div>
    </SlideBackground>
  )
}
