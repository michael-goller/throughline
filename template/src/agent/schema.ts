/**
 * JSON Schema definitions for Throughline slide deck configs.
 *
 * These schemas enable AI agents to generate valid slide configs
 * as structured JSON output. All icon fields accept Lucide icon
 * string names (e.g. "Target", "Users", "BarChart3").
 *
 * @see https://lucide.dev/icons for available icon names
 */

// ── Reusable sub-schemas ──────────────────────────────────────

const iconRef = {
  type: 'string' as const,
  description: 'Lucide icon name (PascalCase), e.g. "Target", "Users", "BarChart3". See https://lucide.dev/icons',
}

const stepItem = {
  type: 'object' as const,
  properties: {
    icon: iconRef,
    title: { type: 'string' as const },
    duration: { type: 'string' as const, description: 'e.g. "10 min"' },
    description: { type: 'string' as const },
  },
  required: ['icon', 'title', 'description'] as const,
  additionalProperties: false,
}

const columnCard = {
  type: 'object' as const,
  properties: {
    number: { type: ['string', 'number'] as const },
    icon: iconRef,
    title: { type: 'string' as const },
    body: { type: 'string' as const },
    bullets: { type: 'array' as const, items: { type: 'string' as const } },
  },
  required: ['title', 'body'] as const,
  additionalProperties: false,
}

const threeColumnItem = {
  type: 'object' as const,
  properties: {
    icon: iconRef,
    title: { type: 'string' as const },
    description: { type: 'string' as const },
  },
  required: ['icon', 'title', 'description'] as const,
  additionalProperties: false,
}

const statItem = {
  type: 'object' as const,
  properties: {
    value: { type: 'number' as const },
    label: { type: 'string' as const },
    suffix: { type: 'string' as const, description: 'e.g. "%", "M", "x"' },
    prefix: { type: 'string' as const, description: 'e.g. "$"' },
  },
  required: ['value', 'label'] as const,
  additionalProperties: false,
}

const timelineNode = {
  type: 'object' as const,
  properties: {
    date: { type: 'string' as const },
    title: { type: 'string' as const },
    description: { type: 'string' as const },
  },
  required: ['date', 'title'] as const,
  additionalProperties: false,
}

const socialLink = {
  type: 'object' as const,
  properties: {
    platform: { type: 'string' as const },
    url: { type: 'string' as const },
    icon: iconRef,
  },
  required: ['platform', 'url'] as const,
  additionalProperties: false,
}

const ganttTask = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const },
    start: { type: 'string' as const, description: 'ISO date YYYY-MM-DD' },
    end: { type: 'string' as const, description: 'ISO date YYYY-MM-DD' },
    progress: { type: 'number' as const, minimum: 0, maximum: 100 },
    section: { type: 'string' as const },
    status: { type: 'string' as const, enum: ['done', 'active', 'crit', 'milestone'] },
  },
  required: ['name', 'start', 'end'] as const,
  additionalProperties: false,
}

const matrixItem = {
  type: 'object' as const,
  properties: {
    label: { type: 'string' as const },
    description: { type: 'string' as const },
  },
  required: ['label'] as const,
  additionalProperties: false,
}

const orgNode: Record<string, unknown> = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const },
    role: { type: 'string' as const },
    children: { type: 'array' as const, items: { $ref: '#/$defs/orgNode' } },
  },
  required: ['name', 'role'] as const,
  additionalProperties: false,
}

const featureGridColumn = {
  type: 'object' as const,
  properties: {
    header: { type: 'string' as const },
    highlight: { type: 'boolean' as const },
  },
  required: ['header'] as const,
  additionalProperties: false,
}

const featureGridRow = {
  type: 'object' as const,
  properties: {
    feature: { type: 'string' as const },
    values: {
      type: 'array' as const,
      items: { type: ['boolean', 'string'] as const },
      description: 'true = checkmark, false = X, string = custom text',
    },
  },
  required: ['feature', 'values'] as const,
  additionalProperties: false,
}

const fishboneBranch = {
  type: 'object' as const,
  properties: {
    category: { type: 'string' as const },
    causes: { type: 'array' as const, items: { type: 'string' as const } },
  },
  required: ['category', 'causes'] as const,
  additionalProperties: false,
}

const forceItem = {
  type: 'object' as const,
  properties: {
    label: { type: 'string' as const },
    strength: { type: 'number' as const, enum: [1, 2, 3], description: '1=short, 2=medium, 3=long arrow' },
  },
  required: ['label', 'strength'] as const,
  additionalProperties: false,
}

