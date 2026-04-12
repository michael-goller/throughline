/**
 * Template Library for Common Deck Archetypes
 *
 * Pre-built deck templates with metadata, suggested structure, and
 * intent-matching for agent-driven recommendations.
 *
 * Each template provides:
 * - Full deck JSON (slides, theme, metadata)
 * - Category and tags for browsing
 * - Intent keywords for agent matching
 * - Customization hints
 */

import type { SlideConfig } from '../types'

// ── Types ────────────────────────────────────────────────────

export interface DeckTemplate {
  /** Unique template identifier */
  id: string
  /** Display name */
  name: string
  /** Short description */
  description: string
  /** Template category */
  category: TemplateCategory
  /** Searchable tags */
  tags: string[]
  /** Keywords that indicate user intent matches this template */
  intentKeywords: string[]
  /** Estimated presentation duration in minutes */
  estimatedMinutes: number
  /** Number of slides */
  slideCount: number
  /** Which placeholders to customize (field paths) */
  customizationHints: string[]
  /** Preview: first 2-3 slide summaries for browsing */
  preview: { type: string; title: string }[]
  /** Full slide array ready to use as a deck */
  slides: SlideConfig[]
}

export type TemplateCategory =
  | 'business-review'
  | 'project'
  | 'strategy'
  | 'team'
  | 'communication'

export interface TemplateMatch {
  template: DeckTemplate
  /** Confidence score 0-1 */
  score: number
  /** Which keywords matched */
  matchedKeywords: string[]
}

// ── Template Definitions ─────────────────────────────────────

