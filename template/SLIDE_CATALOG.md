# Slide Catalog

Reference catalog for all available slide types. Copy examples into your `slides.config.ts`.

**Icons**: Import from `lucide-react` - see https://lucide.dev/icons

---

## title

Red gradient background with title, subtitle, and tagline.

```typescript
{
  id: 'intro',
  type: 'title',
  title: 'Your Presentation Title',
  subtitle: 'A compelling subtitle goes here',
  tagline: 'Optional tagline or context',
}
```

---

## title-digital

Title slide with neural network animation and terminal prompt effect.

```typescript
{
  id: 'intro-digital',
  type: 'title-digital',
  title: 'Your Presentation Title',
  subtitle: 'A compelling subtitle goes here',
  tagline: 'Optional tagline or context',
}
```

---

## content

Single column with title, body text, and optional bullets.

```typescript
{
  id: 'key-insights',
  type: 'content',
  title: 'Key Insights',
  subtitle: 'What we learned from the research',
  body: 'Our analysis revealed several important patterns.',
  bullets: [
    'First key finding with supporting data',
    'Second finding that builds on the first',
    'Third finding with actionable implications',
  ],
}
```

---

## two-column

50/50 split layout with two content cards.

```typescript
{
  id: 'comparison',
  type: 'two-column',
  title: 'Key Points',
  subtitle: 'Optional subtitle',
  left: {
    number: 1,
    title: 'First Point',
    body: 'Detailed explanation of the first point.',
    bullets: ['Supporting detail one', 'Supporting detail two'],
  },
  right: {
    number: 2,
    title: 'Second Point',
    body: 'Detailed explanation of the second point.',
  },
}
```

---

## three-column

Three equal columns with icons. Requires exactly 3 items.

```typescript
import { Lightbulb, Rocket, TrendingUp } from 'lucide-react'

{
  id: 'approach',
  type: 'three-column',
  title: 'Our Approach',
  columns: [
    {
      icon: Lightbulb,
      title: 'Ideate',
      description: 'Generate innovative solutions through collaborative brainstorming.',
    },
    {
      icon: Rocket,
      title: 'Execute',
      description: 'Implement strategies with precision and agility.',
    },
    {
      icon: TrendingUp,
      title: 'Measure',
      description: 'Track outcomes and iterate based on data-driven insights.',
    },
  ],
}
```

---

## steps

Numbered step cards with icons. Great for agendas or processes.

```typescript
import { Target, PenLine, CheckCircle } from 'lucide-react'

{
  id: 'agenda',
  type: 'steps',
  title: 'Agenda',
  steps: [
    {
      icon: Target,
      title: 'First Topic',
      duration: '10 min',
      description: 'Brief description of this section',
    },
    {
      icon: PenLine,
      title: 'Second Topic',
      duration: '15 min',
      description: 'What we will cover here',
    },
    {
      icon: CheckCircle,
      title: 'Wrap Up',
      duration: '5 min',
      description: 'Summary and next steps',
    },
  ],
}
```

---

## divider

Full red background section divider.

```typescript
{
  id: 'section-1',
  type: 'divider',
  title: 'Section One',
  subtitle: 'Getting Started',
  sectionNumber: 1,
}
```

---

## quote

Quote with author attribution. Two variants: `split` (default) or `full`.

```typescript
{
  id: 'inspiration',
  type: 'quote',
  quote: 'The best way to predict the future is to create it.',
  author: 'Peter Drucker',
  authorTitle: 'Management Consultant & Author',
  variant: 'split', // or 'full' for centered full-width
}
```

---

## stats

Statistics with animated count-up. Layout: `2x2` (default) or `1x4`.

```typescript
{
  id: 'metrics',
  type: 'stats',
  title: 'Impact Metrics',
  layout: '2x2',
  stats: [
    { value: 95, suffix: '%', label: 'Customer Satisfaction' },
    { value: 2.5, suffix: 'M', label: 'Users Reached' },
    { value: 47, suffix: '%', label: 'Cost Reduction' },
    { value: 12, suffix: 'x', label: 'Faster Delivery' },
  ],
}
```

