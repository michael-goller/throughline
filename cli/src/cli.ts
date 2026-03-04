#!/usr/bin/env node
/**
 * Shine CLI - Beautiful decks made simple.
 */

import { program } from 'commander'
import chalk from 'chalk'
import { formatPath } from './lib/config.js'
import {
  createDeck,
  isFullDeck,
  isRunning,
  isThinDeck,
  openInBrowser,
  startDeck,
  stopAllDecks,
  stopDeck,
} from './lib/deck.js'
import { pickDeck } from './lib/picker.js'
import { addDeck, getDeck, listDecks, removeDeck, renameDeck } from './lib/registry.js'

program
  .name('shine')
  .description('Beautiful slide decks made simple')
  .version('0.1.0')

// ─────────────────────────────────────────────────────────────
// shine new <name>
// ─────────────────────────────────────────────────────────────
program
  .command('new <name>')
  .description('Create a new slide deck')
  .option('--full', 'Create full deck (copy entire template)')
  .option('--here', 'Create in current directory instead of ~/decks/')
  .action((name: string, options: { full?: boolean; here?: boolean }) => {
    try {
      const targetDir = options.here ? (name === '.' ? process.cwd() : `${process.cwd()}/${name}`) : undefined
      const deckName = name === '.' ? process.cwd().split('/').pop()! : name

      const deckPath = createDeck(deckName, {
        targetDir,
        thin: !options.full,
      })

      const deckType = options.full ? 'full' : 'thin'
      console.log(chalk.green(`✓ Created ${deckType} deck '${deckName}' at ${formatPath(deckPath)}`))

      if (options.full) {
        console.log(`→ Edit slides: ${formatPath(deckPath)}/src/slides.config.ts`)
      } else {
        console.log(`→ Edit slides: ${formatPath(deckPath)}/slides.config.ts`)
        console.log(`→ Add images: ${formatPath(deckPath)}/public/`)
      }
      console.log(`→ Start server: shine serve ${deckName}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// shine add <name> [path]
// ─────────────────────────────────────────────────────────────
program
  .command('add <name> [path]')
  .description('Register an existing deck directory')
  .action((name: string, path?: string) => {
    const deckPath = path ? path : process.cwd()

    if (getDeck(name)) {
      console.log(chalk.red(`✗ Deck '${name}' already exists in registry`))
      process.exit(1)
    }

    let deckType: string
    if (isThinDeck(deckPath)) {
      deckType = 'thin'
    } else if (isFullDeck(deckPath)) {
      deckType = 'full'
    } else {
      console.log(chalk.red(`✗ Not a valid deck directory`))
      console.log('  Expected either:')
      console.log('  - slides.config.ts (thin deck)')
      console.log('  - src/slides.config.ts + package.json (full deck)')
      process.exit(1)
    }

    addDeck(name, deckPath)
    console.log(chalk.green(`✓ Registered ${deckType} deck '${name}' at ${formatPath(deckPath)}`))
    console.log(`→ Start server: shine serve ${name}`)
  })

// ─────────────────────────────────────────────────────────────
// shine rm [name]
// ─────────────────────────────────────────────────────────────
program
  .command('rm [name]')
  .description('Unregister a deck (files are kept)')
  .action((name?: string) => {
    if (!name) {
      name = pickDeck('Remove deck') ?? undefined
      if (!name) return
    }

    const deck = getDeck(name)
    if (!deck) {
      console.log(chalk.red(`✗ Deck '${name}' not found`))
      process.exit(1)
    }

    if (isRunning(name)) {
      stopDeck(name)
      console.log('→ Stopped running server')
    }

    removeDeck(name)
    console.log(chalk.green(`✓ Unregistered '${name}'`))
    console.log(`→ Files kept at: ${formatPath(deck.path)}`)
  })

// ─────────────────────────────────────────────────────────────
// shine rename <old-name> <new-name>
// ─────────────────────────────────────────────────────────────
program
  .command('rename <old-name> <new-name>')
  .description('Rename a deck in the registry')
  .action((oldName: string, newName: string) => {
    const deck = getDeck(oldName)
    if (!deck) {
      console.log(chalk.red(`✗ Deck '${oldName}' not found`))
      process.exit(1)
    }

    if (getDeck(newName)) {
      console.log(chalk.red(`✗ Deck '${newName}' already exists`))
      process.exit(1)
    }

    // Stop if running before renaming
    if (isRunning(oldName)) {
      stopDeck(oldName)
      console.log(`→ Stopped running server`)
    }

    try {
      renameDeck(oldName, newName)
      console.log(chalk.green(`✓ Renamed '${oldName}' to '${newName}'`))
      console.log(`→ Path: ${formatPath(deck.path)}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// shine serve [name]
// ─────────────────────────────────────────────────────────────
program
  .command('serve [name]')
  .description("Start a deck's dev server")
  .option('-p, --port <port>', 'Port number to use', parseInt)
  .action(async (name?: string, options?: { port?: number }) => {
    if (!name) {
      name = pickDeck('Start deck') ?? undefined
      if (!name) return
    }

    try {
      const { pid, port } = await startDeck(name, options?.port)
      console.log(chalk.green(`✓ Started '${name}' on http://localhost:${port}`))
      console.log(`→ PID: ${pid}`)
      console.log(`→ Stop with: shine stop ${name}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// shine stop [name]
// ─────────────────────────────────────────────────────────────
program
  .command('stop [name]')
  .description("Stop a deck's dev server")
  .option('--all', 'Stop all running decks')
  .action((name?: string, options?: { all?: boolean }) => {
    if (options?.all) {
      const stopped = stopAllDecks()
      if (stopped.length > 0) {
        stopped.forEach((n) => console.log(chalk.green(`✓ Stopped '${n}'`)))
      } else {
        console.log('No running decks to stop')
      }
      return
    }

    if (!name) {
      name = pickDeck('Stop deck') ?? undefined
      if (!name) return
    }

    try {
      if (stopDeck(name)) {
        console.log(chalk.green(`✓ Stopped '${name}'`))
      } else {
        console.log(`'${name}' was not running`)
      }
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// shine ls
// ─────────────────────────────────────────────────────────────
program
  .command('ls')
  .description('List all decks')
  .action(() => {
    const decks = listDecks()

    if (decks.length === 0) {
      console.log('No decks found. Create one with: shine new <name>')
      return
    }

    console.log(`${'NAME'.padEnd(20)} ${'STATUS'.padEnd(12)} ${'PORT'.padEnd(8)} PATH`)

    for (const [name, deck] of decks) {
      const running = isRunning(name)
      const status = running ? chalk.green('▶︎ running') : chalk.red('⏹ stopped')
      const port = deck.port ? String(deck.port) : '-'
      const path = formatPath(deck.path)

      console.log(`${name.padEnd(20)} ${status.padEnd(21)} ${port.padEnd(8)} ${path}`)
    }
  })

// ─────────────────────────────────────────────────────────────
// shine open [name]
// ─────────────────────────────────────────────────────────────
program
  .command('open [name]')
  .description('Open a deck in the browser (starts server if needed)')
  .action(async (name?: string) => {
    if (!name) {
      name = pickDeck('Open deck') ?? undefined
      if (!name) return
    }

    try {
      const deck = getDeck(name)
      if (!deck) {
        console.log(chalk.red(`✗ Deck '${name}' not found`))
        process.exit(1)
      }

      // Start if not running
      if (!isRunning(name)) {
        console.log(`Starting '${name}'...`)
        const { port } = await startDeck(name)
        console.log(chalk.green(`✓ Started on http://localhost:${port}`))

        // Give server a moment to start
        await new Promise((r) => setTimeout(r, 1000))
      }

      if (openInBrowser(name)) {
        const updatedDeck = getDeck(name)
        console.log(chalk.green(`✓ Opening http://localhost:${updatedDeck?.port} in browser`))
      } else {
        console.log(chalk.red(`✗ Failed to open browser`))
        process.exit(1)
      }
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// shine status [name]
// ─────────────────────────────────────────────────────────────
program
  .command('status [name]')
  .description('Show detailed status of a deck')
  .action((name?: string) => {
    if (!name) {
      name = pickDeck('Show status') ?? undefined
      if (!name) return
    }

    const deck = getDeck(name)

    if (!deck) {
      console.log(chalk.red(`✗ Deck '${name}' not found`))
      process.exit(1)
    }

    const running = isRunning(name)

    console.log(`Deck: ${name}`)
    console.log(`Path: ${formatPath(deck.path)}`)
    console.log(`Type: ${isThinDeck(deck.path) ? 'thin' : 'full'}`)
    console.log(`Status: ${running ? chalk.green('running') : 'stopped'}`)

    if (running) {
      console.log(`Port: ${deck.port}`)
      console.log(`PID: ${deck.pid}`)
      console.log(`URL: http://localhost:${deck.port}`)
    }

    if (deck.created_at) {
      console.log(`Created: ${deck.created_at}`)
    }

    if (deck.started_at) {
      console.log(`Started: ${deck.started_at}`)
    }
  })

program.parse()