const pricingTier = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const },
    price: { type: 'string' as const },
    period: { type: 'string' as const },
    description: { type: 'string' as const },
    features: { type: 'array' as const, items: { type: 'string' as const } },
    cta: { type: 'string' as const },
    highlight: { type: 'boolean' as const },
  },
  required: ['name', 'price', 'features'] as const,
  additionalProperties: false,
}

const iconGridItem = {
  type: 'object' as const,
  properties: {
    icon: iconRef,
    title: { type: 'string' as const },
    description: { type: 'string' as const },
    owner: { type: 'string' as const },
    deadline: { type: 'string' as const },
  },
  required: ['icon', 'title'] as const,
  additionalProperties: false,
}

const teamKR = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const },
    description: { type: 'string' as const },
  },
  required: ['title', 'description'] as const,
  additionalProperties: false,
}

const teamObjectiveGroup = {
  type: 'object' as const,
  properties: {
    icon: iconRef,
    objective: { type: 'string' as const },
    primary: { type: 'boolean' as const },
    keyResults: { type: 'array' as const, items: teamKR },
  },
  required: ['icon', 'objective', 'keyResults'] as const,
  additionalProperties: false,
}

const okrScoreItem = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const },
    description: { type: 'string' as const },
    owner: { type: 'string' as const },
    progress: {
      type: 'string' as const,
      enum: ['not-started', 'on-track', 'at-risk', 'behind', 'done'],
    },
  },
  required: ['title', 'owner', 'progress'] as const,
  additionalProperties: false,
}

const okrScoreObjective = {
  type: 'object' as const,
  properties: {
    icon: iconRef,
    objective: { type: 'string' as const },
    tagline: { type: 'string' as const },
    keyResults: { type: 'array' as const, items: okrScoreItem },
  },
  required: ['icon', 'objective', 'keyResults'] as const,
  additionalProperties: false,
}

const sparklineGridRow = {
  type: 'object' as const,
  properties: {
    label: { type: 'string' as const },
    values: {
      type: 'array' as const,
      items: { type: 'number' as const, enum: [0, 1, 2, 3] },
      description: '0=none, 1=low, 2=medium, 3=high',
    },
  },
  required: ['label', 'values'] as const,
  additionalProperties: false,
}

const barometerGridItem = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const },
    description: { type: 'string' as const },
    score: { type: 'number' as const },
    maxScore: { type: 'number' as const },
  },
  required: ['title', 'description', 'score', 'maxScore'] as const,
  additionalProperties: false,
}

// ── Per-slide-type schemas ────────────────────────────────────

const baseSlideProps = {
  id: { type: 'string' as const, description: 'Unique slide identifier (kebab-case recommended)' },
  notes: {
    oneOf: [
      { type: 'string' as const },
      { type: 'array' as const, items: { type: 'string' as const } },
    ],
    description: 'Speaker notes for this slide (shown in presenter view). Supports markdown. Use a string or array of strings.',
  },
}