---

## image-content

50/50 split with image and content.

```typescript
{
  id: 'visual-example',
  type: 'image-content',
  title: 'Visual Example',
  body: 'Use this slide when you need to pair an image with content.',
  bullets: [
    'Use imageUrl for external URLs',
    'Use imageSrc for imported assets',
    'Use imagePlaceholder: true for placeholder',
  ],
  imageUrl: 'https://example.com/image.jpg', // or imageSrc or imagePlaceholder
  imagePosition: 'right', // or 'left'
}
```

---

## timeline

Horizontal timeline with alternating nodes. Max 6 recommended.

```typescript
{
  id: 'milestones',
  type: 'timeline',
  title: 'Project Milestones',
  nodes: [
    { date: 'Q1', title: 'Discovery', description: 'Research & planning' },
    { date: 'Q2', title: 'Design', description: 'Prototyping phase' },
    { date: 'Q3', title: 'Build', description: 'Development sprint' },
    { date: 'Q4', title: 'Launch', description: 'Go to market' },
  ],
}
```

---

## comparison

Before/After comparison with animated arrow.

```typescript
{
  id: 'transformation',
  type: 'comparison',
  title: 'The Transformation',
  leftLabel: 'Before',
  rightLabel: 'After',
  leftItems: [
    'Manual processes everywhere',
    'Siloed teams and information',
    'Slow decision making',
  ],
  rightItems: [
    'Automated workflows',
    'Unified platform and data',
    'Real-time insights',
  ],
}
```

---

## gantt

Project Gantt chart. Supports inline data or Mermaid file import.

```typescript
// Option A: Inline data
{
  id: 'roadmap',
  type: 'gantt',
  title: 'Project Roadmap',
  dateFormat: 'month', // or 'quarter' or 'week'
  tasks: [
    { name: 'Research', start: '2026-01-01', end: '2026-01-31', status: 'done', section: 'Discovery' },
    { name: 'Analysis', start: '2026-02-01', end: '2026-02-20', status: 'active', section: 'Discovery' },
    { name: 'MVP Build', start: '2026-03-01', end: '2026-04-30', section: 'Development' },
    { name: 'Launch', start: '2026-06-01', end: '2026-06-02', status: 'milestone', section: 'Launch' },
  ],
}

// Option B: From Mermaid file (place in public/gantt/)
{
  id: 'roadmap-file',
  type: 'gantt',
  title: 'Project Roadmap',
  source: 'project-timeline.md',
  dateFormat: 'quarter',
}
```

**Task status options**: `done`, `active`, `crit`, `milestone`

---

## matrix

2x2 quadrant grid for prioritization, SWOT, risk analysis.

```typescript
{
  id: 'priority-matrix',
  type: 'matrix',
  title: 'Priority Matrix',
  xAxis: 'Urgency',
  yAxis: 'Impact',
  quadrants: {
    topLeft: [
      { label: 'Strategic Planning', description: 'Schedule for later' },
      { label: 'Relationship Building' },
    ],
    topRight: [
      { label: 'Critical Deadlines', description: 'Do immediately' },
      { label: 'Customer Escalations' },
    ],
    bottomLeft: [
      { label: 'Most Meetings', description: 'Eliminate or delegate' },
    ],
    bottomRight: [
      { label: 'Interruptions', description: 'Delegate if possible' },
    ],
  },
}
```

---

## org-chart

Hierarchical org chart with recursive tree structure.

```typescript
{
  id: 'team-structure',
  type: 'org-chart',
  title: 'Team Structure',
  root: {
    name: 'Sarah Chen',
    role: 'CEO',
    children: [
      {
        name: 'Michael Park',
        role: 'CTO',
        children: [
          { name: 'Emma Wilson', role: 'Engineering Lead' },
          { name: 'James Liu', role: 'Platform Lead' },
        ],
      },
      {
        name: 'Rachel Adams',
        role: 'COO',
        children: [
          { name: 'David Kim', role: 'Operations' },
        ],
      },
    ],
  },
}
```

---

## feature-grid

Comparison table with checkmarks. Great for plan comparisons.

