/**
 * `throughline install <target>` — copy bundled agent skills into the
 * user's agent command directory so `/shape` (and future skills) just work.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { formatPath, getTemplatePath } from './config.js'

export type SkillFlavor = 'claude' | 'gemini'

interface FlavorSpec {
  flavor: SkillFlavor
  label: string
  sourceSubdir: string
  extension: string
  destDir: string
  invocationHint: string
}

const FLAVORS: Record<SkillFlavor, FlavorSpec> = {
  claude: {
    flavor: 'claude',
    label: 'Claude Code',
    sourceSubdir: 'claude',
    extension: '.md',
    destDir: join(homedir(), '.claude', 'commands'),
    invocationHint: 'Run /shape inside Claude Code',
  },
  gemini: {
    flavor: 'gemini',
    label: 'Gemini CLI',
    sourceSubdir: 'gemini',
    extension: '.toml',
    destDir: join(homedir(), '.gemini', 'commands'),
    invocationHint: 'Run /shape inside Gemini CLI',
  },
}

export interface InstallOptions {
  force?: boolean
  dryRun?: boolean
}

export interface InstallResult {
  flavor: SkillFlavor
  label: string
  destDir: string
  invocationHint: string
  installed: string[]
  skipped: string[]
  wouldCopy: string[]
}

/** Resolve the `template/skills/<flavor>` source directory for a given flavor. */
export function skillsSourceDir(flavor: SkillFlavor): string {
  return join(getTemplatePath(), 'skills', FLAVORS[flavor].sourceSubdir)
}

/**
 * Copy every skill file of the given flavor from `template/skills/<flavor>`
 * into the per-agent commands directory. Returns a structured report so the
 * CLI layer can format output consistently.
 */
export function installSkills(flavor: SkillFlavor, options: InstallOptions = {}): InstallResult {
  const spec = FLAVORS[flavor]
  const sourceDir = skillsSourceDir(flavor)

  if (!existsSync(sourceDir)) {
    throw new Error(`Skills source missing: ${formatPath(sourceDir)} — re-run the installer to restore the template.`)
  }

  const files = readdirSync(sourceDir)
    .filter((name) => name.endsWith(spec.extension))
    .sort()

  if (files.length === 0) {
    throw new Error(`No ${spec.extension} skills found in ${formatPath(sourceDir)}.`)
  }

  const installed: string[] = []
  const skipped: string[] = []
  const wouldCopy: string[] = []

  if (!options.dryRun && !existsSync(spec.destDir)) {
    mkdirSync(spec.destDir, { recursive: true })
  }

  for (const filename of files) {
    const src = join(sourceDir, filename)
    const dest = join(spec.destDir, filename)
    const exists = existsSync(dest)

    if (options.dryRun) {
      wouldCopy.push(filename)
      continue
    }

    if (exists && !options.force) {
      skipped.push(filename)
      continue
    }

    copyFileSync(src, dest)
    installed.push(filename)
  }

  return {
    flavor,
    label: spec.label,
    destDir: spec.destDir,
    invocationHint: spec.invocationHint,
    installed,
    skipped,
    wouldCopy,
  }
}

/** Map a user-facing install target (`claude-skills`) onto a SkillFlavor. */
export function parseInstallTarget(target: string): SkillFlavor {
  switch (target) {
    case 'claude-skills':
      return 'claude'
    case 'gemini-skills':
      return 'gemini'
    default:
      throw new Error(`Unknown install target '${target}'. Expected 'claude-skills' or 'gemini-skills'.`)
  }
}
