/**
 * Shared animation variants for slide templates
 *
 * Centralizes Framer Motion variants to ensure consistency
 * and reduce duplication across 29 slide templates.
 */
import type { Variants } from 'framer-motion'

// Shared easing curve used across all slide animations
export const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1]

// ─── Container variants ───────────────────────────────────────

/** Standard container — most content slides */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

/** Fast container — dense grids (feature-grid, gantt) */
export const containerFastVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

/** Slow container — hero/title/divider/closing slides */
export const containerSlowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

/** Progressive container — timeline L→R with wider stagger */
export const containerProgressiveVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

// ─── Item variants ────────────────────────────────────────────

/** Standard fade-up (y:20) — bullets, body text, default items */
export const itemFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_OUT,
    },
  },
}

/** Hero fade-up (y:30) — title slides, dividers, larger elements */
export const itemFadeUpHeroVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

/** Scale entrance (scale:0.9) — cards, stat blocks */
export const itemScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

/** Slide from left (x:-30) — steps, split-left items */
export const itemSlideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

/** Slide from right (x:30) — split-right items */
export const itemSlideRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

/** Pop entrance (scale:0) — timeline dots, emphasis points */
export const itemPopVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: EASE_OUT,
    },
  },
}

/** Blur + fade — quotes, atmospheric reveals */
export const itemBlurFadeVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: EASE_OUT,
    },
  },
}

/** Dramatic scale (scale:0.7) — big stat cards */
export const itemScaleCenterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

// ─── Card variants ────────────────────────────────────────────

/** Card fade-up (y:30) — TwoColumn, ThreeColumn cards */
export const cardFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
    },
  },
}

// ─── Specialty animations ─────────────────────────────────────

/** Red accent bar at top of slide — spread onto a motion.div */
export const accentBarAnimation = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

/** Horizontal line reveal (timeline connector) */
export const lineRevealVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut' as const,
    },
  },
}

/** Row slide-in (x:-20) — sparkline rows, table rows */
export const rowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: EASE_OUT,
    },
  },
}
