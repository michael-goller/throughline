# Shine

A keyboard-first presentation system with live audience feedback.

## Structure

```
shine/
├── template/     # React/Vite slide deck template
├── cli/          # shine-deck CLI for managing decks
└── README.md
```

## Quick Start

```bash
# Install CLI dependencies
cd cli && npm install

# Create a new deck
./cli/bin/shine.js new my-deck

# Start the deck
./cli/bin/shine.js serve my-deck

# Open in browser
./cli/bin/shine.js open my-deck
```

## Template

The `template/` folder contains the React/Vite presentation app. See `template/README.md` for slide types and configuration.

## CLI Commands

- `shine new <name>` - Create a new deck
- `shine serve <name>` - Start dev server
- `shine stop <name>` - Stop dev server
- `shine ls` - List all decks
- `shine open <name>` - Open in browser
- `shine export <name>` - Export to PDF

## Keyboard Shortcuts

- `j/k` or `→/←` - Next/previous slide
- `gg` / `G` - First/last slide
- `/` - Search slides
- `s` - Star/unstar slide
- `h` - Hide/show slide
- `i` - Feedback mode
- `?` - Help