```typescript
{
  id: 'plan-comparison',
  type: 'feature-grid',
  title: 'Plan Comparison',
  columns: [
    { header: 'Starter' },
    { header: 'Pro', highlight: true },
    { header: 'Enterprise' },
  ],
  rows: [
    { feature: 'Users', values: ['Up to 5', 'Up to 25', 'Unlimited'] },
    { feature: 'Storage', values: ['10 GB', '100 GB', '1 TB'] },
    { feature: 'API Access', values: [false, true, true] },
    { feature: 'Priority Support', values: [false, true, true] },
    { feature: 'Custom Integrations', values: [false, false, true] },
  ],
}
```

**Values**: `true` = checkmark, `false` = X, `string` = custom text

---

## fishbone

Fishbone/Ishikawa diagram for root cause analysis.

```typescript
{
  id: 'root-cause',
  type: 'fishbone',
  title: 'Root Cause Analysis',
  problem: 'Customer Churn',
  branches: [
    { category: 'Process', causes: ['Slow onboarding', 'Complex workflows'] },
    { category: 'People', causes: ['Training gaps', 'High turnover'] },
    { category: 'Technology', causes: ['System downtime', 'Poor UX'] },
    { category: 'Data', causes: ['Inaccurate reports', 'Missing metrics'] },
  ],
}
```

---

## force-field

Force field analysis for change management decisions.

```typescript
{
  id: 'change-analysis',
  type: 'force-field',
  title: 'Change Analysis',
  subject: 'Cloud Migration',
  driving: [
    { label: 'Cost savings', strength: 3 },
    { label: 'Scalability', strength: 3 },
    { label: 'Modern tooling', strength: 2 },
  ],
  restraining: [
    { label: 'Migration risk', strength: 2 },
    { label: 'Staff training', strength: 2 },
    { label: 'Security concerns', strength: 3 },
  ],
}
```

**Strength**: `1` (short arrow), `2` (medium), `3` (long arrow)

---

## pricing

Pricing table with tiers, features, and CTAs.

```typescript
{
  id: 'pricing',
  type: 'pricing',
  title: 'Choose Your Plan',
  tiers: [
    {
      name: 'Starter',
      price: '$29',
      period: 'month',
      description: 'Perfect for small teams',
      features: ['5 team members', '10 GB storage', 'Email support'],
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      price: '$79',
      period: 'month',
      description: 'For growing businesses',
      features: ['25 team members', '100 GB storage', 'Priority support', 'API access'],
      cta: 'Get Started',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: ['Unlimited members', '1 TB storage', 'Dedicated support'],
      cta: 'Contact Sales',
    },
  ],
}
```

---

## icon-grid

Grid of icons with titles and descriptions. Great for capabilities or values.

```typescript
import { Shield, Zap, Users, Globe, Lock, BarChart3 } from 'lucide-react'

{
  id: 'capabilities',
  type: 'icon-grid',
  title: 'Our Capabilities',
  columns: 3, // 2, 3, or 4
  items: [
    { icon: Shield, title: 'Security First', description: 'Enterprise-grade protection' },
    { icon: Zap, title: 'Lightning Fast', description: 'Optimized performance' },
    { icon: Users, title: 'Team Collaboration', description: 'Built for teamwork' },
    { icon: Globe, title: 'Global Scale', description: 'Deploy anywhere' },
    { icon: Lock, title: 'Compliance', description: 'SOC 2, GDPR ready' },
    { icon: BarChart3, title: 'Analytics', description: 'Deep insights' },
  ],
}
```

---

## qa

Large "Q+A" text on red background.

```typescript
{
  id: 'qa',
  type: 'qa',
  subtitle: "Let's discuss",
}
```

---

## closing

Closing slide with tagline, contact info, and social links.

```typescript
{
  id: 'closing',
  type: 'closing',
  tagline: 'Thank You',
  contactEmail: 'contact@example.com',
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://linkedin.com/company/example' },
    { platform: 'Twitter', url: 'https://twitter.com/example' },
    { platform: 'GitHub', url: 'https://github.com/example' },
  ],
}
```
