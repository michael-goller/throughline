import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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

  return {
    plugins: [react()],

    // Use deck's public folder if available
    publicDir: deckPublicDir,

    resolve: {
      alias: {
        // Alias for slides config - points to deck or template
        '@deck/slides': slidesConfigPath,
      },
    },

    // Ensure we can import from the deck folder
    server: {
      fs: {
        allow: [
          templateRoot,
          ...(deckPath ? [deckPath] : []),
        ],
      },
    },
  }
})
