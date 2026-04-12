import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

/** Extract a deck title from slides.config.ts source text */
function extractDeckTitle(src: string, fallback: string): string {
  const commentTitle = src.match(/^\s*\*\s+(.+?)(?:\s*[-—]|$)/m)
  if (commentTitle) return commentTitle[1].trim()
  const titleSlide = src.match(/type:\s*['"]title(?:-\w+)?['"]\s*,\s*\n\s*title:\s*['"](.+?)['"]/m)
  if (titleSlide) return titleSlide[1]
  return fallback
}

/** Path to the Shine registry file */
const REGISTRY_FILE = path.join(process.env.HOME || '', '.shine', 'registry.json')

/**
 * Load all known deck paths: merge registry entries with a directory scan of decksDir.
 * Returns a Map of deckId → absolute path to the deck folder.
 */
function loadDeckPaths(decksDir: string): Map<string, string> {
  const decks = new Map<string, string>()

  // 1. Read the CLI registry (~/.shine/registry.json) — source of truth for all decks
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
      if (registry.decks && typeof registry.decks === 'object') {
        for (const [name, entry] of Object.entries(registry.decks)) {
          const deckPath = (entry as { path: string }).path
          if (deckPath && fs.existsSync(deckPath)) {
            // For thin decks, slides.config.ts is at root; for full decks, at src/
            const hasThinConfig = fs.existsSync(path.join(deckPath, 'slides.config.ts'))
            const hasFullConfig = fs.existsSync(path.join(deckPath, 'src', 'slides.config.ts'))
            if (hasThinConfig || hasFullConfig) {
              decks.set(name, deckPath)
            }
          }
        }
      }
    }
  } catch {
    // Registry missing or corrupt — fall through to directory scan
  }

  // 2. Scan decksDir for any decks not yet in registry
  try {
    if (fs.existsSync(decksDir)) {
      for (const name of fs.readdirSync(decksDir)) {
        if (decks.has(name)) continue
        const deckDir = path.join(decksDir, name)
        if (!fs.statSync(deckDir).isDirectory()) continue
        if (fs.existsSync(path.join(deckDir, 'slides.config.ts'))) {
          decks.set(name, deckDir)
        }
      }
    }
  } catch {
    // decksDir doesn't exist or unreadable
  }

  return decks
}

/**
 * Resolve the slides.config.ts path for a deck folder.
 * Thin decks: <deckPath>/slides.config.ts
 * Full decks: <deckPath>/src/slides.config.ts
 */
function resolveSlidesConfig(deckPath: string): string | null {
  const thin = path.join(deckPath, 'slides.config.ts')
  if (fs.existsSync(thin)) return thin
  const full = path.join(deckPath, 'src', 'slides.config.ts')
  if (fs.existsSync(full)) return full
  return null
}

/**
 * Vite plugin that serves local decks in dev mode:
 * 1. /decks/manifest.json — auto-generated from registry + ~/decks/ scan
 * 2. /api/decks/:deckId — dynamically loads slides.config.ts via Vite SSR
 * 3. /deck-assets/:deckId/* — serves assets from each deck's public/ folder
 */
function localDecksPlugin(decksDir: string): Plugin {
  return {
    name: 'local-decks',
    configureServer(server) {
      // Serve manifest — reads registry + scans decksDir
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/decks/manifest.json') return next()

        try {
          const deckPaths = loadDeckPaths(decksDir)
          const entries: Array<Record<string, unknown>> = []

          for (const [name, deckPath] of deckPaths) {
            try {
              const configPath = resolveSlidesConfig(deckPath)
              if (!configPath) continue

              const src = fs.readFileSync(configPath, 'utf-8')
              const slideCount = (src.match(/^\s{2,4}id:\s/gm) || []).length
              const title = extractDeckTitle(src, name)
              const stat = fs.statSync(configPath)

              entries.push({
                id: name,
                title,
                slideCount,
                updatedAt: stat.mtime.toISOString(),
                sourcePath: deckPath,
              })
            } catch {
              // Skip decks that fail to scan — don't break the entire manifest
            }
          }

          entries.sort((a, b) =>
            new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime()
          )

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ decks: entries }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(e) }))
        }
      })

      // Serve individual deck JSON via SSR module loading
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/decks\/([^/?#]+)$/)
        if (!match) return next()

        const deckId = decodeURIComponent(match[1])

        // Resolve deck path from registry + decksDir
        const deckPaths = loadDeckPaths(decksDir)
        const deckPath = deckPaths.get(deckId)

        if (!deckPath) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `Deck not found: ${deckId}` }))
          return
        }

        const configPath = resolveSlidesConfig(deckPath)
        if (!configPath) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `Deck not found: ${deckId}` }))
          return
        }

        try {
          const mod = await server.ssrLoadModule(configPath)
          const slides = mod.slides || mod.default

          if (!Array.isArray(slides)) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'No slides export found' }))
            return
          }

          const src = fs.readFileSync(configPath, 'utf-8')
          const title = extractDeckTitle(src, deckId)

          // Serialize with component-to-string replacer so React components
          // (e.g. lucide icons — forwardRef objects or plain functions)
          // become their displayName/name string
          const json = JSON.stringify({
            id: deckId,
            title,
            slides,
          }, (_key, value) => {
            if (typeof value === 'function') {
              return value.displayName || value.name || undefined
            }
            // forwardRef components are objects with a render function
            if (typeof value === 'object' && value !== null && 'render' in value && typeof value.render === 'function') {
              return value.displayName || value.render.displayName || value.render.name || undefined
            }
            return value
          })

          res.setHeader('Content-Type', 'application/json')
          res.end(json)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(e) }))
        }
      })

      // Serve cross-deck assets: /deck-assets/:deckId/* → <deckPath>/public/*
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/deck-assets\/([^/?#]+)\/(.+)$/)
        if (!match) return next()

        const deckId = decodeURIComponent(match[1])
        const assetPath = decodeURIComponent(match[2])

        // Resolve deck path from registry + decksDir
        const deckPaths = loadDeckPaths(decksDir)
        const deckPath = deckPaths.get(deckId)
        if (!deckPath) return next()

        const filePath = path.join(deckPath, 'public', assetPath)

        // Prevent path traversal
        const resolved = path.resolve(filePath)
        const deckPublic = path.resolve(path.join(deckPath, 'public'))
        if (!resolved.startsWith(deckPublic)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        if (!fs.existsSync(resolved)) {
          return next()
        }

        // Serve the file with appropriate content type
        const ext = path.extname(resolved).toLowerCase()
        const mimeTypes: Record<string, string> = {
          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
          '.ico': 'image/x-icon', '.pdf': 'application/pdf',
          '.json': 'application/json', '.css': 'text/css', '.js': 'text/javascript',
        }
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
        res.end(fs.readFileSync(resolved))
      })
    },
  }
}

