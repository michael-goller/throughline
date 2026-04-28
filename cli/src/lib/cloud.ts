/**
 * Cloud auth and publish functionality for Throughline CLI.
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { execSync } from 'child_process'
import { THROUGHLINE_DIR, ensureThroughlineDir, getTemplatePath } from './config.js'
import { requireDeckTrust, sandboxedEnv, type TrustOptions } from './trust.js'

const CREDENTIALS_FILE = join(THROUGHLINE_DIR, 'credentials.json')

interface Credentials {
  token: string
  email: string
  name: string
  id: string
}

export function saveCredentials(creds: Credentials): void {
  ensureThroughlineDir()
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8')
}

export function loadCredentials(): Credentials | null {
  if (!existsSync(CREDENTIALS_FILE)) return null
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export function clearCredentials(): void {
  if (existsSync(CREDENTIALS_FILE)) {
    unlinkSync(CREDENTIALS_FILE)
  }
}

export function getApiUrl(): string {
  // 1. Env var override
  if (process.env.THROUGHLINE_API_URL) return process.env.THROUGHLINE_API_URL

  // 2. Check registry for configured URL
  const registryPath = join(THROUGHLINE_DIR, 'registry.json')
  if (existsSync(registryPath)) {
    try {
      const registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
      if (registry.apiUrl) return registry.apiUrl
    } catch { /* ignore */ }
  }

  // 3. Default to localhost (dev server)
  return 'http://localhost:5173'
}

export function setApiUrl(url: string): void {
  ensureThroughlineDir()
  const registryPath = join(THROUGHLINE_DIR, 'registry.json')
  let registry: Record<string, unknown> = {}
  if (existsSync(registryPath)) {
    try {
      registry = JSON.parse(readFileSync(registryPath, 'utf-8'))
    } catch { /* ignore */ }
  }
  registry.apiUrl = url
  writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')
}

export async function login(email: string, password: string): Promise<{ name: string; email: string }> {
  const apiUrl = getApiUrl()
  // CLI uses /api/auth/token — returns JWT in body for Bearer auth, no cookie.
  // /api/auth/login is browser-only (HttpOnly cookie, no token in body).
  const res = await fetch(`${apiUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error || `Login failed: ${res.statusText}`)
  }

  const data = await res.json() as { token: string; email: string; name: string; id: string }
  saveCredentials({
    token: data.token,
    email: data.email,
    name: data.name,
    id: data.id,
  })

  return { name: data.name, email: data.email }
}

export async function whoami(): Promise<{ name: string; email: string } | null> {
  const creds = loadCredentials()
  if (!creds) return null

  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${creds.token}` },
  })

  if (!res.ok) {
    clearCredentials()
    return null
  }

  const data = await res.json() as { name: string; email: string }
  return data
}