const qbrTemplate: DeckTemplate = {
  id: 'qbr',
  name: 'Quarterly Business Review',
  description: 'Quarterly metrics, achievements, challenges, and forward plan. Designed for executive audiences.',
  category: 'business-review',
  tags: ['quarterly', 'review', 'metrics', 'executive', 'qbr', 'business'],
  intentKeywords: [
    'quarterly', 'qbr', 'quarter review', 'business review',
    'q1', 'q2', 'q3', 'q4', 'quarterly update', 'quarterly report',
    'revenue review', 'performance review',
  ],
  estimatedMinutes: 30,
  slideCount: 14,
  customizationHints: [
    'title.subtitle (team/org name)',
    'title.tagline (quarter and date range)',
    'stats slides (metrics values)',
    'content slides (achievements, challenges)',
    'timeline (next quarter milestones)',
  ],
  preview: [
    { type: 'title', title: 'Q1 2026 Business Review' },
    { type: 'steps', title: 'Agenda' },
    { type: 'stats', title: 'Key Metrics' },
  ],
  slides: [
    {
      id: 'title',
      type: 'title',
      title: 'Q1 2026 Business Review',
      subtitle: '[Team / Organization Name]',
      tagline: 'Jan – Mar 2026',
    },
    {
      id: 'agenda',
      type: 'steps',
      title: 'Agenda',
      steps: [
        { icon: 'BarChart3', title: 'Key Metrics', description: 'Revenue, growth, and operational KPIs', duration: '5 min' },
        { icon: 'Trophy', title: 'Achievements', description: 'Top wins this quarter', duration: '5 min' },
        { icon: 'AlertTriangle', title: 'Challenges', description: 'Risks and issues to address', duration: '5 min' },
        { icon: 'Target', title: 'Next Quarter', description: 'Priorities and milestones ahead', duration: '10 min' },
        { icon: 'MessageSquare', title: 'Discussion', description: 'Open floor for questions', duration: '5 min' },
      ],
    },
    {
      id: 'divider-metrics',
      type: 'divider',
      title: 'Key Metrics',
      sectionNumber: 1,
    },
    {
      id: 'metrics-overview',
      type: 'stats',
      title: 'Quarter at a Glance',
      layout: '2x2' as const,
      stats: [
        { value: 2.4, suffix: 'M', label: 'Revenue', prefix: '$' },
        { value: 18, suffix: '%', label: 'YoY Growth' },
        { value: 94, suffix: '%', label: 'Customer Retention' },
        { value: 42, label: 'New Customers' },
      ],
    },
    {
      id: 'metrics-detail',
      type: 'feature-grid',
      title: 'Performance vs. Targets',
      columns: [
        { header: 'Metric' },
        { header: 'Actual' },
        { header: 'Target' },
        { header: 'Status' },
      ],
      rows: [
        { feature: 'Revenue', values: ['$2.4M', '$2.2M', '🟢 +9%'] },
        { feature: 'New Customers', values: ['42', '35', '🟢 +20%'] },
        { feature: 'Churn Rate', values: ['6%', '5%', '🟡 +1pp'] },
        { feature: 'NPS Score', values: ['72', '70', '🟢 +2'] },
        { feature: 'Avg Deal Size', values: ['$57K', '$55K', '🟢 +4%'] },
      ],
    },
    {
      id: 'divider-achievements',
      type: 'divider',
      title: 'Achievements',
      sectionNumber: 2,
    },
    {
      id: 'achievements',
      type: 'icon-grid',
      title: 'Top Wins This Quarter',
      columns: 3,
      items: [
        { icon: 'Rocket', title: 'Product Launch', description: 'Shipped v2.0 with 15 new features on schedule' },
        { icon: 'Handshake', title: 'Enterprise Deal', description: 'Closed $500K annual contract with Acme Corp' },
        { icon: 'Users', title: 'Team Growth', description: 'Hired 8 engineers, fully staffed all teams' },
        { icon: 'TrendingUp', title: 'Market Expansion', description: 'Entered APAC market with 3 pilot customers' },
        { icon: 'Shield', title: 'SOC 2 Certified', description: 'Achieved Type II compliance ahead of schedule' },
        { icon: 'Zap', title: 'Performance', description: 'Reduced API latency by 40% via infrastructure upgrade' },
      ],
    },
    {
      id: 'divider-challenges',
      type: 'divider',
      title: 'Challenges & Risks',
      sectionNumber: 3,
    },
    {
      id: 'challenges',
      type: 'two-column',
      title: 'Key Challenges',
      left: {
        number: 1,
        icon: 'AlertTriangle',
        title: 'Churn Increase',
        body: 'Churn rate rose to 6% from 4.5% last quarter.',
        bullets: [
          'Mid-market segment most affected',
          'Root cause: onboarding friction',
          'Mitigation: new onboarding flow in Q2',
        ],
      },
      right: {
        number: 2,
        icon: 'Clock',
        title: 'Hiring Delays',
        body: 'Data engineering hires behind by 6 weeks.',
        bullets: [
          'Pipeline strong but closing slow',
          'Competing with FAANG offers',
          'Action: adjusted comp bands for Q2',
        ],
      },
    },
    {
      id: 'risk-matrix',
      type: 'matrix',
      title: 'Risk Assessment',
      axisX: { low: 'Low Impact', high: 'High Impact' },
      axisY: { low: 'Low Likelihood', high: 'High Likelihood' },
      items: [
        { label: 'Churn spike', x: 0.7, y: 0.6, color: '#eab308' },
        { label: 'Key person risk', x: 0.5, y: 0.3, color: '#eab308' },
        { label: 'Competitor launch', x: 0.8, y: 0.4, color: '#ef4444' },
        { label: 'Regulation change', x: 0.6, y: 0.2, color: '#22c55e' },
      ],
    },
    {
      id: 'divider-next',
      type: 'divider',
      title: 'Next Quarter',
      sectionNumber: 4,
    },
    {
      id: 'next-quarter-priorities',
      type: 'three-column',
      title: 'Q2 Priorities',
      columns: [
        { icon: 'Target', title: 'Growth', description: 'Expand APAC to 10 customers. Launch self-serve tier. Target $2.8M revenue.' },
        { icon: 'Wrench', title: 'Product', description: 'Ship analytics dashboard. Complete API v3 migration. Reduce onboarding time by 50%.' },
        { icon: 'Users', title: 'Team', description: 'Fill 4 data engineering roles. Launch mentorship program. Improve eNPS to 75+.' },
      ],
    },
    {
      id: 'next-quarter-timeline',
      type: 'timeline',
      title: 'Q2 Milestones',
      nodes: [
        { date: 'Apr 7', title: 'Sprint Planning', description: 'Q2 sprint kickoff and OKR alignment' },
        { date: 'Apr 21', title: 'Analytics Beta', description: 'Internal beta of analytics dashboard' },
        { date: 'May 12', title: 'API v3 Launch', description: 'Public launch of API v3 with migration guide' },
        { date: 'Jun 2', title: 'Self-Serve GA', description: 'General availability of self-serve tier' },
        { date: 'Jun 23', title: 'Q2 Close', description: 'Quarter close and retrospective' },
      ],
    },
    {
      id: 'closing',
      type: 'qa',
      text: 'Discussion',
      subtitle: 'Questions, feedback, and open items',
    },
  ] as SlideConfig[],
}

