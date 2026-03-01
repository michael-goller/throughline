import {
  PenLine,
  Target,
  CheckCircle,
  Lightbulb,
  Rocket,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Globe,
  Lock,
  BarChart3,
} from 'lucide-react'
import type { SlideConfig } from './types'

/**
 * SLIDE DECK CONFIGURATION
 *
 * Edit this file to define your presentation content.
 * Each slide needs a unique 'id' and a 'type' that matches one of:
 *
 * - 'title': Red gradient background with title/subtitle/tagline
 * - 'title-digital': Title with neural network animation and terminal prompt
 * - 'steps': Dark background with numbered step cards (requires icons from lucide-react)
 * - 'two-column': 50/50 split layout with two content cards
 * - 'content': Single column with title, body text, and optional bullets
 * - 'divider': Full red background section divider with optional section number
 * - 'quote': Quote with author attribution (split or full variant)
 * - 'three-column': Three equal columns with icons
 * - 'stats': Statistics with animated count-up (2x2 or 1x4 layout)
 * - 'image-content': 50/50 split with image and content
 * - 'timeline': Horizontal timeline with alternating nodes (max 6 recommended)
 * - 'comparison': Before/After comparison with animated arrow
 * - 'gantt': Project Gantt chart (inline data or Mermaid file)
 * - 'matrix': 2x2 quadrant grid for prioritization, SWOT, risk
 * - 'org-chart': Hierarchical org chart with tree structure
 * - 'feature-grid': Feature comparison table with checkmarks
 * - 'fishbone': Fishbone diagram for root cause analysis
 * - 'force-field': Force field analysis (driving vs restraining forces)
 * - 'pricing': Pricing table with tiers
 * - 'icon-grid': Grid of icons with titles/descriptions (capabilities, values)
 * - 'qa': Large "Q+A" text on red background
 * - 'closing': Closing slide with logo, tagline, and social links
 *
 * Icons: Import from 'lucide-react' - see https://lucide.dev/icons
 */

