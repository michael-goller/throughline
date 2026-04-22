export type OnboardingOS = 'macos' | 'linux' | 'windows'

export const ONBOARDING_LS = {
  complete: 'throughline-onboarding-complete',
  dismissed: 'throughline-onboarding-dismissed',
  step: 'throughline-onboarding-step',
  os: 'throughline-onboarding-os',
} as const

export const STEP1_COPY = {
  lines: [
    'Your deck is TypeScript.',
    'Your editor is a conversation.',
    'Your audience gets a link.',
  ],
  sub: 'Throughline decks live as code, evolve through chat, and ship as a single URL.',
  primary: 'Next → Install the CLI',
}

export const STEP2_COPY = {
  title: 'Install the CLI',
  tabs: [
    { os: 'macos' as const, label: 'macOS', command: 'curl -fsSL https://shine-site-lemon.vercel.app/api/install/public | bash' },
    { os: 'linux' as const, label: 'Linux', command: 'curl -fsSL https://shine-site-lemon.vercel.app/api/install/public | bash' },
    { os: 'windows' as const, label: 'Windows', command: 'irm https://shine-site-lemon.vercel.app/api/install-ps/public | iex' },
  ],
  verify: [
    'After install, run',
    'throughline --help',
    'to confirm. Expect the thread-red banner',
    '──── throughline ────',
  ],
  alreadyInstalled: 'Already installed? → Skip',
  primary: 'Next → Create a deck',
}

export const STEP3_COPY = {
  title: 'Create your first deck',
  cards: [
    {
      command: 'throughline onboard',
      label: 'Guided start',
      body: 'Pick an example, preview locally, get a publish cheatsheet.',
      primary: true,
    },
    {
      command: 'throughline shape',
      label: 'From your own story',
      body: "Answer 4 questions and we'll scaffold a deck around your throughline.",
      primary: false,
    },
  ],
  primary: 'Next → Connect your agent',
}

export const STEP4_COPY = {
  title: 'Connect your agent',
  cards: [
    {
      id: 'claude',
      name: 'Claude Code',
      command: 'throughline install claude-skills',
      body: 'Installs /shape and /onboard skills into ~/.claude/commands/. Your agent can now author decks.',
      disabled: false,
    },
    {
      id: 'gemini',
      name: 'Gemini CLI',
      command: 'throughline install gemini-skills',
      body: 'Installs the same flows as .gemini/commands/.',
      disabled: false,
    },
    {
      id: 'codex',
      name: 'Codex',
      command: '',
      body: 'Coming soon',
      disabled: true,
    },
  ],
  primary: "Done — let's build",
  footer: {
    help: 'throughline --help',
    site: 'throughline.dev',
    siteUrl: 'https://shine-site-lemon.vercel.app',
    channel: 'Join our channel (coming soon)',
  },
}

export const MOBILE_VIEWER_COPY = {
  cta: 'Install on desktop to build your own',
  ctaHref: 'https://shine-site-lemon.vercel.app',
}

export const SKIP_LABEL = 'Skip for now'