const projectKickoffTemplate: DeckTemplate = {
  id: 'project-kickoff',
  name: 'Project Kickoff',
  description: 'Launch a new project with vision, scope, team structure, timeline, and success criteria.',
  category: 'project',
  tags: ['kickoff', 'project', 'launch', 'planning', 'team', 'timeline'],
  intentKeywords: [
    'kickoff', 'kick off', 'kick-off', 'project start', 'project launch',
    'new project', 'project plan', 'project intro', 'project introduction',
    'initiation', 'charter',
  ],
  estimatedMinutes: 25,
  slideCount: 12,
  customizationHints: [
    'title.title (project name)',
    'title.subtitle (project lead)',
    'vision content (problem and opportunity)',
    'objectives items (3-5 key goals)',
    'team org-chart or icon-grid',
    'timeline nodes (milestones)',
    'success criteria stats',
  ],
  preview: [
    { type: 'title', title: 'Project Alpha' },
    { type: 'content', title: 'The Opportunity' },
    { type: 'icon-grid', title: 'Objectives' },
  ],
  slides: [
    {
      id: 'title',
      type: 'title',
      title: 'Project Alpha',
      subtitle: 'Kickoff — [Project Lead], [Date]',
      tagline: '[Organization] · Confidential',
    },
    {
      id: 'agenda',
      type: 'steps',
      title: 'Agenda',
      steps: [
        { icon: 'Lightbulb', title: 'Why', description: 'The problem and opportunity' },
        { icon: 'Target', title: 'What', description: 'Objectives and scope' },
        { icon: 'Users', title: 'Who', description: 'Team and roles' },
        { icon: 'Calendar', title: 'When', description: 'Timeline and milestones' },
        { icon: 'CheckCircle', title: 'Success', description: 'How we measure it' },
      ],
    },
    {
      id: 'divider-why',
      type: 'divider',
      title: 'The Opportunity',
      sectionNumber: 1,
    },
    {
      id: 'opportunity',
      type: 'two-column',
      title: 'Why Now?',
      left: {
        icon: 'AlertTriangle',
        title: 'The Problem',
        body: 'Current process is manual, error-prone, and does not scale.',
        bullets: [
          '40+ hours/week spent on manual tasks',
          '15% error rate in data processing',
          'Customer complaints up 25% YoY',
        ],
      },
      right: {
        icon: 'Rocket',
        title: 'The Opportunity',
        body: 'Automation and modernization can unlock significant value.',
        bullets: [
          '$1.2M annual savings potential',
          'Enable 3x throughput without headcount',
          'Competitive parity with market leaders',
        ],
      },
    },
    {
      id: 'divider-what',
      type: 'divider',
      title: 'Objectives & Scope',
      sectionNumber: 2,
    },
    {
      id: 'objectives',
      type: 'icon-grid',
      title: 'Key Objectives',
      columns: 3,
      items: [
        { icon: 'Zap', title: 'Automate Core Workflow', description: 'Eliminate manual data entry and validation steps' },
        { icon: 'BarChart3', title: 'Improve Accuracy', description: 'Reduce error rate from 15% to under 2%' },
        { icon: 'Clock', title: 'Faster Turnaround', description: 'Cut processing time from 5 days to same-day' },
      ],
    },
    {
      id: 'scope',
      type: 'comparison',
      title: 'Scope',
      before: {
        label: 'In Scope',
        items: [
          'Data ingestion pipeline',
          'Validation engine',
          'Dashboard and reporting',
          'API for downstream systems',
        ],
      },
      after: {
        label: 'Out of Scope',
        items: [
          'Legacy system migration',
          'Mobile application',
          'Third-party integrations (Phase 2)',
          'Compliance certification',
        ],
      },
    },
    {
      id: 'divider-who',
      type: 'divider',
      title: 'Team',
      sectionNumber: 3,
    },
    {
      id: 'team',
      type: 'icon-grid',
      title: 'Core Team',
      columns: 4,
      items: [
        { icon: 'UserCheck', title: '[Project Lead]', description: 'Project Manager — overall delivery' },
        { icon: 'Code', title: '[Tech Lead]', description: 'Technical Lead — architecture & engineering' },
        { icon: 'Palette', title: '[Designer]', description: 'UX Designer — user experience & interfaces' },
        { icon: 'Shield', title: '[Sponsor]', description: 'Executive Sponsor — governance & escalation' },
      ],
    },
    {
      id: 'timeline',
      type: 'timeline',
      title: 'Project Timeline',
      nodes: [
        { date: 'Week 1-2', title: 'Discovery', description: 'Requirements, architecture, and design' },
        { date: 'Week 3-6', title: 'Build Phase 1', description: 'Core pipeline and validation engine' },
        { date: 'Week 7-8', title: 'Build Phase 2', description: 'Dashboard, reporting, and API' },
        { date: 'Week 9-10', title: 'Testing', description: 'QA, UAT, and performance testing' },
        { date: 'Week 11-12', title: 'Launch', description: 'Staged rollout and handover' },
      ],
    },
    {
      id: 'success-criteria',
      type: 'stats',
      title: 'Success Criteria',
      layout: '1x4' as const,
      stats: [
        { value: 80, suffix: '%', label: 'Process Automation' },
        { value: 2, suffix: '%', label: 'Error Rate Target', prefix: '<' },
        { value: 1, label: 'Day Turnaround' },
        { value: 1.2, suffix: 'M', label: 'Annual Savings', prefix: '$' },
      ],
    },
    {
      id: 'next-steps',
      type: 'content',
      title: 'Next Steps',
      body: 'Immediate actions to get the project moving.',
      bullets: [
        'Finalize requirements document by [date]',
        'Set up project workspace and tooling',
        'Schedule weekly sync (Tue 10am)',
        'Complete stakeholder interviews (Week 1)',
        'Architecture review gate (end of Week 2)',
      ],
    },
  ] as SlideConfig[],
}

