/**
 * `throughline onboard` — guided 5-step walkthrough that takes a new user
 * from install to first published deck. Shares agent detection + example
 * deck generation with the other CLI surfaces.
 */

import { execSync, spawnSync } from 'child_process'
import chalk from 'chalk'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createInterface, type Interface as ReadlineInterface } from 'readline'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createDeck } from './deck.js'
import {
  EXAMPLE_DECKS,
  EXAMPLE_DECK_ORDER,
  renderExampleConfig,
  type ExampleDeck,
} from './examples.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TERRA_COTTA = '#E2725B'
const brand = (s: string) => (chalk.level > 0 ? chalk.hex(TERRA_COTTA)(s) : s)

export interface AgentDetection {
  kind: 'claude' | 'gemini' | 'none'
  version: string | null
  displayName: string
}

function which(cmd: string): string | null {
  const lookup = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(lookup, [cmd], { encoding: 'utf-8' })
  if (result.status !== 0) return null
  const first = result.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0]
  return first ?? null
}

function tryVersion(cmd: string): string | null {
  try {
    const out = execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim()
    const match = out.match(/\d+\.\d+(?:\.\d+)?/)
    return match ? match[0] : out.split(/\r?\n/)[0] || null
  } catch {
    return null
  }
}

/** Detect a local coding agent on PATH. Prefers Claude Code, then Gemini CLI. */
export function detectAgent(): AgentDetection {
  if (which('claude')) {
    return { kind: 'claude', version: tryVersion('claude'), displayName: 'Claude Code' }
  }
  if (which('gemini')) {
    return { kind: 'gemini', version: tryVersion('gemini'), displayName: 'Gemini CLI' }
  }
  return { kind: 'none', version: null, displayName: 'no coding agent' }
}

interface CliVersionInfo {
  version: string | null
  source: string
}

function readCliVersion(): CliVersionInfo {
  // cli/dist/lib/onboard.js → walk up two dirs to cli/, find package.json
  const candidates = [
    join(__dirname, '..', '..', 'package.json'),
    join(__dirname, '..', '..', '..', 'package.json'),
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const pkg = JSON.parse(readFileSync(p, 'utf-8')) as { version?: string; name?: string }
      if (pkg?.version && pkg.name && /throughline/i.test(pkg.name)) {
        return { version: pkg.version, source: p }
      }
    } catch {
      /* try next */
    }
  }
  return { version: null, source: 'unknown' }
}

function ask(rl: ReadlineInterface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))
}

function printBanner(): void {
  const thread = '────'
  console.log('')
  console.log(brand(`${thread} throughline ${thread}────────────────────────`))
  console.log('')
  console.log(chalk.bold('Welcome.') + ' ' + chalk.dim("Let's get you from zero to a published deck."))
  console.log('')
}

function printStep(n: number, total: number, title: string): void {
  console.log(chalk.bold(`Step ${n}/${total}: ${title}`))
}

function printCheck(label: string, ok: boolean, detail?: string): void {
  const mark = ok ? chalk.green('✓') : chalk.red('✗')
  const detailStr = detail ? chalk.dim(` — ${detail}`) : ''
  console.log(`  ${mark} ${label}${detailStr}`)
}

function agentCommand(deckName: string, agent: AgentDetection): { command: string; fallback?: string } {
  const refinement = `refine ${deckName} — make the opening slide punchier`
  if (agent.kind === 'claude') {
    return { command: `claude "${refinement}"` }
  }
  if (agent.kind === 'gemini') {
    return { command: `gemini "${refinement}"` }
  }
  return {
    command: `<install a coding agent — e.g. Claude Code or Gemini CLI — then re-run onboarding>`,
    fallback: 'Install https://docs.claude.com/en/docs/claude-code/overview or https://ai.google.dev/gemini-api/docs/cli',
  }
}

function pickExample(rl: ReadlineInterface): Promise<ExampleDeck> {
  console.log('  Your first deck should show off what Throughline does.')
  console.log('  Choose a format:')
  console.log('')
  EXAMPLE_DECK_ORDER.forEach((key, i) => {
    const example = EXAMPLE_DECKS[key]
    console.log(`  ${chalk.bold(`[${i + 1}]`)} ${chalk.bold(example.label)} — ${chalk.dim(example.summary)}`)
  })
  console.log('')

  return new Promise((resolve) => {
    const loop = async () => {
      const answer = await ask(rl, '  > ')
      const idx = parseInt(answer, 10)
      if (!Number.isFinite(idx) || idx < 1 || idx > EXAMPLE_DECK_ORDER.length) {
        console.log(chalk.yellow(`  Please enter 1–${EXAMPLE_DECK_ORDER.length}.`))
        return loop()
      }
      resolve(EXAMPLE_DECKS[EXAMPLE_DECK_ORDER[idx - 1]])
    }
    void loop()
  })
}