/**
 * Vite plugin that generates a static decks/manifest.json during production builds.
 * This allows the gallery to work in production without the dev server middleware.
 */
function buildManifestPlugin(decksDir: string): Plugin {
  return {
    name: 'build-manifest',
    apply: 'build',
    async generateBundle() {
      const deckPaths = loadDeckPaths(decksDir)
      const entries: Array<Record<string, unknown>> = []

      for (const [name, deckPath] of deckPaths) {
        try {
          const configPath = resolveSlidesConfig(deckPath)
          if (!configPath) continue

          const src = fs.readFileSync(configPath, 'utf-8')
          const slideCount = (src.match(/^\s{2,4}id:\s/gm) || []).length
          const title = extractDeckTitle(src, name)
          const stat = fs.statSync(configPath)

          entries.push({
            id: name,
            title,
            slideCount,
            updatedAt: stat.mtime.toISOString(),
            sourcePath: deckPath,
          })
        } catch {
          // Skip decks that fail to scan
        }
      }

      entries.sort((a, b) =>
        new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime()
      )

      this.emitFile({
        type: 'asset',
        fileName: 'decks/manifest.json',
        source: JSON.stringify({ decks: entries }, null, 2),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  // DECK_PATH env var points to a deck folder containing slides.config.ts
  const deckPath = process.env.DECK_PATH

  // Resolve paths
  const templateRoot = __dirname
  const slidesConfigPath = deckPath
    ? path.resolve(deckPath, 'slides.config.ts')
    : path.resolve(templateRoot, 'src/slides.config.ts')

  // Deck's public folder (for images, assets)
  const deckPublicDir = deckPath
    ? path.resolve(deckPath, 'public')
    : path.resolve(templateRoot, 'public')

  // Decks directory: parent of DECK_PATH, or ~/decks/ as fallback
  const decksDir = deckPath
    ? path.dirname(deckPath)
    : path.resolve(process.env.HOME || '', 'decks')

  // Collect all unique directories that contain decks so Vite can SSR-load them
  const allDeckPaths = loadDeckPaths(decksDir)
  const allowedDirs = new Set<string>([templateRoot, decksDir])
  for (const deckPath of allDeckPaths.values()) {
    allowedDirs.add(deckPath)
    // Also allow the parent dir in case it's not decksDir
    allowedDirs.add(path.dirname(deckPath))
  }

  return {
    plugins: [
      react(),
      localDecksPlugin(decksDir),
      buildManifestPlugin(decksDir),
    ],

    // Use deck's public folder if available
    publicDir: deckPublicDir,

    resolve: {
      alias: {
        // Alias for slides config - points to deck or template
        '@deck/slides': slidesConfigPath,
      },
      // Force resolution from the template's node_modules for packages
      // that external deck configs import. Without this, SSR loading
      // decks from outside the template root fails because Node resolves
      // bare imports relative to the deck file's directory.
      dedupe: ['lucide-react', 'react', 'react-dom'],
    },

    // Ensure we can import from all deck folders
    server: {
      fs: {
        allow: [...allowedDirs],
      },
    },

    // SPA fallback: serve index.html for /decks/* routes so dynamic
    // deck loading works on page refresh and direct navigation.
    appType: 'spa' as const,
  }
})