export async function publish(deckDir: string, trustOpts: TrustOptions = {}): Promise<{ slug: string; url: string }> {
  const creds = loadCredentials()
  if (!creds) {
    throw new Error('Not logged in. Run: throughline login')
  }

  // Find the slides config file — check multiple common locations
  const searchPaths = [
    join(deckDir, 'slides.config.ts'),
    join(deckDir, 'slides.config.js'),
    join(deckDir, 'src', 'slides.config.ts'),
    join(deckDir, 'src', 'slides.config.js'),
    join(deckDir, 'template', 'slides.config.ts'),
    join(deckDir, 'template', 'slides.config.js'),
    join(deckDir, 'template', 'src', 'slides.config.ts'),
    join(deckDir, 'template', 'src', 'slides.config.js'),
  ]
  const configFile = searchPaths.find(f => existsSync(f))

  if (!configFile) {
    throw new Error(`No slides.config.ts found in ${deckDir} (checked root, src/, template/)`)
  }

  await requireDeckTrust(configFile, trustOpts)

  const slug = deckDir.split('/').pop()!

  // Use tsx to evaluate the TypeScript config and extract JSON
  const extractScript = `
    import * as mod from '${configFile.replace(/\\/g, '/')}';
    const raw = mod.default || mod;
    const slides = raw.slides || (Array.isArray(raw) ? raw : null);
    if (!slides) { console.error('No slides export found'); process.exit(1); }
    function serialize(obj) {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'function') return obj.displayName || obj.name || undefined;
      if (Array.isArray(obj)) return obj.map(serialize);
      if (typeof obj === 'object') {
        // Detect React forwardRef components (e.g. Lucide icons) — return display name as string
        if (obj.$$typeof && (obj.displayName || (obj.render && (obj.render.displayName || obj.render.name)))) {
          return obj.displayName || obj.render.displayName || obj.render.name || undefined;
        }
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
          const sv = serialize(v);
          if (sv !== undefined) result[k] = sv;
        }
        return result;
      }
      return obj;
    }
    const config = { slides: serialize(slides), title: raw.title, description: raw.description, author: raw.author, theme: raw.theme };
    console.log(JSON.stringify(config));
  `

  let configJson: string
  try {
    // Write extract script to a temp file to avoid shell escaping issues
    const tmpDir = mkdtempSync(join(tmpdir(), 'throughline-'))
    const tmpScript = join(tmpDir, 'extract.ts')
    writeFileSync(tmpScript, extractScript, 'utf-8')

    // Run tsx from the template directory, and set NODE_PATH so that
    // imports in the deck's slides.config.ts resolve from template's node_modules
    const templateDir = getTemplatePath()
    const nodeModulesPath = join(templateDir, 'node_modules')
    configJson = execSync(`npx tsx ${tmpScript}`, {
      cwd: templateDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
      env: { ...sandboxedEnv(), NODE_PATH: nodeModulesPath },
    }).trim()

    // Cleanup
    try { unlinkSync(tmpScript); } catch { /* ignore */ }
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string }
    throw new Error(`Failed to compile slides config: ${e.stderr || e.message}`)
  }

  const config = JSON.parse(configJson) as {
    slides: unknown[]
    title?: string
    description?: string
    author?: string
    theme?: string
  }
  const slidesArray = config.slides

  // Extract title from first slide
  const firstSlide = Array.isArray(slidesArray) ? slidesArray[0] as Record<string, string> : null
  const title = config.title || firstSlide?.title || firstSlide?.heading || slug

  const deckConfig = {
    id: slug,
    title,
    description: config.description,
    author: config.author || creds.name,
    updatedAt: new Date().toISOString(),
    theme: config.theme,
    slides: Array.isArray(slidesArray) ? slidesArray : [],
  }

  // Upload to API
  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/decks/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.token}`,
    },
    body: JSON.stringify({ slug, title, description: config.description, config: deckConfig }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error || `Publish failed: ${res.statusText}`)
  }

  const result = await res.json() as { slug: string; url: string }
  return result
}

export async function unpublish(slug: string): Promise<void> {
  const creds = loadCredentials()
  if (!creds) {
    throw new Error('Not logged in. Run: throughline login')
  }

  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/decks/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${creds.token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error || `Unpublish failed: ${res.statusText}`)
  }
}

export interface ShareToken {
  tokenId: string
  shortId: string
  label: string | null
  expiresAt: string | null
  viewUrl: string
}

export async function createShare(slug: string, password: string, options?: { label?: string; expiresAt?: string }): Promise<ShareToken> {
  const creds = loadCredentials()
  if (!creds) throw new Error('Not logged in. Run: throughline login')

  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/decks/${encodeURIComponent(slug)}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.token}`,
    },
    body: JSON.stringify({ password, label: options?.label, expiresAt: options?.expiresAt }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error || `Share failed: ${res.statusText}`)
  }

  return await res.json() as ShareToken
}

export async function listShares(slug: string): Promise<ShareToken[]> {
  const creds = loadCredentials()
  if (!creds) throw new Error('Not logged in. Run: throughline login')

  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/decks/${encodeURIComponent(slug)}/share`, {
    headers: { 'Authorization': `Bearer ${creds.token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error || `List shares failed: ${res.statusText}`)
  }

  return await res.json() as ShareToken[]
}

export async function deleteShare(slug: string, options: { tokenId?: string; all?: boolean }): Promise<void> {
  const creds = loadCredentials()
  if (!creds) throw new Error('Not logged in. Run: throughline login')

  const apiUrl = getApiUrl()
  const res = await fetch(`${apiUrl}/api/decks/${encodeURIComponent(slug)}/share`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.token}`,
    },
    body: JSON.stringify(options),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(body.error || `Unshare failed: ${res.statusText}`)
  }
}