const slideSchemas = {
  title: {
    type: 'object' as const,
    description: 'Red gradient background with title/subtitle/tagline',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'title' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      tagline: { type: 'string' as const },
    },
    required: ['id', 'type', 'title'],
    additionalProperties: false,
  },

  'title-digital': {
    type: 'object' as const,
    description: 'Title slide with neural network animation and terminal prompt',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'title-digital' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      tagline: { type: 'string' as const },
    },
    required: ['id', 'type', 'title'],
    additionalProperties: false,
  },

  content: {
    type: 'object' as const,
    description: 'Single column with title, body text, and optional bullets',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'content' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      body: { type: 'string' as const },
      bullets: { type: 'array' as const, items: { type: 'string' as const } },
    },
    required: ['id', 'type', 'title'],
    additionalProperties: false,
  },

  steps: {
    type: 'object' as const,
    description: 'Numbered step cards with icons — great for agendas or processes',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'steps' },
      title: { type: 'string' as const },
      steps: { type: 'array' as const, items: stepItem },
    },
    required: ['id', 'type', 'title', 'steps'],
    additionalProperties: false,
  },

  'two-column': {
    type: 'object' as const,
    description: '50/50 split layout with two content cards',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'two-column' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      left: columnCard,
      right: columnCard,
    },
    required: ['id', 'type', 'title', 'left', 'right'],
    additionalProperties: false,
  },

  'three-column': {
    type: 'object' as const,
    description: 'Three equal columns with icons — exactly 3 items required',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'three-column' },
      title: { type: 'string' as const },
      columns: {
        type: 'array' as const,
        items: threeColumnItem,
        minItems: 3,
        maxItems: 3,
      },
    },
    required: ['id', 'type', 'columns'],
    additionalProperties: false,
  },

  divider: {
    type: 'object' as const,
    description: 'Full red background section divider',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'divider' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      sectionNumber: { type: 'number' as const },
    },
    required: ['id', 'type', 'title'],
    additionalProperties: false,
  },

  quote: {
    type: 'object' as const,
    description: 'Quote with author attribution',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'quote' },
      quote: { type: 'string' as const },
      author: { type: 'string' as const },
      authorTitle: { type: 'string' as const },
      variant: { type: 'string' as const, enum: ['split', 'full'] },
    },
    required: ['id', 'type', 'quote', 'author'],
    additionalProperties: false,
  },

  stats: {
    type: 'object' as const,
    description: 'Statistics with animated count-up',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'stats' },
      title: { type: 'string' as const },
      stats: { type: 'array' as const, items: statItem },
      layout: { type: 'string' as const, enum: ['2x2', '1x4'] },
    },
    required: ['id', 'type', 'stats'],
    additionalProperties: false,
  },

  'image-content': {
    type: 'object' as const,
    description: '50/50 split with image and content',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'image-content' },
      title: { type: 'string' as const },
      body: { type: 'string' as const },
      bullets: { type: 'array' as const, items: { type: 'string' as const } },
      imageUrl: { type: 'string' as const, description: 'External image URL' },
      imageSrc: { type: 'string' as const, description: 'Local image path' },
      imagePlaceholder: { type: 'boolean' as const },
      imagePosition: { type: 'string' as const, enum: ['left', 'right'] },
    },
    required: ['id', 'type', 'title'],
    additionalProperties: false,
  },

  timeline: {
    type: 'object' as const,
    description: 'Horizontal timeline with alternating nodes (max 6 recommended)',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'timeline' },
      title: { type: 'string' as const },
      nodes: { type: 'array' as const, items: timelineNode },
    },
    required: ['id', 'type', 'nodes'],
    additionalProperties: false,
  },

  comparison: {
    type: 'object' as const,
    description: 'Before/After comparison with animated arrow',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'comparison' },
      title: { type: 'string' as const },
      leftLabel: { type: 'string' as const },
      rightLabel: { type: 'string' as const },
      leftItems: { type: 'array' as const, items: { type: 'string' as const } },
      rightItems: { type: 'array' as const, items: { type: 'string' as const } },
    },
    required: ['id', 'type', 'leftItems', 'rightItems'],
    additionalProperties: false,
  },

  qa: {
    type: 'object' as const,
    description: 'Large "Q+A" text on red background',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'qa' },
      text: { type: 'string' as const },
      subtitle: { type: 'string' as const },
    },
    required: ['id', 'type'],
    additionalProperties: false,
  },

  closing: {
    type: 'object' as const,
    description: 'Closing slide with tagline, contact info, social links',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'closing' },
      tagline: { type: 'string' as const },
      contactEmail: { type: 'string' as const },
      socialLinks: { type: 'array' as const, items: socialLink },
      logoSrc: { type: 'string' as const },
    },
    required: ['id', 'type'],
    additionalProperties: false,
  },

  gantt: {
    type: 'object' as const,
    description: 'Project Gantt chart with inline task data',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'gantt' },
      title: { type: 'string' as const },
      tasks: { type: 'array' as const, items: ganttTask },
      dateFormat: { type: 'string' as const, enum: ['month', 'quarter', 'week', 'relative-month'] },
    },
    required: ['id', 'type'],
    additionalProperties: false,
  },

  matrix: {
    type: 'object' as const,
    description: '2x2 quadrant grid for prioritization, SWOT, risk analysis',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'matrix' },
      title: { type: 'string' as const },
      xAxis: { type: 'string' as const, description: 'Label for horizontal axis' },
      yAxis: { type: 'string' as const, description: 'Label for vertical axis' },
      quadrants: {
        type: 'object' as const,
        properties: {
          topLeft: { type: 'array' as const, items: matrixItem },
          topRight: { type: 'array' as const, items: matrixItem },
          bottomLeft: { type: 'array' as const, items: matrixItem },
          bottomRight: { type: 'array' as const, items: matrixItem },
        },
        required: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
        additionalProperties: false,
      },
    },
    required: ['id', 'type', 'xAxis', 'yAxis', 'quadrants'],
    additionalProperties: false,
  },

  'org-chart': {
    type: 'object' as const,
    description: 'Hierarchical org chart with recursive tree structure',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'org-chart' },
      title: { type: 'string' as const },
      root: { $ref: '#/$defs/orgNode' },
    },
    required: ['id', 'type', 'root'],
    additionalProperties: false,
  },

  'feature-grid': {
    type: 'object' as const,
    description: 'Feature comparison table with checkmarks',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'feature-grid' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      columns: { type: 'array' as const, items: featureGridColumn },
      rows: { type: 'array' as const, items: featureGridRow },
    },
    required: ['id', 'type', 'columns', 'rows'],
    additionalProperties: false,
  },

  fishbone: {
    type: 'object' as const,
    description: 'Fishbone/Ishikawa diagram for root cause analysis',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'fishbone' },
      title: { type: 'string' as const },
      problem: { type: 'string' as const, description: 'The head of the fish' },
      branches: { type: 'array' as const, items: fishboneBranch },
    },
    required: ['id', 'type', 'problem', 'branches'],
    additionalProperties: false,
  },

  'force-field': {
    type: 'object' as const,
    description: 'Force field analysis for change management decisions',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'force-field' },
      title: { type: 'string' as const },
      subject: { type: 'string' as const, description: 'What is being changed' },
      driving: { type: 'array' as const, items: forceItem },
      restraining: { type: 'array' as const, items: forceItem },
    },
    required: ['id', 'type', 'subject', 'driving', 'restraining'],
    additionalProperties: false,
  },

  pricing: {
    type: 'object' as const,
    description: 'Pricing table with tiers, features, and CTAs',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'pricing' },
      title: { type: 'string' as const },
      tiers: { type: 'array' as const, items: pricingTier },
    },
    required: ['id', 'type', 'tiers'],
    additionalProperties: false,
  },

  'icon-grid': {
    type: 'object' as const,
    description: 'Grid of icons with titles/descriptions — capabilities, values, features. Supports optional owner, deadline per item, subtitle, and callout.',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'icon-grid' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      items: { type: 'array' as const, items: iconGridItem },
      columns: { type: 'number' as const, enum: [1, 2, 3, 4] },
      callout: { type: 'string' as const },
    },
    required: ['id', 'type', 'items'],
    additionalProperties: false,
  },

  'name-reveal': {
    type: 'object' as const,
    description: 'Animated name reveal — dissolves old name and reassembles as new',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'name-reveal' },
      fromText: { type: 'string' as const },
      toText: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      tagline: { type: 'string' as const },
    },
    required: ['id', 'type', 'fromText', 'toText'],
    additionalProperties: false,
  },

  image: {
    type: 'object' as const,
    description: 'Full-screen static image slide',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'image' },
      src: { type: 'string' as const },
      alt: { type: 'string' as const },
    },
    required: ['id', 'type', 'src'],
    additionalProperties: false,
  },

  'team-objectives': {
    type: 'object' as const,
    description: 'Team/function with objectives and key results',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'team-objectives' },
      teamName: { type: 'string' as const },
      teamIcon: iconRef,
      subtitle: { type: 'string' as const },
      objectives: { type: 'array' as const, items: teamObjectiveGroup },
    },
    required: ['id', 'type', 'teamName', 'teamIcon', 'objectives'],
    additionalProperties: false,
  },

  'operating-loop': {
    type: 'object' as const,
    description: 'Circular cadence view — operating loop diagram',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'operating-loop' },
      title: { type: 'string' as const },
      nodes: { type: 'array' as const, items: timelineNode },
    },
    required: ['id', 'type', 'nodes'],
    additionalProperties: false,
  },

  'okr-score': {
    type: 'object' as const,
    description: 'OKR scorecard — dense one-page view of objectives + KRs + status',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'okr-score' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      objectives: { type: 'array' as const, items: okrScoreObjective },
    },
    required: ['id', 'type', 'objectives'],
    additionalProperties: false,
  },

  'sparkline-grid': {
    type: 'object' as const,
    description: 'Resource intensity heatmap with bar visualization',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'sparkline-grid' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      phases: { type: 'array' as const, items: { type: 'string' as const } },
      rows: { type: 'array' as const, items: sparklineGridRow },
    },
    required: ['id', 'type', 'phases', 'rows'],
    additionalProperties: false,
  },

  'barometer-grid': {
    type: 'object' as const,
    description: 'Themed items with score barometer visualization',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'barometer-grid' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      items: { type: 'array' as const, items: barometerGridItem },
      columns: { type: 'number' as const, enum: [2, 3] },
    },
    required: ['id', 'type', 'items'],
    additionalProperties: false,
  },

  scorecard: {
    type: 'object' as const,
    description: 'Executive scorecard with RAG status strip, metrics table, confidence score, and decisions flag',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'scorecard' },
      title: { type: 'string' as const },
      headline: { type: 'string' as const, description: 'One-line summary of the period' },
      ragItems: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            label: { type: 'string' as const },
            status: { type: 'string' as const, enum: ['green', 'amber', 'red', 'not-started'] },
          },
          required: ['label', 'status'] as const,
          additionalProperties: false,
        },
        description: 'RAG status indicators (e.g. Overall, Schedule, Budget, Scope, Risk)',
      },
      metrics: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            label: { type: 'string' as const },
            actual: { type: 'string' as const },
            target: { type: 'string' as const },
            trend: { type: 'string' as const, enum: ['up', 'flat', 'down'] },
          },
          required: ['label', 'actual'] as const,
          additionalProperties: false,
        },
        description: 'Key metrics with actual vs target and trend arrows',
      },
      confidence: {
        type: 'object' as const,
        properties: {
          score: { type: 'number' as const },
          max: { type: 'number' as const, description: 'Default 10' },
        },
        required: ['score'] as const,
        additionalProperties: false,
      },
      decisionsNeeded: { type: 'boolean' as const },
      decisionsNote: { type: 'string' as const },
    },
    required: ['id', 'type', 'headline', 'ragItems', 'metrics'],
    additionalProperties: false,
  },

  'status-table': {
    type: 'object' as const,
    description: 'Table with per-row RAG status dots — workstream matrices, commitment trackers',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'status-table' },
      title: { type: 'string' as const },
      subtitle: { type: 'string' as const },
      columns: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            header: { type: 'string' as const },
            width: { type: 'string' as const, description: 'CSS grid width (e.g. "2fr", "120px")' },
          },
          required: ['header'] as const,
          additionalProperties: false,
        },
      },
      rows: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            cells: { type: 'array' as const, items: { type: 'string' as const } },
            status: { type: 'string' as const, enum: ['green', 'amber', 'red', 'not-started', 'done'] },
          },
          required: ['cells'] as const,
          additionalProperties: false,
        },
      },
      showStatusDot: { type: 'boolean' as const, description: 'Show RAG dot per row (default true)' },
      summary: { type: 'string' as const, description: 'Summary line below table' },
    },
    required: ['id', 'type', 'columns', 'rows'],
    additionalProperties: false,
  },

  'risk-card': {
    type: 'object' as const,
    description: 'Structured risk/issue cards with current state, root cause, impact, action, and path to green',
    properties: {
      ...baseSlideProps,
      type: { type: 'string' as const, const: 'risk-card' },
      title: { type: 'string' as const },
      risks: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            status: { type: 'string' as const, enum: ['amber', 'red'] },
            currentState: { type: 'string' as const },
            rootCause: { type: 'string' as const },
            businessImpact: { type: 'string' as const },
            action: { type: 'string' as const },
            pathToGreen: { type: 'string' as const },
          },
          required: ['title', 'status', 'currentState', 'rootCause', 'businessImpact', 'action'] as const,
          additionalProperties: false,
        },
        maxItems: 3,
        description: 'Max 2-3 risk cards per slide',
      },
    },
    required: ['id', 'type', 'risks'],
    additionalProperties: false,
  },
}

