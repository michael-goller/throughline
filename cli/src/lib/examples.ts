/**
 * Pre-built example decks used by `throughline onboard`. Each example is
 * complete, realistic content (no lorem ipsum) that showcases a specific
 * deck format. Onboard uses `renderExampleConfig` to write the chosen
 * example's `slides.config.ts` into a freshly scaffolded thin deck.
 */

export interface ExampleDeck {
  key: string
  label: string
  summary: string
  defaultName: string
  title: string
  throughline: string
  /** Serialized TypeScript body (between the imports and the default export). */
  slidesTs: string
}

const boardUpdate: ExampleDeck = {
  key: 'board-update',
  label: 'Board Update',
  summary: 'quarterly OKR scores, status table, closing slide',
  defaultName: 'my-board-update',
  title: 'Q2 Board Update',
  throughline: 'Q2 exceeded targets in 3 of 4 OKRs; shipping velocity is the one gap, and we have a concrete plan to close it in Q3.',
  slidesTs: `export const slides: SlideConfig[] = [
  {
    id: 'cover',
    type: 'title-digital',
    title: 'Q2 Board Update',
    subtitle: 'April 2026',
    tagline: 'Progress, gaps, and where we go next',
  },
  {
    id: 'okr-scores',
    type: 'okr-score',
    title: 'OKR scorecard',
    subtitle: 'How we performed against the commitments we made in January',
    objectives: [
      {
        icon: 'Rocket',
        objective: 'Ship the new pricing experience',
        tagline: 'Customer-facing pricing page + self-serve checkout',
        keyResults: [
          { title: 'Launch redesigned /pricing', description: 'Live by March 15', owner: 'Design', progress: 'done' },
          { title: 'Self-serve checkout flow', description: 'Stripe + plan selection', owner: 'Growth', progress: 'done' },
          { title: 'Pricing experiment framework', description: 'A/B variants in prod', owner: 'Eng', progress: 'on-track' },
        ],
      },
      {
        icon: 'Users',
        objective: 'Grow pilot customer count',
        tagline: 'Move from 4 → 20 paying pilots',
        keyResults: [
          { title: '20 paying pilots', description: '4 at quarter start, 22 today', owner: 'Sales', progress: 'done' },
          { title: 'Average contract value $6k ARR', description: 'Blended ACV $6.4k', owner: 'Sales', progress: 'done' },
          { title: 'Pilot → contract conversion 40%', description: 'Tracking 47% for Q2 cohort', owner: 'CS', progress: 'on-track' },
        ],
      },
      {
        icon: 'Zap',
        objective: 'Lift engineering throughput',
        tagline: 'Higher shipping velocity without burning the team',
        keyResults: [
          { title: 'PRs merged per week', description: 'Target 35, actual 28', owner: 'Eng', progress: 'at-risk' },
          { title: 'Time from merge → prod under 30 min', description: 'Currently 42 min average', owner: 'Platform', progress: 'behind' },
          { title: 'Incident count under 2 per quarter', description: '1 incident in Q2', owner: 'Eng', progress: 'done' },
        ],
      },
      {
        icon: 'Heart',
        objective: 'Keep customers delighted',
        tagline: 'Retention, NPS, support response',
        keyResults: [
          { title: 'Gross retention 95%+', description: '97% in Q2', owner: 'CS', progress: 'done' },
          { title: 'NPS 50+', description: 'Q2 NPS 58', owner: 'CS', progress: 'done' },
          { title: 'First response under 4 hours', description: 'Median 2h 10m', owner: 'Support', progress: 'done' },
        ],
      },
    ],
  },
  {
    id: 'commitments',
    type: 'status-table',
    title: 'Cross-team commitments',
    subtitle: 'Deliverables we agreed to in January — green / amber / red',
    columns: [
      { header: 'Commitment', width: '40%' },
      { header: 'Owner', width: '20%' },
      { header: 'Due', width: '15%' },
      { header: 'Status', width: '25%' },
    ],
    rows: [
      { cells: ['Self-serve checkout', 'Growth', 'Mar 15', 'Shipped Mar 12'], status: 'green' },
      { cells: ['SOC 2 Type I audit kickoff', 'Ops', 'Apr 1', 'Auditor engaged, evidence in collection'], status: 'green' },
      { cells: ['Deploy pipeline under 30 min', 'Platform', 'Jun 30', '42 min median — Q3 focus'], status: 'amber' },
      { cells: ['Hire 2 senior engineers', 'Eng', 'Jun 30', '1 offer accepted, 1 in final round'], status: 'amber' },
      { cells: ['EU data residency option', 'Platform', 'Jun 30', 'Postponed to Q4 — low pilot pull'], status: 'red' },
    ],
    showStatusDot: true,
    summary: '3 green, 2 amber, 1 red. Amber items have concrete Q3 plans; the red was a scoping decision, not a slip.',
  },
  {
    id: 'health',
    type: 'barometer-grid',
    title: 'Business health barometer',
    subtitle: 'Board-level read on the four dimensions that decide whether we keep momentum',
    items: [
      { title: 'Revenue', description: 'ARR up 46% QoQ; Q2 plan was 35%', score: 9, maxScore: 10 },
      { title: 'Product', description: '3 of 4 OKRs hit; pricing page live', score: 8, maxScore: 10 },
      { title: 'Team', description: 'Eng hiring slower than plan; burnout flat', score: 6, maxScore: 10 },
      { title: 'Runway', description: '22 months at current burn, 14 months at plan', score: 8, maxScore: 10 },
    ],
    columns: 2,
  },
  {
    id: 'close',
    type: 'closing',
    tagline: 'Momentum is real; the one gap is shipping velocity, and we own the fix.',
    contactEmail: 'ceo@example.com',
  },
]`,
}