const strategyProposalTemplate: DeckTemplate = {
  id: 'strategy-proposal',
  name: 'Strategy Proposal',
  description: 'Present a strategic recommendation with analysis, options, and implementation plan.',
  category: 'strategy',
  tags: ['strategy', 'proposal', 'recommendation', 'analysis', 'decision', 'executive'],
  intentKeywords: [
    'strategy', 'strategic', 'proposal', 'recommend', 'recommendation',
    'options analysis', 'decision', 'business case', 'investment',
    'direction', 'approach', 'strategic plan',
  ],
  estimatedMinutes: 30,
  slideCount: 15,
  customizationHints: [
    'title.title (strategic question)',
    'context content (background)',
    'current state analysis',
    'options comparison (feature-grid)',
    'recommendation rationale',
    'implementation timeline',
    'investment stats',
  ],
  preview: [
    { type: 'title', title: 'Strategic Recommendation' },
    { type: 'content', title: 'The Strategic Question' },
    { type: 'feature-grid', title: 'Options Analysis' },
  ],
  slides: [
    {
      id: 'title',
      type: 'title',
      title: '[Strategic Question / Initiative]',
      subtitle: 'Strategy Recommendation — [Author]',
      tagline: '[Organization] · [Date] · Confidential',
    },
    {
      id: 'strategic-question',
      type: 'content',
      title: 'The Strategic Question',
      body: 'What is the right approach to [challenge/opportunity] given [context]?',
      bullets: [
        'Market is shifting toward [trend]',
        'Current approach is [limitation]',
        'Decision needed by [date] to capture the window',
      ],
    },
    {
      id: 'context',
      type: 'two-column',
      title: 'Context',
      left: {
        icon: 'TrendingUp',
        title: 'Market Forces',
        body: 'External factors driving this decision.',
        bullets: [
          'Competitor X launched similar offering',
          'Customer demand up 35% in target segment',
          'Regulatory tailwind expected in H2',
        ],
      },
      right: {
        icon: 'Building2',
        title: 'Internal Readiness',
        body: 'Our current capabilities and gaps.',
        bullets: [
          'Core technology ready for extension',
          'Team capacity available in Q2',
          'Gap: no expertise in [area]',
        ],
      },
    },
    {
      id: 'current-state',
      type: 'stats',
      title: 'Where We Stand Today',
      layout: '2x2' as const,
      stats: [
        { value: 23, suffix: '%', label: 'Market Share' },
        { value: 4.2, suffix: 'M', label: 'Annual Revenue', prefix: '$' },
        { value: 67, suffix: '%', label: 'Utilization Rate' },
        { value: 3, label: 'Competitors Ahead' },
      ],
    },
    {
      id: 'divider-options',
      type: 'divider',
      title: 'Options Analysis',
      sectionNumber: 1,
    },
    {
      id: 'options-overview',
      type: 'three-column',
      title: 'Three Strategic Options',
      columns: [
        { icon: 'Shield', title: 'Option A: Defend', description: 'Optimize current offering. Lower risk, lower upside. Incremental improvements to maintain position.' },
        { icon: 'Rocket', title: 'Option B: Expand', description: 'Build new capability organically. Medium risk, high upside. 9-12 month build cycle.' },
        { icon: 'Handshake', title: 'Option C: Partner', description: 'Acquire or partner for capability. Higher cost, fastest time to market. 3-6 month integration.' },
      ],
    },
    {
      id: 'options-comparison',
      type: 'feature-grid',
      title: 'Options Comparison',
      columns: [
        { header: 'Criteria' },
        { header: 'A: Defend' },
        { header: 'B: Expand' },
        { header: 'C: Partner', highlight: true },
      ],
      rows: [
        { feature: 'Time to Market', values: ['N/A', '9-12 mo', '3-6 mo'] },
        { feature: 'Investment', values: ['$500K', '$2M', '$3.5M'] },
        { feature: 'Revenue Potential', values: ['$4.5M', '$8M', '$10M'] },
        { feature: 'Risk Level', values: ['Low', 'Medium', 'Medium-High'] },
        { feature: 'Team Impact', values: ['Minimal', '+8 FTE', '+3 FTE'] },
        { feature: 'Strategic Fit', values: ['Partial', 'Strong', 'Strong'] },
      ],
    },
    {
      id: 'divider-recommendation',
      type: 'divider',
      title: 'Recommendation',
      sectionNumber: 2,
    },
    {
      id: 'recommendation',
      type: 'content',
      title: 'Recommendation: Option C — Partner',
      body: 'Partnering delivers the fastest path to market with acceptable risk, and positions us for long-term competitive advantage.',
      bullets: [
        'Captures the market window before competitor consolidation',
        '3x ROI within 18 months based on conservative projections',
        'Fills our capability gap without 9-month organic build',
        'Partnership de-risks through shared investment model',
        'Team augmentation vs. full hire reduces execution risk',
      ],
    },
    {
      id: 'implementation',
      type: 'timeline',
      title: 'Implementation Roadmap',
      nodes: [
        { date: 'Month 1', title: 'Partner Selection', description: 'Due diligence, term sheet, agreement' },
        { date: 'Month 2-3', title: 'Integration', description: 'Technical integration, team onboarding' },
        { date: 'Month 4', title: 'Beta Launch', description: 'Limited release to design partners' },
        { date: 'Month 5-6', title: 'GA Launch', description: 'General availability and marketing push' },
      ],
    },
    {
      id: 'investment',
      type: 'stats',
      title: 'Investment Ask',
      layout: '1x4' as const,
      stats: [
        { value: 3.5, suffix: 'M', label: 'Total Investment', prefix: '$' },
        { value: 10, suffix: 'M', label: 'Revenue Target (Y1)', prefix: '$' },
        { value: 2.9, suffix: 'x', label: 'Expected ROI' },
        { value: 18, suffix: ' mo', label: 'Payback Period' },
      ],
    },
    {
      id: 'risks',
      type: 'force-field',
      title: 'Risk Analysis',
      question: 'Should we proceed with Option C?',
      driving: [
        { label: 'Market window closing', strength: 3 },
        { label: 'Customer demand strong', strength: 3 },
        { label: 'Partner ready and willing', strength: 2 },
        { label: 'Team capacity available', strength: 2 },
      ],
      restraining: [
        { label: 'Integration complexity', strength: 2 },
        { label: 'Cultural alignment risk', strength: 2 },
        { label: 'Budget pressure from other initiatives', strength: 1 },
        { label: 'Dependency on partner roadmap', strength: 2 },
      ],
    },
    {
      id: 'decision',
      type: 'content',
      title: 'Decision Needed',
      body: 'We are seeking approval to proceed with Option C and begin partner negotiations.',
      bullets: [
        'Approve $3.5M investment for FY26',
        'Authorize partner due diligence process',
        'Assign executive sponsor for integration',
        'Target: decision by [date]',
      ],
    },
    {
      id: 'closing',
      type: 'qa',
      text: 'Discussion',
      subtitle: 'Questions and feedback on the recommendation',
    },
  ] as SlideConfig[],
}

