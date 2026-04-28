#!/usr/bin/env node
/**
 * Throughline CLI - The dev-native way to make decks.
 */

import { program } from 'commander'
import chalk from 'chalk'
import { formatPath, getTemplatePath } from './lib/config.js'
import {
  createDeck,
  isFullDeck,
  isGalleryRunning,
  isRunning,
  isThinDeck,
  openInBrowser,
  openUrl,
  startDeck,
  startGallery,
  stopAllDecks,
  stopDeck,
  stopGallery,
} from './lib/deck.js'
import { pickDeck } from './lib/picker.js'
import { addDeck, getDeck, getGalleryState, listDecks, removeDeck, renameDeck, updateDeckPublished } from './lib/registry.js'
import { login as cloudLogin, clearCredentials, whoami as cloudWhoami, publish as cloudPublish, unpublish as cloudUnpublish, loadCredentials, getApiUrl, setApiUrl, createShare, listShares, deleteShare } from './lib/cloud.js'
import { runShape, readBrief, resolveBriefPath, BRIEF_FILENAME } from './lib/shape.js'
import { createDeckFromBrief } from './lib/brief.js'
import { checkDeck } from './lib/check.js'
import { runOnboard } from './lib/onboard.js'
import { installSkills, parseInstallTarget } from './lib/install.js'
import { createInterface } from 'readline'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { version: CLI_VERSION } = require('../package.json') as { version: string }

// Thread-red brand color — matches throughline-site repo's throughline-tokens.css (--accent-primary dark).
const THREAD_RED = '#B91C1C'
const brand = (s: string) => (chalk.level > 0 ? chalk.hex(THREAD_RED)(s) : s)

// Thread-motif banner: ──── throughline ────
function banner(): string {
  const thread = '────'
  const mark = brand(`${thread} throughline ${thread}`)
  return `\n${mark}\n${chalk.dim('the dev-native way to make decks')}\n`
}

program
  .name('throughline')
  .description('The dev-native way to make decks')
  .version(CLI_VERSION)
  .addHelpText('beforeAll', banner())