const designProposal: ExampleDeck = {
  key: 'design-proposal',
  label: 'Design Proposal',
  summary: 'feature pitch with comparison, timeline, steps',
  defaultName: 'my-design-proposal',
  title: 'Inline Gallery Actions',
  throughline: 'Moving deck actions into the gallery cuts three clicks out of the most common workflow and makes the homepage earn its spot as the default landing surface.',
  slidesTs: `export const slides: SlideConfig[] = [
  {
    id: 'cover',
    type: 'title-digital',
    title: 'Inline Gallery Actions',
    subtitle: 'A proposal for Q3',
    tagline: 'Fewer clicks, faster decks',
  },
  {
    id: 'problem',
    type: 'content',
    title: 'Why this matters',
    subtitle: 'The gallery is the most-used surface — and the slowest to act on',
    body: 'Every published deck today requires users to click into the deck, then into the share dialog, then back out to the gallery. Session recordings show 72% of gallery visits end without any action taken.',
    bullets: [
      '72% of gallery sessions end without publishing, sharing, or exporting',
      'Users report "I came here to show a deck fast, and it took four clicks" (N=18 interviews)',
      'Support tickets for "how do I share" are the #1 category this quarter',
    ],
  },
  {
    id: 'before-after',
    type: 'comparison',
    title: 'Before and after',
    leftLabel: 'Today',
    rightLabel: 'Proposed',
    leftItems: [
      'Click deck → open detail view',
      'Find Share button in top-right',
      'Open dialog, configure password',
      'Copy link, paste somewhere else',
      '4 clicks, 2 context switches',
    ],
    rightItems: [
      'Hover deck card in gallery',
      'Click inline Share — password auto-generated',
      'Link is already on your clipboard',
      'Optional: expand to customize',
      '1 click, zero context switches',
    ],
  },
  {
    id: 'rollout',
    type: 'timeline',
    title: 'Rollout plan',
    nodes: [
      { date: 'Wk 1', title: 'Spec + design review', description: 'Lock the hover-card interaction and share payload shape' },
      { date: 'Wk 2', title: 'Prototype behind flag', description: 'Ship to staff only; instrument every action' },
      { date: 'Wk 3', title: 'Pilot cohort', description: 'Roll to 20 pilots; compare click-to-share time' },
      { date: 'Wk 4', title: 'General availability', description: 'Enable for all users if time-to-share drops 50%+' },
    ],
  },
  {
    id: 'plan',
    type: 'steps',
    title: 'What we need to build',
    steps: [
      { icon: 'Sparkles', title: 'Hover card', duration: '2 days', description: 'New gallery card with inline action bar that reveals on hover or keyboard focus' },
      { icon: 'Share2', title: 'One-click share', duration: '3 days', description: 'Generate link + random password server-side; return both in one request' },
      { icon: 'Clipboard', title: 'Clipboard write', duration: '1 day', description: 'Client-side copy with a toast that lets the user re-copy or cancel' },
      { icon: 'BarChart3', title: 'Telemetry', duration: '1 day', description: 'Count gallery → share conversion; compare before/after over a two-week window' },
    ],
  },
  {
    id: 'close',
    type: 'closing',
    tagline: 'If approved this week, we can ship to pilots in two weeks and measure impact by month-end.',
    contactEmail: 'design@example.com',
  },
]`,
}