const teamUpdateTemplate: DeckTemplate = {
  id: 'team-update',
  name: 'Team Update',
  description: 'Regular team status update with progress, priorities, wins, and blockers.',
  category: 'communication',
  tags: ['update', 'status', 'team', 'weekly', 'standup', 'progress'],
  intentKeywords: [
    'team update', 'weekly update', 'status update', 'team status',
    'standup', 'stand-up', 'weekly', 'bi-weekly', 'biweekly',
    'sprint review', 'iteration review', 'progress update',
    'all hands', 'all-hands',
  ],
  estimatedMinutes: 15,
  slideCount: 9,
  customizationHints: [
    'title.subtitle (team name)',
    'title.tagline (reporting period)',
    'stats (key metrics)',
    'wins icon-grid items',
    'in-progress steps',
    'blockers content bullets',
    'next week priorities',
  ],
  preview: [
    { type: 'title', title: 'Team Update' },
    { type: 'stats', title: 'This Period' },
    { type: 'icon-grid', title: 'Wins' },
  ],
  slides: [
    {
      id: 'title',
      type: 'title',
      title: 'Team Update',
      subtitle: '[Team Name]',
      tagline: '[Date Range] · Week [N]',
    },
    {
      id: 'snapshot',
      type: 'stats',
      title: 'This Period at a Glance',
      layout: '1x4' as const,
      stats: [
        { value: 12, label: 'Tasks Completed' },
        { value: 5, label: 'In Progress' },
        { value: 2, label: 'Blocked' },
        { value: 87, suffix: '%', label: 'Sprint Health' },
      ],
    },
    {
      id: 'wins',
      type: 'icon-grid',
      title: 'Key Wins',
      columns: 3,
      items: [
        { icon: 'Rocket', title: 'Feature Shipped', description: 'User dashboard went live on Tuesday' },
        { icon: 'Bug', title: 'Bug Squashed', description: 'Fixed critical auth issue affecting 200 users' },
        { icon: 'Handshake', title: 'Collaboration', description: 'Completed cross-team API integration' },
      ],
    },
    {
      id: 'in-progress',
      type: 'steps',
      title: 'In Progress',
      steps: [
        { icon: 'Code', title: 'Search Redesign', description: '70% complete — targeting Friday release' },
        { icon: 'Database', title: 'DB Migration', description: 'Schema changes deployed, data backfill running' },
        { icon: 'TestTube', title: 'E2E Test Suite', description: 'Writing tests for critical user paths' },
      ],
    },
    {
      id: 'blockers',
      type: 'content',
      title: 'Blockers & Risks',
      body: 'Items that need attention or escalation.',
      bullets: [
        '🔴 Waiting on API credentials from Partner team (3 days)',
        '🟡 Design review for settings page not yet scheduled',
        '🟡 CI pipeline flaky — 15% failure rate on integration tests',
      ],
    },
    {
      id: 'team-capacity',
      type: 'feature-grid',
      title: 'Team Capacity',
      columns: [
        { header: 'Member' },
        { header: 'Focus' },
        { header: 'Availability' },
      ],
      rows: [
        { feature: '[Name 1]', values: ['Search redesign', '100%'] },
        { feature: '[Name 2]', values: ['DB migration', '80% (PTO Fri)'] },
        { feature: '[Name 3]', values: ['E2E tests + bug fixes', '100%'] },
        { feature: '[Name 4]', values: ['Partner API integration', '60% (blocked)'] },
      ],
    },
    {
      id: 'next-week',
      type: 'three-column',
      title: 'Next Period Priorities',
      columns: [
        { icon: 'Target', title: 'Must Do', description: 'Ship search redesign. Resolve API blocker. Complete DB backfill.' },
        { icon: 'ArrowRight', title: 'Should Do', description: 'E2E test coverage to 80%. Schedule design review. Fix CI flakes.' },
        { icon: 'Lightbulb', title: 'Could Do', description: 'Prototype new notification system. Tech debt cleanup on auth module.' },
      ],
    },
    {
      id: 'shoutouts',
      type: 'quote',
      quote: '[Name] went above and beyond this week debugging the auth issue at 10pm on Sunday. The team is lucky to have them.',
      author: 'Team Lead',
      variant: 'full',
    },
    {
      id: 'closing',
      type: 'closing',
      tagline: 'Questions? Reach out on #[team-channel]',
    },
  ] as SlideConfig[],
}