// ── Slide union schema (discriminated by "type") ──────────────

export const slideConfigSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'SlideConfig',
  description: 'A single Throughline slide configuration. The "type" field determines which properties are valid.',
  oneOf: Object.values(slideSchemas),
  $defs: { orgNode },
}

// ── Full deck schema ──────────────────────────────────────────

export const deckConfigSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'DeckConfig',
  description: 'A complete Throughline slide deck configuration',
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const, description: 'Deck title (for metadata / gallery display)' },
    description: { type: 'string' as const, description: 'Short description of the deck' },
    author: { type: 'string' as const },
    createdAt: { type: 'string' as const, description: 'ISO 8601 date' },
    throughline: {
      type: 'string' as const,
      description:
        'The "one claim" the deck is making — the single argument every slide must serve. Populated by `throughline shape` and validated by `throughline check`.',
    },
    slides: {
      type: 'array' as const,
      items: slideConfigSchema,
      minItems: 1,
      description: 'Ordered array of slides',
    },
  },
  required: ['title', 'slides'],
  additionalProperties: false,
  $defs: { orgNode },
}

// ── Export individual slide type schemas for tool use ──────────

export const slideTypeSchemas = slideSchemas

/** All valid slide type names */
export const slideTypes = Object.keys(slideSchemas) as Array<keyof typeof slideSchemas>