const incidentRetro: ExampleDeck = {
  key: 'incident-retro',
  label: 'Incident Retro',
  summary: 'postmortem with fishbone diagram, steps, lessons',
  defaultName: 'my-incident-retro',
  title: 'Publish Outage Postmortem',
  throughline: 'The April 15 publish outage was caused by a single silent dependency failure — we have a concrete set of prevention steps that remove that failure mode entirely.',
  slidesTs: `export const slides: SlideConfig[] = [
  {
    id: 'cover',
    type: 'title-digital',
    title: 'Publish Outage — Postmortem',
    subtitle: 'April 15, 2026',
    tagline: '38 minutes of degraded service on /publish',
  },
  {
    id: 'causes',
    type: 'fishbone',
    title: 'Why publish broke',
    problem: '/api/publish returning 500 for 38 minutes',
    branches: [
      {
        category: 'People',
        causes: [
          'On-call had rotated that morning without shadow overlap',
          'No one noticed the silent dependency bump in yesterday\\'s PR',
        ],
      },
      {
        category: 'Process',
        causes: [
          'Deploy pipeline had no canary step for /publish',
          'No alert on /publish error rate — only overall API error rate',
        ],
      },
      {
        category: 'Systems',
        causes: [
          'Blob client silently swallowed 403 responses',
          'Error path fell through to generic 500, hiding the real cause',
        ],
      },
      {
        category: 'Inputs',
        causes: [
          'Blob credentials were rotated without updating staging',
          'Prod rollout inherited the stale credential hash from CI cache',
        ],
      },
    ],
  },
  {
    id: 'prevention',
    type: 'steps',
    title: 'Prevention plan',
    steps: [
      { icon: 'Shield', title: 'Surface the 403', duration: '1 day', description: 'Stop swallowing blob errors; bubble them to the publish handler with a typed failure' },
      { icon: 'Bell', title: 'Per-endpoint alerts', duration: '2 days', description: 'Alert on /publish error rate > 2% over 5 minutes, paged to primary on-call' },
      { icon: 'GitBranch', title: 'Canary publish', duration: '3 days', description: 'Route 5% of publish traffic through the new revision for 10 minutes before full rollout' },
      { icon: 'KeyRound', title: 'Credential rotation runbook', duration: '1 day', description: 'Single runbook covering both staging and prod; mandatory check before close' },
    ],
  },
  {
    id: 'lessons',
    type: 'content',
    title: 'What we are taking forward',
    subtitle: 'The three lessons worth keeping past this specific incident',
    bullets: [
      'Silent failures are the real enemy — any failure path must emit a typed error, never a generic 500.',
      'Alert granularity matters. Service-wide error rate hid a per-endpoint outage for 15 minutes.',
      'Rotation hand-offs need at least one overlapping deploy; an isolated on-call is a single point of failure.',
    ],
  },
  {
    id: 'close',
    type: 'closing',
    tagline: 'All four prevention items land in the next two weeks and are tracked on the platform board.',
    contactEmail: 'oncall@example.com',
  },
]`,
}

export const EXAMPLE_DECKS: Record<string, ExampleDeck> = {
  'board-update': boardUpdate,
  'design-proposal': designProposal,
  'incident-retro': incidentRetro,
}

export const EXAMPLE_DECK_ORDER: string[] = ['board-update', 'design-proposal', 'incident-retro']

function escapeTsString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')
}

function formatTitle(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Render a complete `slides.config.ts` string for a thin deck built from the
 * given example. The caller is responsible for writing this to disk.
 */
export function renderExampleConfig(example: ExampleDeck, deckName: string): string {
  const title = formatTitle(deckName) || example.title
  const header = [
    "import type { SlideConfig } from './types'",
    '',
    '/**',
    ` * ${example.label} — generated by \`throughline onboard\`.`,
    ' * Edit freely — this is a starting argument, not a finished deck.',
    ' */',
    `export const throughline = '${escapeTsString(example.throughline)}'`,
    '',
    `export const title = '${escapeTsString(title)}'`,
    '',
  ].join('\n')

  const footer = [
    '',
    'const config = { title, throughline, slides }',
    'export default config',
    '',
  ].join('\n')

  return header + example.slidesTs + footer
}
