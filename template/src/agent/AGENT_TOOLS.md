# Shine Agent Tool Interface

This module provides the structured interface for AI agents to create and modify Shine presentation decks. All slide configs are pure JSON — no TypeScript imports required.

## Quick Start

```typescript
import { tools, systemPrompt, applyTool, templates } from './agent'

// 1. Send tools + systemPrompt to your AI model
// 2. Model returns tool calls with structured JSON
// 3. Apply tool calls to build/modify the deck:

let result = applyTool('create_deck', {
  title: 'Q1 2026 Review',
  slides: [
    { id: 'title', type: 'title-digital', title: 'Q1 2026 Review', subtitle: 'Intelligent Labels' },
    { id: 'metrics', type: 'stats', stats: [{ value: 4.2, suffix: 'M', label: 'Revenue' }] },
    { id: 'qa', type: 'qa' },
  ],
})

// Modify an existing deck:
result = applyTool('add_slide', {
  slide: { id: 'team', type: 'icon-grid', title: 'Team', items: [...] },
  afterSlideId: 'metrics',
}, result.deck)
```

## Tools

| Tool | Description | When to Use |
|------|-------------|-------------|
| `create_deck` | Create a complete new deck | User wants a new presentation |
| `add_slide` | Add one slide (at end or after a specific slide) | User says "add a slide about X" |
| `modify_slide` | Update specific fields on a slide | User says "change the title" or "update the bullets" |
| `remove_slide` | Delete a slide by id | User says "remove that slide" |
| `reorder_slides` | Reorder all slides | User says "move the metrics slide before the team slide" |

## Slide Types (28 total)

### Presentation Flow
- **`title`** — Red gradient title slide
- **`title-digital`** — Title with neural network animation
- **`divider`** — Section divider (red background)
- **`qa`** — Q&A slide
- **`closing`** — Closing with contact/social links

### Content
- **`content`** — Single column with title, body, bullets
- **`two-column`** — 50/50 split with two cards
- **`three-column`** — Three equal columns with icons
- **`quote`** — Quote with author attribution
- **`image-content`** — Image + text split
- **`image`** — Full-screen image

### Data & Metrics
- **`stats`** — Animated counter statistics (2x2 or 1x4)
- **`gantt`** — Gantt chart (inline data)
- **`timeline`** — Horizontal timeline
- **`sparkline-grid`** — Resource intensity heatmap
- **`barometer-grid`** — Score barometer cards

### Analysis & Strategy
- **`comparison`** — Before/after with animated arrow
- **`matrix`** — 2x2 quadrant (SWOT, priority, risk)
- **`fishbone`** — Root cause analysis diagram
- **`force-field`** — Driving vs restraining forces
- **`feature-grid`** — Feature comparison table

### Organization
- **`org-chart`** — Hierarchical tree
- **`team-objectives`** — Team + OKRs layout
- **`okr-score`** — OKR scorecard
- **`operating-loop`** — Circular cadence diagram
- **`icon-grid`** — Grid of icons with descriptions
- **`steps`** — Numbered step cards (agenda/process)

### Special
- **`pricing`** — Pricing tier table
- **`name-reveal`** — Animated name transformation

## Icons

All icon fields accept Lucide icon names as strings (PascalCase):

```json
{ "icon": "Target" }
{ "icon": "Users" }
{ "icon": "BarChart3" }
```

Browse all icons at [lucide.dev/icons](https://lucide.dev/icons).

## Prompt Templates

Pre-built templates for common deck types:

| Template | Use Case |
|----------|----------|
| `quarterly-update` | QBR with metrics, achievements, challenges, next-quarter plans |
| `project-kickoff` | New project intro with vision, team, timeline, success criteria |
| `status-report` | Progress update with completed, in-progress, blockers |
| `strategy-deck` | Strategic proposal with analysis, options, recommendation |
| `team-introduction` | Team overview with mission, capabilities, focus areas |

```typescript
import { fillTemplate } from './agent'

const prompt = fillTemplate('quarterly-update', {
  'quarter': 'Q1 2026',
  'team/org name': 'Intelligent Labels',
  'key metrics': 'Revenue: $4.2M (+12%), Headcount: 305',
  // ... other placeholders
})
// prompt.system — system prompt with tool instructions
// prompt.user   — filled user prompt
```

## JSON Schema

The full JSON Schema is exported for validation or passing as structured output format:

```typescript
import { deckConfigSchema, slideConfigSchema } from './agent'

// Use deckConfigSchema for full deck validation
// Use slideConfigSchema for single slide validation
```
