/**
 * `throughline check` — lint a deck for required Throughline fields.
 *
 * Runs the deck's `slides.config.ts` through tsx and inspects the resulting
 * config object. Currently enforces one rule: the deck must declare a
 * `throughline` statement (the "one claim" the deck is making).
 */

import { execSync } from 'child_process'
import { existsSync, mkdtempSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { getTemplatePath } from './config.js'

export interface CheckIssue {
  severity: 'error' | 'warning'
  rule: string
  message: string
  hint?: string
}

export interface CheckResult {
  configFile: string
  throughline: string | null
  title: string | null
  slideCount: number
  issues: CheckIssue[]
}

const SEARCH_PATHS = [
  'slides.config.ts',
  'slides.config.js',
  'src/slides.config.ts',
  'src/slides.config.js',
  'template/slides.config.ts',
  'template/src/slides.config.ts',
]

function findConfigFile(deckDir: string): string | null {
  for (const rel of SEARCH_PATHS) {
    const p = join(deckDir, rel)
    if (existsSync(p)) return p
  }
  return null
}

interface ExtractedConfig {
  throughline: string | null
  title: string | null
  slideCount: number
}

function extractConfig(configFile: string): ExtractedConfig {
  const script = `
    import * as mod from '${configFile.replace(/\\/g, '/')}';
    const raw = mod.default || mod;
    const slides = raw.slides || (Array.isArray(raw) ? raw : null);
    const out = {
      throughline: typeof raw.throughline === 'string' ? raw.throughline : null,
      title: typeof raw.title === 'string' ? raw.title : null,
      slideCount: Array.isArray(slides) ? slides.length : 0,
    };
    console.log(JSON.stringify(out));
  `

  const tmpDir = mkdtempSync(join(tmpdir(), 'throughline-check-'))
  const tmpScript = join(tmpDir, 'extract.ts')
  writeFileSync(tmpScript, script, 'utf-8')

  const templateDir = getTemplatePath()
  const nodeModulesPath = join(templateDir, 'node_modules')

  let stdout: string
  try {
    stdout = execSync(`npx tsx ${tmpScript}`, {
      cwd: templateDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
      env: { ...process.env, NODE_PATH: nodeModulesPath },
    }).trim()
  } catch (err) {
    const e = err as { stderr?: string; message?: string }
    throw new Error(`Failed to compile deck config: ${e.stderr || e.message}`)
  } finally {
    try {
      unlinkSync(tmpScript)
    } catch {
      /* ignore */
    }
  }

  return JSON.parse(stdout) as ExtractedConfig
}

export function checkDeck(deckDir: string): CheckResult {
  const configFile = findConfigFile(deckDir)
  if (!configFile) {
    return {
      configFile: deckDir,
      throughline: null,
      title: null,
      slideCount: 0,
      issues: [
        {
          severity: 'error',
          rule: 'deck/config-missing',
          message: `No slides.config.ts found in ${deckDir}`,
          hint: 'Check you are inside a deck directory, or pass a deck name.',
        },
      ],
    }
  }

  const extracted = extractConfig(configFile)
  const issues: CheckIssue[] = []

  if (!extracted.throughline || extracted.throughline.trim().length === 0) {
    issues.push({
      severity: 'warning',
      rule: 'deck/missing-throughline',
      message: 'Deck has no `throughline` field — no single claim to anchor the argument.',
      hint: "Run `throughline shape` to draft one, then `throughline new --from-brief` or add `export const throughline = '…'` to slides.config.ts.",
    })
  }

  return {
    configFile,
    throughline: extracted.throughline,
    title: extracted.title,
    slideCount: extracted.slideCount,
    issues,
  }
}
