# Throughline

**The dev-native way to make decks.**
Or: presentations for people who'd rather not make presentations.

---

The world runs on spreadsheets and slide decks — but nobody actually *enjoys* making them. Throughline lets you describe what you want, and an AI agent builds beautiful presentations with modern web technology. No proprietary format. No lock-in. No dragging boxes around a canvas at 2am wondering where your life went wrong.

Your deck is a `slides.config.ts` file — a plain TypeScript array of slide objects. AI agents read and write it directly. You talk, they build. You present, everyone's impressed. You take the credit.

## Quick Start

```bash
# Install (Homebrew is the recommended path — see below)
brew install michael-goller/tap/throughline

# Create a deck
throughline new quarterly-update

# Tell your AI agent what you want
# (Claude Code, Gemini CLI, Codex — dealer's choice)

# Present
throughline serve quarterly-update
```

That's it. Three commands and a conversation.

## Install

**Homebrew** (recommended on macOS and Linux). Homebrew downloads through a vetted formula and verifies what it ships, so this is the path we recommend for everyone except CI:

```bash
brew install michael-goller/tap/throughline
```

**npm:**

```bash
npm install -g throughline
```

**One-liner** (macOS, Linux, WSL) — installs everything, including Node.js if you don't have it. This pipes a remote shell script straight into `bash`, so we strongly recommend the verification flow below for any host you care about:

```bash
curl -fsSL https://raw.githubusercontent.com/michael-goller/throughline/main/install.sh | bash
```

### Verifying the install script

The `curl | bash` pattern is convenient but trusts whatever bytes GitHub returns at request time. If you'd like a verifiable install:

```bash
# 1. Download (do not pipe to bash yet)
curl -fsSL -o install.sh https://raw.githubusercontent.com/michael-goller/throughline/main/install.sh

# 2. Verify the SHA256 against the published checksum.
#    The current published value is in CHECKSUMS.txt at the same ref.
shasum -a 256 install.sh
# expected: 7dc693ca2045f0f67dfb6669fd2ad5f77ac9c490fc459d16cd801e08ac42d183  install.sh

# 3. Read the script, then run it
less install.sh
bash install.sh
```

To pin the Throughline source itself to a known-good commit (rather than tracking `main`), export `THROUGHLINE_COMMIT` before running the installer or `throughline update`:

```bash
THROUGHLINE_COMMIT=<full-sha> bash install.sh
```

When `THROUGHLINE_COMMIT` is unset, the installer and `throughline update` still attempt `git verify-commit HEAD` and warn if HEAD is unsigned. The bundled nvm install step is already pinned to a specific upstream commit and refuses to execute if its SHA256 does not match.

## How It Works

Throughline is just a web app built for decks.

1. **You create a deck** — `throughline new my-deck` scaffolds a `slides.config.ts` and a `public/` folder. That's your entire deck. Two items.
2. **An AI agent writes the config** — the config is a typed array of slide objects. Each slide has a `type`, a `title`, and type-specific content. AI agents are *really good* at writing these.
3. **Throughline renders it** — React 19, Framer Motion, and Tailwind CSS turn your config into a polished, animated presentation with dark and light themes.

```typescript
// slides.config.ts — this is a deck
import type { SlideConfig } from './src/deck';

const slides: SlideConfig[] = [
  {
    type: 'title',
    title: 'Q1 Results',
    subtitle: 'We did numbers and some of them went up',
  },
  {
    type: 'stats',
    title: 'Key Metrics',
    stats: [
      { label: 'Revenue', value: '$4.2M', trend: 'up', change: '+18%' },
      { label: 'Users', value: '12,400', trend: 'up', change: '+34%' },
      { label: 'Bugs', value: '3', trend: 'down', change: '-97%' },
    ],
  },
  {
    type: 'timeline',
    title: 'Roadmap',
    events: [
      { date: 'Jan', title: 'Launch', description: 'Ship it' },
      { date: 'Mar', title: 'Scale', description: 'Ship it faster' },
    ],
  },
];

export default slides;
```

## 33 Built-in Slide Types

No need to design anything from scratch.

| Category | Types |
|---|---|
| **Presentation Flow** | `title`, `title-digital`, `divider`, `qa`, `closing` |
| **Content** | `content`, `two-column`, `three-column`, `quote`, `image-content`, `image` |
| **Data & Metrics** | `stats`, `gantt`, `timeline`, `sparkline-grid`, `barometer-grid` |
| **Analysis** | `comparison`, `matrix`, `fishbone`, `force-field`, `feature-grid` |
| **Organization** | `org-chart`, `team-objectives`, `okr-score`, `operating-loop`, `icon-grid`, `steps` |
| **Special** | `pricing`, `name-reveal`, `risk-card`, `scorecard`, `status-table` |

Every slide type supports dark and light themes, smooth Framer Motion animations, and responsive layouts.

## CLI Commands

| Command | What it does |
|---|---|
| `throughline new <name>` | Create a new deck (`--full` for a complete template copy) |
| `throughline serve [name]` | Start the dev server with live reload |
| `throughline open [name]` | Open a deck in the browser (or the gallery if no name) |
| `throughline ls` | List all your decks |
| `throughline export [name]` | Export to PNG or PDF (`--png`, `--light`, `--slides 1-5`) |
| `throughline publish [name]` | Push to Throughline Cloud for sharing |
| `throughline unpublish [name]` | Remove from Throughline Cloud |
| `throughline status [name]` | Detailed deck info: path, port, type, URLs |
| `throughline stop [name]` | Stop a running server (`--all` for everything) |
| `throughline add <name> [path]` | Register an existing deck directory |
| `throughline rm [name]` | Unregister a deck (files stay on disk) |
| `throughline rename <old> <new>` | Rename a deck |
| `throughline update` | Self-update to the latest version |
| `throughline doctor` | Health check — Node.js, npm, git, template, config |