async function promptDeckName(rl: ReadlineInterface, defaultName: string): Promise<string> {
  const raw = await ask(rl, `  Deck name ${chalk.dim(`[${defaultName}]`)}: `)
  const cleaned = (raw || defaultName).trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '')
  return cleaned || defaultName
}

export interface OnboardOptions {
  /** Write the deck into the current directory instead of ~/decks/. */
  here?: boolean
  /** Skip interactive prompts (used for smoke tests). */
  autoExample?: string
  autoDeckName?: string
}

/**
 * Run the onboarding flow. Returns the created deck path and throughline.
 */
export async function runOnboard(options: OnboardOptions = {}): Promise<void> {
  printBanner()

  // Step 1 — environment
  printStep(1, 5, 'Checking your setup...')
  const cliInfo = readCliVersion()
  printCheck(`throughline CLI${cliInfo.version ? ` v${cliInfo.version}` : ''}`, !!cliInfo.version, cliInfo.version ? undefined : 'version unknown')

  const nodeVer = process.versions.node
  const nodeMajor = parseInt(nodeVer.split('.')[0], 10)
  printCheck(`Node.js v${nodeVer}`, nodeMajor >= 20, nodeMajor >= 20 ? undefined : 'Throughline requires Node.js 20+')
  if (nodeMajor < 20) {
    console.log(chalk.red('\n✗ Please upgrade Node.js before continuing.'))
    process.exit(1)
  }

  const agent = detectAgent()
  if (agent.kind === 'none') {
    printCheck('Coding agent', false, 'none detected — step 4 will still show how to install one')
  } else {
    printCheck(`Agent detected: ${agent.displayName}${agent.version ? ` v${agent.version}` : ''}`, true)
  }
  console.log('')

  // Step 2 — pick example
  printStep(2, 5, 'Pick an example deck')
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const example = options.autoExample
      ? EXAMPLE_DECKS[options.autoExample] ?? EXAMPLE_DECKS[EXAMPLE_DECK_ORDER[0]]
      : await pickExample(rl)
    console.log('')

    // Step 3 — create deck
    printStep(3, 5, `Creating "${example.defaultName}"...`)
    const deckName = options.autoDeckName ?? (options.autoExample ? example.defaultName : await promptDeckName(rl, example.defaultName))

    const targetDir = options.here
      ? (deckName === '.' ? process.cwd() : join(process.cwd(), deckName))
      : undefined

    let deckPath: string
    try {
      deckPath = createDeck(deckName, { targetDir, thin: true })
    } catch (err) {
      console.log(chalk.red(`\n✗ ${(err as Error).message}`))
      console.log(chalk.dim('  Pick a different name or remove the existing directory, then re-run `throughline onboard`.'))
      process.exit(1)
    }

    const configPath = join(deckPath, 'slides.config.ts')
    writeFileSync(configPath, renderExampleConfig(example, deckName), 'utf-8')

    console.log(`  ${chalk.green('✓')} Deck created at ${chalk.dim(configPath)}`)
    console.log(`  ${chalk.green('✓')} Throughline: ${chalk.italic(example.throughline)}`)
    console.log('')

    // Step 4 — preview + agent refinement
    printStep(4, 5, 'Preview your deck')
    console.log('  Run this in another terminal:')
    console.log(`    ${chalk.bold(`throughline serve ${deckName}`)}`)
    console.log(`  Then open ${chalk.dim(`http://localhost:<port>/decks/${deckName}`)}`)
    console.log('')

    const agentCmd = agentCommand(deckName, agent)
    if (agent.kind === 'none') {
      console.log('  To refine with a coding agent, install one first:')
      console.log(chalk.dim(`    ${agentCmd.fallback}`))
      console.log('  Then from this directory:')
      console.log(chalk.dim(`    ${agentCmd.command}`))
    } else {
      console.log(`  To refine with ${agent.displayName}, open a second terminal and run:`)
      console.log(`    ${chalk.bold(agentCmd.command)}`)
    }
    console.log('')

    if (!options.autoExample) {
      await ask(rl, chalk.dim("  Press Enter when you're happy with the preview..."))
      console.log('')
    }

    // Step 5 — publish guidance (we don't auto-publish; require explicit login)
    printStep(5, 5, 'Publish')
    console.log('  When you are ready to share this deck with viewers:')
    console.log(`    ${chalk.bold(`throughline login`)}     ${chalk.dim('# first time only')}`)
    console.log(`    ${chalk.bold(`throughline publish ${deckName}`)}`)
    console.log('')
    console.log(`  To password-protect the viewer link:`)
    console.log(`    ${chalk.bold(`throughline share ${deckName} --password <pw>`)}`)
    console.log('')
    console.log(chalk.green("  You are set. That's the full round-trip — edit, preview, publish, share."))
    console.log('')
    console.log(chalk.dim(`  Deck path: ${deckPath}`))
  } finally {
    rl.close()
  }
}
