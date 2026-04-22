/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'background-elevated': 'var(--background-elevated)',
        'background-accent': 'var(--background-accent)',
        'brand-red': 'var(--brand-red)',
        'brand-red-dark': 'var(--brand-red-dark)',
        'brand-red-shade': 'var(--brand-red-shade)',
        'brand-red-tint': 'var(--brand-red-tint)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-blue': 'var(--accent-blue)',
        'accent-green': 'var(--accent-green)',
        'accent-orange': 'var(--accent-orange)',
        border: 'var(--border)',
        'border-accent': 'var(--border-accent)',
        // Navigation colors (for buttons that need to work on both themes)
        'nav-bg': 'var(--nav-bg)',
        'nav-bg-hover': 'var(--nav-bg-hover)',
        'nav-text': 'var(--nav-text)',
        'accent-indigo': 'var(--accent-indigo)',
        'accent-indigo-hover': 'var(--accent-indigo-hover)',
        // Throughline chrome layer — app-chrome only, never slide content
        'chrome-base': 'var(--bg-base)',
        'chrome-surface': 'var(--chrome-surface)',
        'chrome-card': 'var(--chrome-card)',
        'chrome-card-hover': 'var(--chrome-card-hover)',
        'chrome-ink': 'var(--chrome-ink)',
        'chrome-ink-secondary': 'var(--chrome-ink-secondary)',
        'chrome-ink-muted': 'var(--chrome-ink-muted)',
        'chrome-border': 'var(--chrome-border)',
        'chrome-border-hover': 'var(--chrome-border-hover)',
        'chrome-nav-bg': 'var(--chrome-nav-bg)',
        'chrome-nav-bg-hover': 'var(--chrome-nav-bg-hover)',
        'accent-primary': 'var(--accent-primary)',
        'accent-primary-hover': 'var(--accent-primary-hover)',
      },
      fontFamily: {
        // Slide-content faces — neutral defaults so existing deck templates
        // render in their original Avery typography. App chrome that wants
        // the Throughline brand voice opts in via `font-mono` explicitly.
        sans: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '1.1' }],
        'h1': ['48px', { lineHeight: '1.1' }],
        'h2': ['36px', { lineHeight: '1.1' }],
        'h3': ['24px', { lineHeight: '1.1' }],
        'h4': ['20px', { lineHeight: '1.1' }],
        'body-lg': ['20px', { lineHeight: '1.5' }],
        'body': ['18px', { lineHeight: '1.5' }],
        'body-sm': ['16px', { lineHeight: '1.5' }],
        'caption': ['14px', { lineHeight: '1.5' }],
        'tiny': ['12px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}
