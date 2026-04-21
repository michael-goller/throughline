/**
 * `throughline shape` — interactive flow that captures the four-question
 * Shape brief (throughline, audience, current belief, evidence) and writes
 * it to `.throughline-brief.json` in the target directory.
 */

import chalk from 'chalk'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createInterface, type Interface as ReadlineInterface } from 'readline'

export const BRIEF_FILENAME = '.throughline-brief.json'

export interface ThroughlineBrief {
  throughline: string
  audience: string
  currentBelief: string
  evidence: string[]
  createdAt: string
}

function ask(rl: ReadlineInterface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))
}

export async function runShape(
  targetDir: string,
  options: { force?: boolean } = {}
): Promise<{ path: string; brief: ThroughlineBrief }> {
  const outPath = join(targetDir, BRIEF_FILENAME)
  if (existsSync(outPath) && !options.force) {
    throw new Error(
      `${BRIEF_FILENAME} already exists at ${outPath}. Pass --force to overwrite.`
    )
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    console.log(chalk.bold('\nShape your throughline.'))
    console.log(chalk.dim('Four questions. A tight argument before a single slide.\n'))

    const throughline = await ask(rl, chalk.bold("1. What's your one claim?\n   "))
    if (!throughline) throw new Error('Throughline is required.')

    const audience = await ask(
      rl,
      chalk.bold("\n2. Who's the audience? (persona + context)\n   ")
    )
    if (!audience) throw new Error('Audience is required.')

    const currentBelief = await ask(
      rl,
      chalk.bold('\n3. What do they currently believe?\n   ')
    )
    if (!currentBelief) throw new Error('Current belief is required.')

    console.log(
      chalk.bold("\n4. What's your evidence?") +
        chalk.dim(' (one per line, empty line to finish, 2–5 items)')
    )
    const evidence: string[] = []
    while (evidence.length < 5) {
      const idx = evidence.length + 1
      const line = await ask(rl, `   ${idx}. `)
      if (!line) break
      evidence.push(line)
    }
    if (evidence.length < 2) {
      throw new Error('Provide at least 2 pieces of evidence.')
    }

    const brief: ThroughlineBrief = {
      throughline,
      audience,
      currentBelief,
      evidence,
      createdAt: new Date().toISOString(),
    }
    writeFileSync(outPath, JSON.stringify(brief, null, 2) + '\n', 'utf-8')
    return { path: outPath, brief }
  } finally {
    rl.close()
  }
}

export function readBrief(path: string): ThroughlineBrief {
  if (!existsSync(path)) {
    throw new Error(`Brief not found: ${path}. Run 'throughline shape' first.`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path, 'utf-8'))
  } catch (err) {
    throw new Error(`Failed to parse ${path}: ${(err as Error).message}`)
  }
  const brief = parsed as Partial<ThroughlineBrief>
  if (
    typeof brief?.throughline !== 'string' ||
    typeof brief?.audience !== 'string' ||
    typeof brief?.currentBelief !== 'string' ||
    !Array.isArray(brief?.evidence) ||
    !brief.evidence.every((e) => typeof e === 'string')
  ) {
    throw new Error(
      `${path} is malformed — expected throughline, audience, currentBelief (strings) and evidence (string[]).`
    )
  }
  return {
    throughline: brief.throughline,
    audience: brief.audience,
    currentBelief: brief.currentBelief,
    evidence: brief.evidence,
    createdAt: typeof brief.createdAt === 'string' ? brief.createdAt : new Date().toISOString(),
  }
}

export function resolveBriefPath(input: string | undefined, cwd: string): string {
  if (!input) return join(cwd, BRIEF_FILENAME)
  // If user passed a directory, look for the file inside it.
  if (existsSync(input) && !input.endsWith('.json')) {
    return join(input, BRIEF_FILENAME)
  }
  return input
}
