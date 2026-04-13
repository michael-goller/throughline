import type { VercelRequest, VercelResponse } from "@vercel/node";

// Hard-to-guess tokens that grant access to the install script.
// Rotate by replacing the token and redeploying.
const VALID_TOKENS = new Set([
  "9b3998ea32f54ec9",
]);

// Base URL of the site (where this function is deployed).
const SITE_URL = process.env.SHINE_SITE_URL || "https://shine-site-lemon.vercel.app";

// The install script served to valid token holders.
// Downloads a pre-built tarball via the token-gated /api/download endpoint.
function buildInstallScript(siteUrl: string, token: string): string {
  return `#!/usr/bin/env bash
# Shine installer — private distribution
# curl -fsSL https://shine-site-lemon.vercel.app/api/install/TOKEN | bash
#
# Downloads a pre-built tarball from Vercel Blob storage.
# No git access or build step required.
# Works on macOS, Linux, and Windows (WSL/Git Bash).

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
BOLD='\\033[1m'
DIM='\\033[2m'
RESET='\\033[0m'

TARBALL_URL="${siteUrl}/api/download/${token}"
SHINE_HOME="\${SHINE_HOME:-\$HOME/.shine}"
SHINE_INSTALL_DIR="\$SHINE_HOME/install"
MIN_NODE_MAJOR=20

# ── Helpers ──────────────────────────────────────────────────────
info()  { printf "\${BLUE}\\u2139\${RESET}  %s\\n" "\$*"; }
ok()    { printf "\${GREEN}\\u2713\${RESET}  %s\\n" "\$*"; }
warn()  { printf "\${YELLOW}\\u26A0\${RESET}  %s\\n" "\$*"; }
fail()  { printf "\${RED}\\u2717\${RESET}  %s\\n" "\$*" >&2; exit 1; }

command_exists() { command -v "\$1" >/dev/null 2>&1; }

# ── Banner ───────────────────────────────────────────────────────
banner() {
  echo ""
  printf "\${BOLD}\${CYAN}"
  cat << 'ART'
   ____  _     _
  / ___|| |__ (_)_ __   ___
  \\___ \\| '_ \\| | '_ \\ / _ \\
   ___) | | | | | | | |  __/
  |____/|_| |_|_|_| |_|\\___|

ART
  printf "\${RESET}"
  printf "  \${DIM}Beautiful slide decks made simple.\${RESET}\\n\\n"
}

# ── Detect platform ─────────────────────────────────────────────
detect_platform() {
  OS="\$(uname -s)"
  ARCH="\$(uname -m)"
  case "\$OS" in
    Darwin)  PLATFORM="macos"  ;;
    Linux)   PLATFORM="linux"  ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *) fail "Unsupported OS: \$OS" ;;
  esac
  info "Detected \${BOLD}\$PLATFORM\${RESET} (\$ARCH)"
}

# ── Ensure Node.js ───────────────────────────────────────────────
ensure_node() {
  if command_exists node; then
    NODE_VERSION="\$(node -v | sed 's/v//' | cut -d. -f1)"
    if [ "\$NODE_VERSION" -ge "\$MIN_NODE_MAJOR" ]; then
      ok "Node.js v\$(node -v | sed 's/v//') found"
      return
    else
      warn "Node.js v\$(node -v | sed 's/v//') is too old (need v\${MIN_NODE_MAJOR}+)"
    fi
  else
    info "Node.js not found"
  fi

  info "Installing Node.js via nvm..."

  if ! command_exists nvm && [ ! -s "\$HOME/.nvm/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi

  export NVM_DIR="\${NVM_DIR:-\$HOME/.nvm}"
  [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"

  if ! command_exists nvm; then
    fail "nvm installation failed. Install Node.js v\${MIN_NODE_MAJOR}+ manually and re-run."
  fi

  nvm install --lts
  nvm use --lts
  ok "Node.js \$(node -v) installed via nvm"
}

# ── Download and extract tarball ─────────────────────────────────
download_shine() {
  mkdir -p "\$SHINE_HOME"

  local TMP_TARBALL="\$SHINE_HOME/shine-latest.tar.gz"

  info "Downloading Shine..."
  curl -fSL "\$TARBALL_URL" -o "\$TMP_TARBALL"
  ok "Downloaded tarball"

  # Remove old installation if present
  if [ -d "\$SHINE_INSTALL_DIR" ]; then
    info "Removing previous installation..."
    rm -rf "\$SHINE_INSTALL_DIR"
  fi

  info "Extracting..."
  mkdir -p "\$SHINE_INSTALL_DIR"
  tar -xzf "\$TMP_TARBALL" -C "\$SHINE_HOME"
  # tarball extracts as shine/ — move contents to install/
  if [ -d "\$SHINE_HOME/shine" ] && [ "\$SHINE_HOME/shine" != "\$SHINE_INSTALL_DIR" ]; then
    rm -rf "\$SHINE_INSTALL_DIR"
    mv "\$SHINE_HOME/shine" "\$SHINE_INSTALL_DIR"
  fi

  rm -f "\$TMP_TARBALL"
  ok "Extracted to \$SHINE_INSTALL_DIR"
}

# ── Install template dependencies ────────────────────────────────
install_template_deps() {
  info "Installing template dependencies..."
  cd "\$SHINE_INSTALL_DIR/template"
  npm install --no-audit --no-fund --loglevel=error
  ok "Template ready"
  cd - >/dev/null
}

# ── Symlink into PATH ───────────────────────────────────────────
link_binary() {
  local BIN_DIR=""
  local SHINE_BIN="\$SHINE_INSTALL_DIR/cli/bin/shine.js"

  chmod +x "\$SHINE_BIN"

  if [ -d "/opt/homebrew/bin" ] && echo "\$PATH" | grep -q "/opt/homebrew/bin"; then
    BIN_DIR="/opt/homebrew/bin"
  elif [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
    BIN_DIR="/usr/local/bin"
  else
    BIN_DIR="\$HOME/.local/bin"
    mkdir -p "\$BIN_DIR"
  fi

  rm -f "\$BIN_DIR/shine"
  ln -sf "\$SHINE_BIN" "\$BIN_DIR/shine"
  ok "Linked \${BOLD}shine\${RESET} -> \$BIN_DIR/shine"

  if ! echo "\$PATH" | tr ':' '\\n' | grep -qx "\$BIN_DIR"; then
    warn "\$BIN_DIR is not in your PATH"
    echo ""
    echo "  Add this to your shell profile (~/.zshrc or ~/.bashrc):"
    echo ""
    echo "    export PATH=\\"\$BIN_DIR:\\\\\$PATH\\""
    echo ""
  fi
}

# ── Write default config ─────────────────────────────────────────
write_config() {
  local CONFIG_FILE="\$SHINE_HOME/config.json"
  if [ ! -f "\$CONFIG_FILE" ]; then
    cat > "\$CONFIG_FILE" << CONF
{
  "template_path": "\$SHINE_INSTALL_DIR/template",
  "decks_path": "\$HOME/decks",
  "port_range": [5173, 5199]
}
CONF
    ok "Config written to \$CONFIG_FILE"
  else
    ok "Config already exists -- kept as-is"
  fi
}

# ── Done ─────────────────────────────────────────────────────────
finish() {
  echo ""
  printf "  \${GREEN}\${BOLD}Shine is installed!\${RESET}\\n"
  echo ""
  printf "  \${DIM}Get started:\${RESET}\\n"
  echo ""
  echo "    shine new my-deck      # Create a deck"
  echo "    shine serve my-deck    # Start dev server"
  echo "    shine open my-deck     # Open in browser"
  echo ""
  printf "  \${DIM}Manage decks:\${RESET}\\n"
  echo ""
  echo "    shine ls               # List all decks"
  echo "    shine publish my-deck  # Publish to cloud"
  echo "    shine export my-deck   # Export to PDF"
  echo ""
  printf "  \${DIM}Update anytime:\${RESET}\\n"
  echo ""
  echo "    shine update           # Pull latest & rebuild"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────
main() {
  banner
  detect_platform
  ensure_node
  download_shine
  install_template_deps
  link_binary
  write_config
  finish
}

main "\$@"
`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;

  if (typeof token !== "string" || !VALID_TOKENS.has(token)) {
    res.status(404).send("Not found");
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(buildInstallScript(SITE_URL, token));
}