const decisionBriefTemplate: DeckTemplate = {
  id: 'decision-brief',
  name: 'Decision Brief',
  description: 'Concise decision document with context, options, recommendation, and ask. Designed for time-pressed executives.',
  category: 'strategy',
  tags: ['decision', 'brief', 'executive', 'approval', 'concise'],
  intentKeywords: [
    'decision', 'brief', 'decision brief', 'decision document',
    'approval', 'sign-off', 'sign off', 'executive brief',
    'one-pager', 'short deck', 'concise', 'quick deck',
    'go/no-go', 'gate review',
  ],
  estimatedMinutes: 10,
  slideCount: 8,
  customizationHints: [
    'title.title (decision topic)',
    'context content',
    'options comparison',
    'recommendation and rationale',
    'ask / next steps',
  ],
  preview: [
    { type: 'title', title: 'Decision Brief' },
    { type: 'two-column', title: 'Context' },
    { type: 'comparison', title: 'Options' },
  ],
  slides: [
    {
      id: 'title',
      type: 'title',
      title: '[Decision Topic]',
      subtitle: 'Decision Brief — [Author]',
      tagline: 'Decision needed by [Date]',
    },
    {
      id: 'tldr',
      type: 'content',
      title: 'TL;DR',
      body: 'One-paragraph summary of the situation and recommendation.',
      bullets: [
        'Situation: [what happened or changed]',
        'Recommendation: [what we propose]',
        'Impact: [what happens if we do / don\'t act]',
        'Ask: [specific approval or resource needed]',
      ],
      notes: 'This slide should be understandable in 30 seconds. If an exec reads only this slide, they should know what you need.',
    },
    {
      id: 'context',
      type: 'two-column',
      title: 'Context',
      left: {
        icon: 'History',
        title: 'Background',
        body: 'How we got here.',
        bullets: [
          '[Key event or trigger]',
          '[Relevant history]',
          '[What changed recently]',
        ],
      },
      right: {
        icon: 'AlertTriangle',
        title: 'Why Now',
        body: 'Why this decision cannot wait.',
        bullets: [
          '[Deadline or window]',
          '[Cost of delay]',
          '[Dependency or trigger]',
        ],
      },
    },
    {
      id: 'options',
      type: 'comparison',
      title: 'Options',
      before: {
        label: 'Option A',
        items: [
          '[Description]',
          'Cost: $[X]',
          'Timeline: [Y] months',
          'Risk: [level]',
        ],
      },
      after: {
        label: 'Option B (Recommended)',
        items: [
          '[Description]',
          'Cost: $[X]',
          'Timeline: [Y] months',
          'Risk: [level]',
        ],
      },
    },
    {
      id: 'recommendation',
      type: 'content',
      title: 'Recommendation',
      body: 'We recommend Option B because [primary rationale].',
      bullets: [
        '[Reason 1 — strongest argument]',
        '[Reason 2 — supporting evidence]',
        '[Reason 3 — risk mitigation]',
      ],
    },
    {
      id: 'impact',
      type: 'stats',
      title: 'Expected Impact',
      layout: '1x4' as const,
      stats: [
        { value: 0, label: '[Metric 1]' },
        { value: 0, label: '[Metric 2]' },
        { value: 0, label: '[Metric 3]' },
        { value: 0, label: '[Metric 4]' },
      ],
    },
    {
      id: 'ask',
      type: 'content',
      title: 'The Ask',
      body: 'We need the following to proceed:',
      bullets: [
        '✅ [Approval 1 — e.g., budget allocation]',
        '✅ [Approval 2 — e.g., staffing authorization]',
        '✅ [Approval 3 — e.g., timeline commitment]',
      ],
      notes: 'Be specific. "Approve the project" is too vague. "Approve $500K from the Q2 discretionary budget" is actionable.',
    },
    {
      id: 'closing',
      type: 'qa',
      text: 'Questions?',
      subtitle: 'Ready to decide — or what additional information is needed?',
    },
  ] as SlideConfig[],
}

