import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  root: path.resolve(__dirname, '../template'),

  resolve: {
    alias: {
      '@deck/slides': path.resolve(__dirname, '../template/src/slides.config.ts'),
    },
    dedupe: ['lucide-react', 'react', 'react-dom'],
  },

  server: {
    fs: {
      allow: [
        path.resolve(__dirname, '..'),
      ],
    },
  },

  build: {
    outDir: path.resolve(__dirname, 'dist'),
  },

  appType: 'spa' as const,
})