// ─────────────────────────────────────────────────────────────
// throughline new <name>
// ─────────────────────────────────────────────────────────────
program
  .command('new <name>')
  .description('Create a new slide deck')
  .option('--full', 'Create full deck (copy entire template)')
  .option('--here', 'Create in current directory instead of ~/decks/')
  .option('--from-brief [path]', `Scaffold from a ${BRIEF_FILENAME} (default: ./)`)
  .action((name: string, options: { full?: boolean; here?: boolean; fromBrief?: string | boolean }) => {
    try {
      const targetDir = options.here ? (name === '.' ? process.cwd() : `${process.cwd()}/${name}`) : undefined
      const deckName = name === '.' ? process.cwd().split('/').pop()! : name

      if (options.fromBrief) {
        if (options.full) {
          throw new Error('--from-brief generates a thin deck; it can not be combined with --full.')
        }
        const briefInput = typeof options.fromBrief === 'string' ? options.fromBrief : undefined
        const briefPath = resolveBriefPath(briefInput, process.cwd())
        const brief = readBrief(briefPath)

        const deckPath = createDeckFromBrief(deckName, brief, { targetDir })

        console.log(chalk.green(`✓ Created deck '${deckName}' from brief at ${formatPath(deckPath)}`))
        console.log(`→ Throughline: ${chalk.italic(brief.throughline)}`)
        console.log(`→ Evidence slides: ${brief.evidence.length}`)
        console.log(`→ Edit slides: ${formatPath(deckPath)}/slides.config.ts`)
        console.log(`→ Start server: throughline serve ${deckName}`)
        return
      }

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
      console.log(`→ Start server: throughline serve ${deckName}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline onboard
// ─────────────────────────────────────────────────────────────
program
  .command('onboard')
  .description('Guided walkthrough — install → first deck → published share link')
  .option('--here', 'Create the example deck in the current directory instead of ~/decks/')
  .option('--example <key>', 'Skip the picker and use a specific example (board-update|design-proposal|incident-retro)')
  .option('--name <deckName>', 'Skip the deck-name prompt and use this name')
  .action(async (options: { here?: boolean; example?: string; name?: string }) => {
    try {
      await runOnboard({ here: options.here, autoExample: options.example, autoDeckName: options.name })
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline install <claude-skills|gemini-skills>
// ─────────────────────────────────────────────────────────────
program
  .command('install <target>')
  .description('Install bundled agent skills (claude-skills | gemini-skills)')
  .option('--force', 'Overwrite existing files of the same name')
  .option('--dry-run', 'Print planned copies without touching disk')
  .action((target: string, options: { force?: boolean; dryRun?: boolean }) => {
    try {
      const flavor = parseInstallTarget(target)
      const result = installSkills(flavor, { force: options.force, dryRun: options.dryRun })

      if (options.dryRun) {
        console.log(chalk.bold(`Dry run — ${result.label} skills → ${formatPath(result.destDir)}`))
        for (const filename of result.wouldCopy) {
          console.log(`  → would copy ${filename}`)
        }
        console.log(chalk.dim('\nNo files were written. Re-run without --dry-run to install.'))
        return
      }

      for (const filename of result.installed) {
        console.log(chalk.green(`✓ installed ${filename}`))
      }
      for (const filename of result.skipped) {
        console.log(chalk.dim(`↷ skipped ${filename} (exists — pass --force to overwrite)`))
      }

      console.log('')
      if (result.installed.length > 0) {
        console.log(chalk.green(`✓ ${result.label} skills installed to ${formatPath(result.destDir)}`))
      } else {
        console.log(`${result.label} skills already present at ${formatPath(result.destDir)}`)
      }
      console.log(`→ ${result.invocationHint}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline shape
// ─────────────────────────────────────────────────────────────
program
  .command('shape')
  .description('Run the Shape flow — capture your throughline before building slides')
  .option('--out <path>', `Directory to write ${BRIEF_FILENAME} into`, process.cwd())
  .option('--force', 'Overwrite an existing brief file')
  .action(async (options: { out: string; force?: boolean }) => {
    try {
      const { path, brief } = await runShape(options.out, { force: options.force })
      console.log(chalk.green(`\n✓ Wrote ${formatPath(path)}`))
      console.log(`→ Throughline: ${chalk.italic(brief.throughline)}`)
      console.log(`→ Next: throughline new <name> --from-brief`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline check [name]
// ─────────────────────────────────────────────────────────────
program
  .command('check [name]')
  .description('Lint a deck — warns if the throughline statement is missing')
  .option('--path <dir>', 'Path to a deck directory (overrides [name])')
  .action((name: string | undefined, options: { path?: string }) => {
    try {
      let deckDir: string
      let label: string

      if (options.path) {
        deckDir = options.path
        label = formatPath(options.path)
      } else if (name) {
        const deck = getDeck(name)
        if (!deck) {
          console.log(chalk.red(`✗ Deck '${name}' not found in registry`))
          process.exit(1)
        }
        deckDir = deck.path
        label = name
      } else {
        deckDir = process.cwd()
        label = formatPath(deckDir)
      }

      const result = checkDeck(deckDir)

      console.log(chalk.bold(`\nthroughline check: ${label}`))
      console.log(`  config:     ${formatPath(result.configFile)}`)
      console.log(`  title:      ${result.title ?? chalk.dim('(none)')}`)
      console.log(`  throughline:${result.throughline ? ' ' + chalk.italic(result.throughline) : ' ' + chalk.dim('(missing)')}`)
      console.log(`  slides:     ${result.slideCount}`)

      if (result.issues.length === 0) {
        console.log(chalk.green('\n✓ All checks passed.'))
        return
      }

      const errors = result.issues.filter((i) => i.severity === 'error')
      const warnings = result.issues.filter((i) => i.severity === 'warning')

      console.log('')
      for (const issue of result.issues) {
        const tag = issue.severity === 'error' ? chalk.red('✗ error') : chalk.yellow('! warning')
        console.log(`${tag}  ${chalk.dim(issue.rule)}  ${issue.message}`)
        if (issue.hint) console.log(`         ${chalk.dim(issue.hint)}`)
      }

      if (errors.length > 0) {
        process.exit(1)
      } else if (warnings.length > 0) {
        process.exit(2)
      }
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline add <name> [path]
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
    console.log(`→ Start server: throughline serve ${name}`)
  })

// ─────────────────────────────────────────────────────────────
// throughline rm [name]
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
// throughline rename <old-name> <new-name>
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
// throughline serve [name]
// ─────────────────────────────────────────────────────────────
program
  .command('serve [name]')
  .description("Start a deck's dev server (no name = pick from list)")
  .option('-p, --port <port>', 'Port number to use', parseInt)
  .option('--gallery', 'Start the gallery server instead of a single deck')
  .action(async (name?: string, options?: { port?: number; gallery?: boolean }) => {
    try {
      if (options?.gallery) {
        // Explicit --gallery flag — start the gallery server
        const { pid, port } = await startGallery(options?.port)
        console.log(chalk.green(`✓ Started gallery on http://localhost:${port}`))
        console.log(`→ PID: ${pid}`)
        console.log(`→ Stop with: throughline stop --gallery`)
        return
      }

      if (!name) {
        // No deck specified — interactive picker
        name = pickDeck('Serve deck') ?? undefined
        if (!name) return
      }

      const { pid, port } = await startDeck(name, options?.port)
      const deckUrl = `http://localhost:${port}/decks/${name}`
      console.log(chalk.green(`✓ Started '${name}' on ${deckUrl}`))
      console.log(`→ PID: ${pid}`)
      console.log(`→ Stop with: throughline stop ${name}`)
      // Auto-open in browser
      await new Promise((r) => setTimeout(r, 1000))
      openUrl(deckUrl)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline stop [name]
// ─────────────────────────────────────────────────────────────
program
  .command('stop [name]')
  .description("Stop a deck's dev server")
  .option('--all', 'Stop all running decks (including gallery)')
  .option('--gallery', 'Stop the gallery server')
  .action((name?: string, options?: { all?: boolean; gallery?: boolean }) => {
    if (options?.all) {
      const stopped = stopAllDecks()
      const galleryWasRunning = stopGallery()
      if (galleryWasRunning) {
        console.log(chalk.green(`✓ Stopped gallery`))
      }
      if (stopped.length > 0) {
        stopped.forEach((n) => console.log(chalk.green(`✓ Stopped '${n}'`)))
      }
      if (!galleryWasRunning && stopped.length === 0) {
        console.log('No running decks to stop')
      }
      return
    }

    if (options?.gallery) {
      if (stopGallery()) {
        console.log(chalk.green(`✓ Stopped gallery`))
      } else {
        console.log('Gallery was not running')
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
// throughline ls
// ─────────────────────────────────────────────────────────────
program
  .command('ls')
  .description('List all decks')
  .action(() => {
    const decks = listDecks()

    // Show gallery status if running
    if (isGalleryRunning()) {
      const state = getGalleryState()
      console.log(chalk.green(`▶︎ Gallery running → http://localhost:${state.port}`))
      console.log()
    }

    if (decks.length === 0) {
      console.log('No decks found. Create one with: throughline new <name>')
      return
    }

    // Determine max name width
    const maxName = Math.max(4, ...decks.map(([n]) => n.length)) + 2

    console.log(`${'NAME'.padEnd(maxName)} ${'PUBLISHED'.padEnd(52)} PATH`)

    for (const [name, deck] of decks) {
      const published = deck.publishedUrl
        ? chalk.green('✓') + ' ' + deck.publishedUrl
        : chalk.dim('—')
      const path = formatPath(deck.path)
      // chalk adds ~10 hidden chars for color codes
      const pubPad = deck.publishedUrl ? 62 : 63

      console.log(`${name.padEnd(maxName)} ${published.padEnd(pubPad)} ${path}`)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline open [name]
// ─────────────────────────────────────────────────────────────
program
  .command('open [name]')
  .description('Open a deck in the browser (no name = gallery; starts server if needed)')
  .action(async (name?: string) => {
    try {
      if (!name) {
        // No deck specified — open the gallery
        if (!isGalleryRunning()) {
          console.log('Starting gallery...')
          const { port } = await startGallery()
          console.log(chalk.green(`✓ Started gallery on http://localhost:${port}`))
          await new Promise((r) => setTimeout(r, 1000))
        }

        const state = getGalleryState()
        const url = `http://localhost:${state.port}`
        if (openUrl(url)) {
          console.log(chalk.green(`✓ Opening ${url} in browser`))
        } else {
          console.log(chalk.red(`✗ Failed to open browser`))
          process.exit(1)
        }
        return
      }

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
        await new Promise((r) => setTimeout(r, 1000))
      }

      if (openInBrowser(name)) {
        const updatedDeck = getDeck(name)
        console.log(chalk.green(`✓ Opening http://localhost:${updatedDeck?.port}/decks/${name} in browser`))
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
// throughline status [name]
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
      console.log(`URL: http://localhost:${deck.port}/decks/${name}`)
    }

    if (deck.created_at) {
      console.log(`Created: ${deck.created_at}`)
    }

    if (deck.started_at) {
      console.log(`Started: ${deck.started_at}`)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline export [name]
// ─────────────────────────────────────────────────────────────
program
  .command('export [name]')
  .description('Export slides to PNG/PDF (deck must be running)')
  .option('--png', 'Export PNGs only, no PDF')
  .option('--light', 'Export in light mode (default: dark)')
  .option('--slides <range>', 'Slide selection (e.g., 1,3,5-7)')
  .option('--quality <level>', 'Quality: high/medium/low', 'medium')
  .action(async (name?: string, options?: { png?: boolean; light?: boolean; slides?: string; quality?: string }) => {
    if (!name) {
      name = pickDeck('Export deck') ?? undefined
      if (!name) return
    }

    const deck = getDeck(name)
    if (!deck) {
      console.log(chalk.red(`✗ Deck '${name}' not found`))
      process.exit(1)
    }

    if (!isRunning(name)) {
      console.log(chalk.red(`✗ Deck '${name}' is not running`))
      console.log(`→ Start it first: throughline serve ${name}`)
      process.exit(1)
    }

    const { execSync } = await import('child_process')
    const { existsSync, mkdirSync } = await import('fs')
    const { join } = await import('path')

    const deckPath = deck.path
    const port = deck.port
    const theme = options?.light ? 'light' : 'dark'
    const quality = options?.quality || 'medium'

    // For thin decks, run from template directory
    const runDir = isThinDeck(deckPath) ? getTemplatePath() : deckPath

    // Ensure export directory in the deck folder
    const exportDir = join(deckPath, 'export')
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true })
    }

    // Build npm command
    const npmScript = options?.png ? 'export:png' : 'export'
    let cmd = `npm run ${npmScript}`

    const extraArgs: string[] = []
    if (options?.slides) extraArgs.push(`--slides=${options.slides}`)
    if (quality !== 'medium') extraArgs.push(`--quality=${quality}`)

    if (extraArgs.length > 0) {
      cmd += ` -- ${extraArgs.join(' ')}`
    }

    console.log(`Exporting '${name}' (${theme} mode, ${quality} quality)...`)

    try {
      const env: Record<string, string> = {
        ...process.env as Record<string, string>,
        EXPORT_PORT: String(port),
        EXPORT_THEME: theme,
        EXPORT_OUTPUT: exportDir,
      }
      if (isThinDeck(deckPath)) {
        env.DECK_PATH = deckPath
      }

      execSync(cmd, { cwd: runDir, env, stdio: 'inherit' })
      console.log(chalk.green(`✓ Export complete`))
      console.log(`→ Files in: ${formatPath(exportDir)}`)
    } catch {
      console.log(chalk.red(`✗ Export failed`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline cloud [url]
// ─────────────────────────────────────────────────────────────
program
  .command('cloud [url]')
  .description('Show or set the Throughline cloud API URL')
  .action((url?: string) => {
    if (url) {
      // Remove trailing slash
      const cleanUrl = url.replace(/\/+$/, '')
      setApiUrl(cleanUrl)
      console.log(chalk.green(`✓ API URL set to ${cleanUrl}`))
    } else {
      console.log(`API URL: ${getApiUrl()}`)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline login
// ─────────────────────────────────────────────────────────────
program
  .command('login')
  .description('Log in to Throughline cloud')
  .option('--email <email>', 'Email address')
  .option('--password <password>', 'Password')
  .action(async (options: { email?: string; password?: string }) => {
    try {
      const email = options.email || await promptInput('Email: ')
      const password = options.password || await promptInput('Password: ', true)
      const user = await cloudLogin(email, password)
      console.log(chalk.green(`✓ Logged in as ${user.name} (${user.email})`))
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline logout
// ─────────────────────────────────────────────────────────────
program
  .command('logout')
  .description('Log out of Throughline cloud')
  .action(() => {
    clearCredentials()
    console.log(chalk.green('✓ Logged out'))
  })

// ─────────────────────────────────────────────────────────────
// throughline whoami
// ─────────────────────────────────────────────────────────────
program
  .command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    try {
      const creds = loadCredentials()
      if (!creds) {
        console.log('Not logged in. Run: throughline login')
        process.exit(1)
      }
      const user = await cloudWhoami()
      if (!user) {
        console.log('Session expired. Run: throughline login')
        process.exit(1)
      }
      console.log(`${user.name} (${user.email})`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline publish [name]
// ─────────────────────────────────────────────────────────────
program
  .command('publish [name]')
  .description('Publish a deck to Throughline cloud')
  .action(async (name?: string) => {
    try {
      if (!name) {
        name = pickDeck('Publish deck') ?? undefined
        if (!name) return
      }

      const deck = getDeck(name)
      if (!deck) {
        console.log(chalk.red(`✗ Deck '${name}' not found`))
        process.exit(1)
      }

      console.log(`Publishing '${name}'...`)
      const result = await cloudPublish(deck.path)
      updateDeckPublished(name, result.url)
      console.log(chalk.green(`✓ Published`))
      console.log(`→ URL: ${result.url}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline unpublish [name]
// ─────────────────────────────────────────────────────────────
program
  .command('unpublish [name]')
  .description('Remove a published deck from Throughline cloud')
  .action(async (name?: string) => {
    try {
      if (!name) {
        name = pickDeck('Unpublish deck') ?? undefined
        if (!name) return
      }

      await cloudUnpublish(name)
      updateDeckPublished(name, null)
      console.log(chalk.green(`✓ Deck '${name}' unpublished`))
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline share <name>
// ─────────────────────────────────────────────────────────────
program
  .command('share [name]')
  .description('Create a password-protected viewer link for a published deck')
  .requiredOption('--password <password>', 'Viewer password (min 8 characters)')
  .option('--label <label>', 'Label for tracking (e.g. "Board meeting")')
  .option('--expires <duration>', 'Expiry (e.g. "7d", "24h", "2026-04-30")')
  .action(async (name: string | undefined, options: { password: string; label?: string; expires?: string }) => {
    try {
      if (!name) {
        name = pickDeck('Share deck') ?? undefined
        if (!name) return
      }

      // Parse expiry
      let expiresAt: string | undefined
      if (options.expires) {
        const match = options.expires.match(/^(\d+)([dhm])$/)
        if (match) {
          const amount = parseInt(match[1])
          const unit = match[2]
          const ms = unit === 'd' ? amount * 86400000 : unit === 'h' ? amount * 3600000 : amount * 60000
          expiresAt = new Date(Date.now() + ms).toISOString()
        } else {
          // Try as date string
          expiresAt = new Date(options.expires).toISOString()
        }
      }

      const result = await createShare(name, options.password, { label: options.label, expiresAt })
      console.log(chalk.green(`✓ Share link created`))
      console.log(`→ URL: ${result.viewUrl}`)
      console.log(`→ Password: ${options.password}`)
      if (result.label) console.log(`→ Label: ${result.label}`)
      if (result.expiresAt) console.log(`→ Expires: ${new Date(result.expiresAt).toLocaleString()}`)
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline shares [name]
// ─────────────────────────────────────────────────────────────
program
  .command('shares [name]')
  .description('List share links for a deck')
  .action(async (name?: string) => {
    try {
      if (!name) {
        name = pickDeck('List shares for') ?? undefined
        if (!name) return
      }

      const tokens = await listShares(name)
      if (tokens.length === 0) {
        console.log(`No share links for '${name}'. Create one with: throughline share ${name} --password <pw>`)
        return
      }

      console.log(`Share links for '${name}':\n`)
      for (const t of tokens) {
        const label = t.label ? ` (${t.label})` : ''
        const expires = t.expiresAt ? ` expires ${new Date(t.expiresAt).toLocaleString()}` : ''
        console.log(`  ${t.shortId}${label}${expires}`)
        console.log(`  ${chalk.dim(t.viewUrl)}`)
        console.log()
      }
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline unshare [name]
// ─────────────────────────────────────────────────────────────
program
  .command('unshare [name]')
  .description('Revoke share links for a deck')
  .option('--all', 'Revoke all share links')
  .option('--token <id>', 'Revoke a specific share token')
  .action(async (name: string | undefined, options: { all?: boolean; token?: string }) => {
    try {
      if (!name) {
        name = pickDeck('Unshare deck') ?? undefined
        if (!name) return
      }

      if (!options.all && !options.token) {
        console.log(chalk.red('✗ Specify --all or --token <id>'))
        process.exit(1)
      }

      await deleteShare(name, { all: options.all, tokenId: options.token })
      if (options.all) {
        console.log(chalk.green(`✓ All share links for '${name}' revoked`))
      } else {
        console.log(chalk.green(`✓ Share token '${options.token}' revoked`))
      }
    } catch (err) {
      console.log(chalk.red(`✗ ${(err as Error).message}`))
      process.exit(1)
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline update
// ─────────────────────────────────────────────────────────────
program
  .command('update')
  .description('Update Throughline to the latest version')
  .action(async () => {
    const { execSync } = await import('child_process')
    const { existsSync } = await import('fs')
    const { join } = await import('path')

    // Determine install location
    const throughlineHome = process.env.THROUGHLINE_HOME || join(process.env.HOME || '', '.throughline')
    const installDir = join(throughlineHome, 'install')

    if (existsSync(join(installDir, '.git'))) {
      // Git-based install (from install.sh)
      console.log('Pulling latest changes...')
      try {
        execSync('git pull --ff-only origin main', { cwd: installDir, stdio: 'inherit' })
      } catch {
        console.log(chalk.yellow('Fast-forward failed, trying merge...'))
        execSync('git pull origin main', { cwd: installDir, stdio: 'inherit' })
      }

      console.log('Rebuilding CLI...')
      execSync('npm install --no-audit --no-fund', { cwd: join(installDir, 'cli'), stdio: 'inherit' })
      execSync('npm run build', { cwd: join(installDir, 'cli'), stdio: 'inherit' })

      console.log('Updating template dependencies...')
      execSync('npm install --no-audit --no-fund', { cwd: join(installDir, 'template'), stdio: 'inherit' })

      console.log(chalk.green('✓ Throughline updated to latest'))
    } else {
      // npm-based or manual install — try npm update
      console.log('Checking for updates via npm...')
      try {
        execSync('npm update -g throughline', { stdio: 'inherit' })
        console.log(chalk.green('✓ Throughline updated'))
      } catch {
        console.log(chalk.yellow('Could not auto-update.'))
        console.log('Re-run the install script:')
        console.log('  curl -fsSL https://raw.githubusercontent.com/michael-goller/throughline/main/install.sh | bash')
      }
    }
  })

// ─────────────────────────────────────────────────────────────
// throughline doctor
// ─────────────────────────────────────────────────────────────
program
  .command('doctor')
  .description('Check Throughline installation health')
  .action(async () => {
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const { execSync } = await import('child_process')

    let issues = 0
    const check = (label: string, ok: boolean, fix?: string) => {
      if (ok) {
        console.log(chalk.green('  ✓') + `  ${label}`)
      } else {
        console.log(chalk.red('  ✗') + `  ${label}`)
        if (fix) console.log(chalk.dim(`     → ${fix}`))
        issues++
      }
    }

    console.log(chalk.bold('Throughline Doctor\n'))

    // Node.js version
    const nodeVer = process.versions.node
    const nodeMajor = parseInt(nodeVer.split('.')[0])
    check(`Node.js v${nodeVer}`, nodeMajor >= 20, 'Upgrade to Node.js 20+')

    // npm
    let npmVer = ''
    try { npmVer = execSync('npm -v', { encoding: 'utf-8' }).trim() } catch {}
    check(`npm v${npmVer || 'not found'}`, !!npmVer, 'Install npm')

    // git
    let gitVer = ''
    try { gitVer = execSync('git --version', { encoding: 'utf-8' }).trim().replace('git version ', '') } catch {}
    check(`git ${gitVer || 'not found'}`, !!gitVer, 'Install git')

    // Template directory
    const templatePath = getTemplatePath()
    check(`Template: ${formatPath(templatePath)}`, existsSync(templatePath), 'Re-run install.sh')

    // Template node_modules
    const templateModules = join(templatePath, 'node_modules')
    check('Template dependencies installed', existsSync(templateModules), `cd ${formatPath(templatePath)} && npm install`)

    // Config
    const throughlineDir = join(process.env.HOME || '', '.throughline')
    check(`Config dir: ${formatPath(throughlineDir)}`, existsSync(throughlineDir))

    // Registry
    const registry = join(throughlineDir, 'registry.json')
    check('Registry file exists', existsSync(registry))

    console.log('')
    if (issues === 0) {
      console.log(chalk.green('All checks passed.'))
    } else {
      console.log(chalk.yellow(`${issues} issue${issues > 1 ? 's' : ''} found — see fixes above.`))
    }
  })

/** Prompt for user input */
function promptInput(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    if (hidden) {
      process.stdout.write(question)
      let input = ''
      process.stdin.setRawMode?.(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf-8')
      const onData = (char: string) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode?.(false)
          process.stdin.removeListener('data', onData)
          process.stdout.write('\n')
          resolve(input)
        } else if (char === '\u0003') {
          process.exit(1)
        } else if (char === '\u007F' || char === '\b') {
          input = input.slice(0, -1)
        } else {
          input += char
        }
      }
      process.stdin.on('data', onData)
    } else {
      const rl = createInterface({ input: process.stdin, output: process.stdout })
      rl.question(question, (answer: string) => {
        rl.close()
        resolve(answer)
      })
    }
  })
}

program.parse()
