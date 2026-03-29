/**
 * Prompt templates for common deck archetypes.
 *
 * Each template provides:
 * - A system prompt that explains the Shine tool interface
 * - A user prompt template with placeholders for context
 *
 * Usage: Combine the system prompt with a filled-in user template,
 * then send to an AI model with the tools from ./tools.ts.
 */

import { slideTypes } from './schema'

// ── System prompt (shared across all deck types) ──────────────

export const systemPrompt = `You are a presentation design assistant that creates professional slide decks using the Shine framework.

## Available Tools
You have access to these tools for creating and modifying decks:
- **create_deck**: Create a new deck with a title and array of slides
- **add_slide**: Add a slide to an existing deck (optionally after a specific slide)
- **modify_slide**: Update specific fields on an existing slide
- **remove_slide**: Remove a slide by id
- **reorder_slides**: Reorder all slides by providing the new id sequence

## Available Slide Types
${slideTypes.map((t) => `- \`${t}\``).join('\n')}

## Design Guidelines
1. **Start with a title slide** (\`title\` or \`title-digital\`) and **end with a closing or Q&A slide**
2. **Use section dividers** (\`divider\`) to break content into logical sections
3. **Mix slide types** for visual variety — avoid consecutive slides of the same type
4. **Keep text concise** — bullets should be 5-10 words, not full sentences
5. **Use icons** from Lucide (PascalCase names like "Target", "Users", "BarChart3")
6. **Limit to 10-15 slides** for a focused presentation, 15-25 for comprehensive ones
7. **Every slide needs a unique id** — use kebab-case (e.g., "revenue-overview", "team-structure")
8. **Use stats slides** for key metrics — the animated count-up makes numbers impactful
9. **Use comparison slides** for before/after or old/new contrasts
10. **Use three-column or icon-grid** for capabilities, pillars, or value propositions

## Icon Reference (Common Choices)
Business: "Briefcase", "Building2", "DollarSign", "TrendingUp", "BarChart3", "PieChart"
People: "Users", "UserCheck", "HeartHandshake", "Handshake"
Technology: "Cpu", "Globe", "Cloud", "Shield", "Zap", "Wifi"
Strategy: "Target", "Compass", "Map", "Milestone", "Flag"
Communication: "MessageSquare", "Mail", "Phone", "Video"
Creation: "Lightbulb", "PenLine", "Palette", "Layers"
Data: "Database", "LineChart", "Activity", "BarChart"
Time: "Clock", "Calendar", "Timer", "History"
Status: "CheckCircle", "AlertTriangle", "XCircle", "Info"
Navigation: "ArrowRight", "ChevronRight", "MoveRight", "Rocket"
`

// ── Deck type templates ───────────────────────────────────────

export interface PromptTemplate {
  name: string
  description: string
  /** Placeholder keys that should be filled in the user prompt */
  placeholders: string[]
  userPrompt: string
}

export const templates: Record<string, PromptTemplate> = {
  'quarterly-update': {
    name: 'Quarterly Update / QBR',
    description: 'Quarterly business review with metrics, achievements, challenges, and next-quarter plans',
    placeholders: [
      'quarter (e.g. Q1 2026)',
      'team/org name',
      'key metrics (revenue, growth, headcount, etc.)',
      'top achievements',
      'challenges or risks',
      'next quarter priorities',
    ],
    userPrompt: `Create a quarterly business review deck for {quarter} for the {team/org name} team.

Key metrics:
{key metrics}

Top achievements this quarter:
{top achievements}

Challenges and risks:
{challenges or risks}

Next quarter priorities:
{next quarter priorities}

Structure the deck as:
1. Title slide with quarter and team name
2. Agenda/overview
3. Section: Key Metrics (use stats slides for the numbers)
4. Section: Achievements (use content, icon-grid, or two-column slides)
5. Section: Challenges & Risks (use comparison or force-field if appropriate)
6. Section: Next Quarter Plan (use timeline or steps)
7. Q&A or closing slide`,
  },

  'project-kickoff': {
    name: 'Project Kickoff',
    description: 'New project introduction with vision, scope, team, timeline, and success criteria',
    placeholders: [
      'project name',
      'project vision / elevator pitch',
      'key objectives (3-5)',
      'team members and roles',
      'timeline / milestones',
      'success criteria',
    ],
    userPrompt: `Create a project kickoff deck for "{project name}".

Vision: {project vision / elevator pitch}

Key objectives:
{key objectives}

Team:
{team members and roles}

Timeline:
{timeline / milestones}

Success criteria:
{success criteria}

Structure the deck as:
1. Title slide with project name
2. Vision / Why — the problem and opportunity
3. Objectives (use icon-grid or three-column)
4. Scope — what's in and out (use comparison or two-column)
5. Team structure (use org-chart if hierarchical, otherwise icon-grid)
6. Timeline (use timeline or gantt slide)
7. Success criteria / KPIs (use stats or content slide)
8. Next steps
9. Q&A`,
  },

  'status-report': {
    name: 'Status Report',
    description: 'Regular project or team status update with progress, blockers, and next actions',
    placeholders: [
      'project/team name',
      'reporting period',
      'overall status (on-track / at-risk / behind)',
      'completed items',
      'in-progress items',
      'blockers',
      'next actions',
    ],
    userPrompt: `Create a status report deck for "{project/team name}" covering {reporting period}.

Overall status: {overall status}

Completed:
{completed items}

In progress:
{in-progress items}

Blockers:
{blockers}

Next actions:
{next actions}

Keep this concise (8-12 slides). Structure:
1. Title slide
2. Executive summary — overall status with key stats
3. What was completed (content or two-column)
4. What's in progress (steps or content with bullets)
5. Blockers / risks (use comparison or force-field)
6. Next actions (steps slide)
7. Closing`,
  },

  'strategy-deck': {
    name: 'Strategy Deck',
    description: 'Strategic proposal or direction-setting with analysis, options, and recommendations',
    placeholders: [
      'title / strategic question',
      'context and background',
      'current state analysis',
      'strategic options (2-3 options)',
      'recommendation and rationale',
      'implementation approach',
      'resource requirements',
    ],
    userPrompt: `Create a strategy deck addressing: "{title / strategic question}"

Context:
{context and background}

Current state:
{current state analysis}

Strategic options:
{strategic options}

Recommendation:
{recommendation and rationale}

Implementation:
{implementation approach}

Resources needed:
{resource requirements}

Structure as a persuasive narrative (15-20 slides):
1. Title slide
2. The strategic question / challenge
3. Context and why this matters now
4. Current state analysis (use matrix, comparison, or stats)
5. Section divider: "Options Analysis"
6. Option analysis (use two-column or feature-grid for comparison)
7. Section divider: "Recommendation"
8. Recommended approach with rationale
9. Implementation roadmap (timeline or gantt)
10. Resource and investment ask (stats or two-column)
11. Risks and mitigations (force-field or comparison)
12. Expected outcomes / success metrics (stats)
13. Ask / decision needed
14. Q&A`,
  },

  'team-introduction': {
    name: 'Team Introduction',
    description: 'Introduce a team — who we are, what we do, how we work',
    placeholders: [
      'team name',
      'team mission',
      'team members (names, roles)',
      'key capabilities',
      'current focus areas',
      'how to engage with the team',
    ],
    userPrompt: `Create a team introduction deck for the "{team name}" team.

Mission: {team mission}

Team members:
{team members}

Key capabilities:
{key capabilities}

Current focus:
{current focus areas}

How to work with us:
{how to engage with the team}

Structure:
1. Title slide with team name
2. Mission / charter (content or quote slide)
3. Team structure (org-chart or icon-grid)
4. Our capabilities (icon-grid or three-column)
5. Current focus areas (steps or content with bullets)
6. How to engage with us (two-column or content)
7. Closing with contact info`,
  },
}

/** Get a ready-to-use prompt by filling in template placeholders */
export function fillTemplate(
  templateKey: string,
  values: Record<string, string>
): { system: string; user: string } | null {
  const template = templates[templateKey]
  if (!template) return null

  let userPrompt = template.userPrompt
  for (const [key, value] of Object.entries(values)) {
    userPrompt = userPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }

  return { system: systemPrompt, user: userPrompt }
}
