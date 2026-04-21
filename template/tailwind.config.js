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
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
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