// ── Template Registry ────────────────────────────────────────

export const templateRegistry: DeckTemplate[] = [
  qbrTemplate,
  projectKickoffTemplate,
  strategyProposalTemplate,
  teamUpdateTemplate,
  decisionBriefTemplate,
]

/** Get all templates */
export function getAllTemplates(): DeckTemplate[] {
  return templateRegistry
}

/** Get templates by category */
export function getTemplatesByCategory(category: TemplateCategory): DeckTemplate[] {
  return templateRegistry.filter((t) => t.category === category)
}

/** Get a single template by ID */
export function getTemplate(id: string): DeckTemplate | undefined {
  return templateRegistry.find((t) => t.id === id)
}

/**
 * Match user intent to templates.
 * Returns ranked matches with confidence scores.
 */
export function matchTemplateToIntent(userInput: string): TemplateMatch[] {
  const input = userInput.toLowerCase()
  const words = input.split(/\s+/)

  const matches: TemplateMatch[] = templateRegistry.map((template) => {
    const matchedKeywords: string[] = []
    let score = 0

    for (const keyword of template.intentKeywords) {
      if (input.includes(keyword)) {
        matchedKeywords.push(keyword)
        // Longer keyword matches are more specific / higher confidence
        score += keyword.split(/\s+/).length
      }
    }

    // Also check tags
    for (const tag of template.tags) {
      if (words.includes(tag)) {
        score += 0.5
      }
    }

    // Normalize score to 0-1 range (max reasonable score ~10)
    const normalizedScore = Math.min(score / 6, 1)

    return { template, score: normalizedScore, matchedKeywords }
  })

  return matches
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Fork a template into a new deck config.
 * Replaces template ID with new deck ID and sets metadata.
 */
export function forkTemplate(
  templateId: string,
  deckId: string,
  overrides?: { title?: string; author?: string; description?: string }
): {
  id: string
  title: string
  description?: string
  author?: string
  createdAt: string
  updatedAt: string
  slides: SlideConfig[]
} | null {
  const template = getTemplate(templateId)
  if (!template) return null

  const now = new Date().toISOString()

  return {
    id: deckId,
    title: overrides?.title ?? template.name,
    description: overrides?.description ?? template.description,
    author: overrides?.author,
    createdAt: now,
    updatedAt: now,
    slides: structuredClone(template.slides),
  }
}

/** Get all unique categories from the registry */
export function getCategories(): { id: TemplateCategory; label: string }[] {
  return [
    { id: 'business-review', label: 'Business Review' },
    { id: 'project', label: 'Project' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'team', label: 'Team' },
    { id: 'communication', label: 'Communication' },
  ]
}