### Cloud Commands

| Command | What it does |
|---|---|
| `throughline cloud [url]` | Show or set the Throughline Cloud API URL |
| `throughline login` | Log in to Throughline Cloud |
| `throughline logout` | Clear stored credentials |
| `throughline whoami` | Show current user |

## Keyboard Shortcuts

Vim-style navigation because we have standards.

| Key | Action |
|---|---|
| `j` / `k` or `Arrow Right` / `Arrow Left` | Next / previous slide |
| `gg` | Jump to first slide |
| `G` | Jump to last slide |
| `/` | Search slides |
| `s` | Star / unstar slide |
| `h` | Hide / show slide |
| `i` | Toggle feedback mode |
| `p` | Presenter view |
| `?` | Show all shortcuts |

## Features

- **Vim-style navigation** — `j/k`, `gg/G`, search with `/`
- **Presenter mode** — speaker notes, slide preview, timer
- **Laser pointer** — because pointing at things makes you look authoritative
- **PDF & PNG export** — via Puppeteer, with slide range and quality options
- **Live reload** — edit your config, see changes instantly
- **Dark + Light themes** — toggle with a click
- **Slide overview** — thumbnail grid of all slides
- **Visual editor** — for when you want to click instead of type
- **Slide search** — fuzzy search across all slide content
- **Deck gallery** — dashboard showing all your decks in one place
- **Live feedback** — real-time reactions, comments, and questions from your audience (via InstantDB)
- **Analytics** — view tracking and engagement metrics

## Thin vs. Full Decks

Throughline has two deck modes:

- **Thin** (default) — just a `slides.config.ts` and `public/` folder. The shared template renders everything. Fast to create, tiny footprint, great for most decks.
- **Full** (`throughline new --full`) — a complete copy of the template with its own `src/`, `package.json`, and everything. Use this when you need custom components or deep modifications.

Thin decks are the sweet spot. One config file, all 33 slide types, zero maintenance.

## AI Agent Integration

Throughline includes a full agent API designed for AI-powered deck creation. This is the machinery that lets Claude Code, Gemini CLI, or any LLM-powered tool generate and refine decks programmatically.

### Agent Tools

Five structured tools that AI agents can call:

| Tool | Description |
|---|---|
| `create_deck` | Generate a complete deck from a description |
| `add_slide` | Insert a new slide at any position |
| `modify_slide` | Update an existing slide's content |
| `remove_slide` | Delete a slide by index |
| `reorder_slides` | Rearrange slide order |

### Document Ingestion

Feed existing content and Throughline extracts structure for deck generation:

- **PDF** — text extraction with layout analysis
- **Word (.docx)** — paragraph and heading parsing
- **PowerPoint (.pptx)** — slide-by-slide content extraction
- **Excel (.xlsx)** — data table parsing
- **CSV / plain text** — direct parsing

### Pre-built Templates

Five ready-to-fork deck templates with full slide configurations:

| Template | Slides | Use case |
|---|---|---|
| Quarterly Business Review | 14 | Performance metrics, financials, roadmap |
| Project Kickoff | 12 | Scope, timeline, team, risks |
| Strategy Proposal | 15 | Analysis, recommendations, implementation |
| Team Update | 9 | Status, blockers, wins, next steps |
| Decision Brief | 8 | Context, options, recommendation |

### Refinement Protocol

Iterative editing with undo support — create an edit session, apply changes, preview diffs, and roll back if needed.

## Project Structure

```
throughline/
├── cli/              # Throughline CLI (throughline npm package)
│   ├── src/cli.ts    # All commands
│   └── bin/throughline.js  # Entry point
├── template/         # React/Vite presentation engine
│   ├── src/
│   │   ├── templates/  # 33 slide type components
│   │   ├── components/ # UI: presenter view, gallery, feedback, etc.
│   │   ├── agent/      # AI agent API: tools, prompts, ingest, templates
│   │   ├── hooks/      # React hooks (analytics, laser pointer, auth)
│   │   └── lib/        # Deck loader, analytics, InstantDB
│   ├── api/            # Serverless API (auth, deck storage)
│   └── vite.config.ts  # Custom plugin for thin deck resolution
├── Formula/          # Homebrew formula
└── install.sh        # One-liner installer
```

## Tech Stack

| Layer | Tech |
|---|---|
| **Rendering** | React 19, Framer Motion, Tailwind CSS 3 |
| **Bundler** | Vite 7 |
| **CLI** | TypeScript, Commander, Chalk, Execa |
| **Export** | Puppeteer (PDF + PNG) |
| **Live Feedback** | InstantDB (real-time reactions, comments) |
| **Cloud Storage** | Vercel Blob, Neon Postgres, Drizzle ORM |
| **Auth** | JWT (Jose), bcrypt |
| **Search** | Fuse.js (fuzzy search) |
| **Icons** | Lucide React |

## Configuration

Throughline stores its config in `~/.throughline/`:

```
~/.throughline/
├── config.json    # Template path, decks directory, port range
└── registry.json  # All registered decks with paths, ports, URLs
```

Default config:

```json
{
  "template_path": "~/.throughline/install/template",
  "decks_path": "~/decks",
  "port_range": [5173, 5199]
}
```

## Requirements

- **Node.js** >= 20 (the installer handles this)
- **npm** (comes with Node.js)
- **git** (for install.sh and self-update)

## Disclaimer

This is a hobby project, close to 100% vibe coded. It scratches a personal itch — maybe other people find it useful too.

## License

MIT