export const slides: SlideConfig[] = [
  // Slide 1: Title (Digital variant with neural network)
  {
    id: 'intro',
    type: 'title-digital',
    title: 'Your Presentation Title',
    subtitle: 'A compelling subtitle goes here',
    tagline: 'Optional tagline or context',
  },

  // Slide 2: Title (Standard)
  {
    id: 'intro-standard',
    type: 'title',
    title: 'Standard Title Slide',
    subtitle: 'Without digital effects',
    tagline: 'For comparison',
  },

  // Slide 3: Steps/Agenda
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
  },

  // Slide 3: Section Divider
  {
    id: 'section-1',
    type: 'divider',
    title: 'Section One',
    subtitle: 'Getting Started',
    sectionNumber: 1,
  },

  // Slide 4: Content
  {
    id: 'content-example',
    type: 'content',
    title: 'Key Insights',
    subtitle: 'What we learned from the research',
    body: 'Our analysis revealed several important patterns that will shape our strategy moving forward.',
    bullets: [
      'Customer satisfaction increased by 23% after implementing the new workflow',
      'Response times dropped from 48 hours to under 4 hours',
      'Team productivity metrics show consistent improvement across all departments',
    ],
  },

  // Slide 5: Quote (split variant - default)
  {
    id: 'quote-split',
    type: 'quote',
    quote: 'The best way to predict the future is to create it.',
    author: 'Peter Drucker',
    authorTitle: 'Management Consultant & Author',
  },

  // Slide 6: Three Column
  {
    id: 'three-column-example',
    type: 'three-column',
    title: 'Our Approach',
    columns: [
      {
        icon: Lightbulb,
        title: 'Ideate',
        description: 'Generate innovative solutions through collaborative brainstorming and research.',
      },
      {
        icon: Rocket,
        title: 'Execute',
        description: 'Implement strategies with precision and agility to deliver results.',
      },
      {
        icon: TrendingUp,
        title: 'Measure',
        description: 'Track outcomes and iterate based on data-driven insights.',
      },
    ],
  },

  // Slide 7: Stats (2x2 layout)
  {
    id: 'stats-example',
    type: 'stats',
    title: 'Impact Metrics',
    layout: '2x2',
    stats: [
      { value: 95, suffix: '%', label: 'Customer Satisfaction' },
      { value: 2.5, suffix: 'M', label: 'Users Reached' },
      { value: 47, suffix: '%', label: 'Cost Reduction' },
      { value: 12, suffix: 'x', label: 'Faster Delivery' },
    ],
  },

  // Slide 8: Two Column
  {
    id: 'comparison',
    type: 'two-column',
    title: 'Key Points',
    subtitle: 'Optional subtitle',
    left: {
      number: 1,
      title: 'First Point',
      body: 'Detailed explanation of the first point goes here. Keep it concise but informative.',
      bullets: [
        'Supporting detail one',
        'Supporting detail two',
      ],
    },
    right: {
      number: 2,
      title: 'Second Point',
      body: 'Detailed explanation of the second point. This card does not have bullets.',
    },
  },

  // Slide 9: Image Content
  {
    id: 'image-content-example',
    type: 'image-content',
    title: 'Visual Example',
    body: 'Use this slide type when you need to pair an image with explanatory content.',
    bullets: [
      'Images can be external URLs (imageUrl)',
      'Or imported assets (imageSrc)',
      'Or a placeholder (imagePlaceholder: true)',
    ],
    imagePlaceholder: true,
    imagePosition: 'right',
  },

  // Slide 10: Timeline
  {
    id: 'timeline-example',
    type: 'timeline',
    title: 'Project Milestones',
    nodes: [
      { date: 'Q1', title: 'Discovery', description: 'Research & planning' },
      { date: 'Q2', title: 'Design', description: 'Prototyping phase' },
      { date: 'Q3', title: 'Build', description: 'Development sprint' },
      { date: 'Q4', title: 'Launch', description: 'Go to market' },
    ],
  },

  // Slide 11: Comparison (Before/After)
  {
    id: 'comparison-example',
    type: 'comparison',
    title: 'The Transformation',
    leftLabel: 'Before',
    rightLabel: 'After',
    leftItems: [
      'Manual processes everywhere',
      'Siloed teams and information',
      'Slow decision making',
      'Reactive problem solving',
    ],
    rightItems: [
      'Automated workflows',
      'Unified platform and data',
      'Real-time insights',
      'Proactive optimization',
    ],
  },

  // Slide 11b: Gantt Chart (Inline Data)
  {
    id: 'gantt-inline',
    type: 'gantt',
    title: 'Project Roadmap',
    dateFormat: 'month',
    tasks: [
      { name: 'Research', start: '2026-01-01', end: '2026-01-31', status: 'done', section: 'Discovery' },
      { name: 'Interviews', start: '2026-01-15', end: '2026-02-05', status: 'done', section: 'Discovery' },
      { name: 'Analysis', start: '2026-02-01', end: '2026-02-20', status: 'active', section: 'Discovery' },
      { name: 'Architecture', start: '2026-02-15', end: '2026-03-15', status: 'active', section: 'Development' },
      { name: 'MVP Build', start: '2026-03-01', end: '2026-04-30', section: 'Development' },
      { name: 'Testing', start: '2026-04-15', end: '2026-05-15', status: 'crit', section: 'Development' },
      { name: 'Beta Release', start: '2026-05-01', end: '2026-05-02', status: 'milestone', section: 'Launch' },
      { name: 'GA Release', start: '2026-06-01', end: '2026-06-02', status: 'milestone', section: 'Launch' },
    ],
  },

  // Slide 11c: Gantt Chart (From Mermaid File)
  {
    id: 'gantt-file',
    type: 'gantt',
    title: 'Supplier Enablement Roadmap',
    source: 'sample-project.md',
    dateFormat: 'quarter',
  },

  // Slide 12: Quote (full variant)
  {
    id: 'quote-full',
    type: 'quote',
    variant: 'full',
    quote: 'Innovation distinguishes between a leader and a follower.',
    author: 'Steve Jobs',
    authorTitle: 'Co-founder, Apple Inc.',
  },

  // Slide 13: Stats (1x4 layout)
  {
    id: 'stats-inline',
    type: 'stats',
    layout: '1x4',
    stats: [
      { value: 500, suffix: '+', label: 'Projects' },
      { value: 98, suffix: '%', label: 'On Time' },
      { value: 50, suffix: '+', label: 'Team Members' },
      { value: 24, suffix: '/7', label: 'Support' },
    ],
  },

  // Slide 14: Matrix/Quadrant (Eisenhower Priority Matrix)
  {
    id: 'matrix-example',
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
        { label: 'Busywork' },
      ],
      bottomRight: [
        { label: 'Interruptions', description: 'Delegate if possible' },
        { label: 'Some Emails' },
      ],
    },
  },

  // Slide 15: Org Chart
  {
    id: 'org-chart-example',
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
            { name: 'Lisa Chang', role: 'Finance' },
          ],
        },
      ],
    },
  },

  // Slide 16: Feature Grid (Comparison Table)
  {
    id: 'feature-grid-example',
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
      { feature: 'SLA Guarantee', values: [false, false, true] },
    ],
  },

  // Slide 17: Fishbone Diagram (Root Cause Analysis)
  {
    id: 'fishbone-example',
    type: 'fishbone',
    title: 'Root Cause Analysis',
    problem: 'Customer Churn',
    branches: [
      { category: 'Process', causes: ['Slow onboarding', 'Complex workflows'] },
      { category: 'People', causes: ['Training gaps', 'High turnover'] },
      { category: 'Technology', causes: ['System downtime', 'Poor UX'] },
      { category: 'Data', causes: ['Inaccurate reports', 'Missing metrics'] },
    ],
  },

  // Slide 18: Force Field Analysis
  {
    id: 'force-field-example',
    type: 'force-field',
    title: 'Change Analysis',
    subject: 'Cloud Migration',
    driving: [
      { label: 'Cost savings', strength: 3 },
      { label: 'Scalability', strength: 3 },
      { label: 'Modern tooling', strength: 2 },
      { label: 'Remote access', strength: 2 },
    ],
    restraining: [
      { label: 'Migration risk', strength: 2 },
      { label: 'Staff training', strength: 2 },
      { label: 'Security concerns', strength: 3 },
      { label: 'Vendor lock-in', strength: 1 },
    ],
  },

  // Slide 19: Pricing Table
  {
    id: 'pricing-example',
    type: 'pricing',
    title: 'Choose Your Plan',
    tiers: [
      {
        name: 'Starter',
        price: '$29',
        period: 'month',
        description: 'Perfect for small teams',
        features: ['5 team members', '10 GB storage', 'Email support', 'Basic analytics'],
        cta: 'Start Free Trial',
      },
      {
        name: 'Professional',
        price: '$79',
        period: 'month',
        description: 'For growing businesses',
        features: ['25 team members', '100 GB storage', 'Priority support', 'Advanced analytics', 'API access', 'Custom integrations'],
        cta: 'Get Started',
        highlight: true,
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations',
        features: ['Unlimited members', '1 TB storage', 'Dedicated support', 'Full analytics suite', 'Custom SLA', 'On-premise option'],
        cta: 'Contact Sales',
      },
    ],
  },

  // Slide 20: Icon Grid (Capabilities/Values)
  {
    id: 'icon-grid-example',
    type: 'icon-grid',
    title: 'Our Capabilities',
    columns: 3,
    items: [
      { icon: Shield, title: 'Security First', description: 'Enterprise-grade protection for your data' },
      { icon: Zap, title: 'Lightning Fast', description: 'Optimized performance at every level' },
      { icon: Users, title: 'Team Collaboration', description: 'Built for seamless teamwork' },
      { icon: Globe, title: 'Global Scale', description: 'Deploy anywhere in the world' },
      { icon: Lock, title: 'Compliance', description: 'SOC 2, GDPR, and HIPAA ready' },
      { icon: BarChart3, title: 'Analytics', description: 'Deep insights into your operations' },
    ],
  },

  // Slide 21: Q&A
  {
    id: 'qa',
    type: 'qa',
    subtitle: 'Let\'s discuss',
  },

  // Slide 22: Closing
  {
    id: 'closing',
    type: 'closing',
    tagline: 'Thank You',
    contactEmail: 'contact@example.com',
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com' },
      { platform: 'Twitter', url: 'https://twitter.com' },
      { platform: 'GitHub', url: 'https://github.com' },
    ],
  },
]

export default slides
