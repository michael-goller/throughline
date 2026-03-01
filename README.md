# Slide Deck Template

React + Vite slide deck with Avery Dennison branding, Framer Motion animations, and data-driven configuration.

## Quick Start

```bash
# Copy template to new project
cp -r /Users/michael.goller/Documents/agents/templates/slide-deck ~/my-new-deck
cd ~/my-new-deck

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

## Creating Slides

Edit `src/slides.config.ts` - that's the only file you need to touch:

```typescript
import { Target, Users } from 'lucide-react'
import type { SlideConfig } from './types'

export const slides: SlideConfig[] = [
  {
    id: 'intro',
    type: 'title',
    title: 'My Presentation',
    subtitle: 'Subtitle here',
  },
  // ... more slides
]
```

## Slide Types

### `title`
Red gradient background with centered text.

```typescript
{
  id: 'intro',
  type: 'title',
  title: 'Main Title',
  subtitle: 'Optional subtitle',
  tagline: 'Optional tagline',
}
```

### `steps`
Dark background with numbered cards and icons.

```typescript
{
  id: 'agenda',
  type: 'steps',
  title: 'Agenda',
  steps: [
    {
      icon: Target,        // from lucide-react
      title: 'Step Title',
      duration: '10 min',  // optional
      description: 'Description text',
    },
  ],
}
```

### `two-column`
50/50 split layout with content cards.

```typescript
{
  id: 'comparison',
  type: 'two-column',
  title: 'Section Title',
  subtitle: 'Optional subtitle',
  left: {
    number: 1,           // optional
    title: 'Card Title',
    body: 'Main text content',
    bullets: ['Point 1', 'Point 2'],  // optional
  },
  right: {
    number: 2,
    title: 'Card Title',
    body: 'Main text content',
  },
}
```

### `content`
Single column with title, body text, and bullets.

```typescript
{
  id: 'key-points',
  type: 'content',
  title: 'Key Insights',
  subtitle: 'Optional subtitle',
  body: 'Main paragraph text goes here.',
  bullets: [
    'First bullet point',
    'Second bullet point',
  ],
}
```

### `divider`
Full red background section divider.

```typescript
{
  id: 'section-1',
  type: 'divider',
  title: 'Section Title',
  subtitle: 'Optional subtitle',
  sectionNumber: 1,  // optional
}
```

### `quote`
Quote with author attribution. Two variants available.

```typescript
// Split variant (default) - red left panel, dark right panel
{
  id: 'quote-1',
  type: 'quote',
  quote: 'The quote text goes here.',
  author: 'Author Name',
  authorTitle: 'Title or Role',  // optional
  variant: 'split',              // optional, default
}

// Full variant - dark background with large quote mark
{
  id: 'quote-2',
  type: 'quote',
  variant: 'full',
  quote: 'The quote text goes here.',
  author: 'Author Name',
}
```

### `three-column`
Three equal columns with icons.

```typescript
{
  id: 'approach',
  type: 'three-column',
  title: 'Our Approach',  // optional
  columns: [
    {
      icon: Lightbulb,
      title: 'Column 1',
      description: 'Description text',
    },
    {
      icon: Rocket,
      title: 'Column 2',
      description: 'Description text',
    },
    {
      icon: TrendingUp,
      title: 'Column 3',
      description: 'Description text',
    },
  ],
}
```

### `stats`
Statistics with animated count-up effect.

```typescript
{
  id: 'metrics',
  type: 'stats',
  title: 'Impact Metrics',  // optional
  layout: '2x2',            // '2x2' (default) or '1x4'
  stats: [
    { value: 95, suffix: '%', label: 'Customer Satisfaction' },
    { value: 2.5, suffix: 'M', label: 'Users Reached' },
    { value: 47, prefix: '$', suffix: 'K', label: 'Savings' },
    { value: 12, suffix: 'x', label: 'Faster' },
  ],
}
```

### `image-content`
50/50 split with image and content.

```typescript
{
  id: 'visual',
  type: 'image-content',
  title: 'Section Title',
  body: 'Description text',           // optional
  bullets: ['Point 1', 'Point 2'],    // optional
  imageUrl: 'https://...',            // external URL
  // OR imageSrc: importedImage,      // imported asset
  // OR imagePlaceholder: true,       // gray placeholder box
  imagePosition: 'right',             // 'left' or 'right' (default)
}
```

### `timeline`
Horizontal timeline with alternating nodes.

```typescript
{
  id: 'milestones',
  type: 'timeline',
  title: 'Project Timeline',  // optional
  nodes: [                    // max 6 recommended
    { date: 'Q1', title: 'Discovery', description: 'Research phase' },
    { date: 'Q2', title: 'Design', description: 'Prototyping' },
    { date: 'Q3', title: 'Build', description: 'Development' },
    { date: 'Q4', title: 'Launch', description: 'Go to market' },
  ],
}
```

### `comparison`
Before/After comparison with animated arrow.

```typescript
{
  id: 'before-after',
  type: 'comparison',
  title: 'The Transformation',  // optional
  leftLabel: 'Before',          // default: 'Before'
  rightLabel: 'After',          // default: 'After'
  leftItems: [
    'Old way of doing things',
    'Another pain point',
  ],
  rightItems: [
    'New improved approach',
    'Better outcome',
  ],
}
```

### `qa`
Large "Q+A" text on red background.

```typescript
{
  id: 'questions',
  type: 'qa',
  text: 'Q+A',          // optional, default: 'Q+A'
  subtitle: 'Let\'s discuss',  // optional
}
```

### `closing`
Closing slide with logo, tagline, and social links.

```typescript
{
  id: 'end',
  type: 'closing',
  tagline: 'Thank You',           // optional
  contactEmail: 'email@example.com',  // optional
  logoSrc: '/logo.png',           // optional
  socialLinks: [                  // optional
    { platform: 'LinkedIn', url: 'https://linkedin.com/...' },
    { platform: 'Twitter', url: 'https://twitter.com/...' },
    { platform: 'GitHub', url: 'https://github.com/...' },
  ],
}
```

## Navigation

- **Arrow keys** / **Space** / **Enter**: Next slide
- **Backspace**: Previous slide
- **Click** dots or arrows to navigate

## Icons

Import any icon from [Lucide](https://lucide.dev/icons):

```typescript
import { Target, Users, MessageCircle, PenLine, CheckCircle } from 'lucide-react'
```

## Export to PDF

Export your presentation to PNG images and/or PDF:

```bash
# First, start the dev server in another terminal
npm run dev

# Export PNGs and create PDF (recommended)
npm run export

# Export PNGs only
npm run export:png

# Create PDF from existing PNGs
npm run export:pdf
```

Output files are saved to the `export/` directory:
- `slide-01.png`, `slide-02.png`, etc.
- `slides.pdf` (when using `--pdf` or `--pdf-only`)

**Note:** The export script automatically detects the number of slides from the slide counter element.

## Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v3
- Framer Motion
- Lucide React icons
- Puppeteer (for PDF export)
- pdf-lib (for PDF generation)
