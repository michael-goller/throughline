#!/usr/bin/env bash
# Throughline installer — curl -fsSL https://raw.githubusercontent.com/michael-goller/throughline/main/install.sh | bash
#
# Works on macOS, Linux, and Windows (WSL/Git Bash).
# Installs Node.js (via nvm) if missing, clones the repo, builds the CLI,
# and symlinks `throughline` into your PATH.

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

THROUGHLINE_REPO="https://github.com/michael-goller/throughline.git"
THROUGHLINE_HOME="${THROUGHLINE_HOME:-$HOME/.throughline}"
THROUGHLINE_INSTALL_DIR="$THROUGHLINE_HOME/install"
MIN_NODE_MAJOR=20

# ── Helpers ──────────────────────────────────────────────────────
info()  { printf "${BLUE}ℹ${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}✓${RESET}  %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${RESET}  %s\n" "$*"; }
fail()  { printf "${RED}✗${RESET}  %s\n" "$*" >&2; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# ── Banner ───────────────────────────────────────────────────────
banner() {
  echo ""
  printf "${BOLD}${CYAN}"
  cat << 'ART'
   ____  _     _
  / ___|| |__ (_)_ __   ___
  \___ \| '_ \| | '_ \ / _ \
   ___) | | | | | | | |  __/
  |____/|_| |_|_|_| |_|\___|

ART
  printf "${RESET}"
  printf "  ${DIM}The dev-native way to make decks.${RESET}\n\n"
}

# ── Detect platform ─────────────────────────────────────────────
detect_platform() {
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  case "$OS" in
    Darwin)  PLATFORM="macos"  ;;
    Linux)   PLATFORM="linux"  ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *) fail "Unsupported OS: $OS" ;;
  esac
  info "Detected ${BOLD}$PLATFORM${RESET} ($ARCH)"
}

# ── Ensure Node.js ───────────────────────────────────────────────
ensure_node() {
  if command_exists node; then
    NODE_VERSION="$(node -v | sed 's/v//' | cut -d. -f1)"
    if [ "$NODE_VERSION" -ge "$MIN_NODE_MAJOR" ]; then
      ok "Node.js v$(node -v | sed 's/v//') found"
      return
    else
      warn "Node.js v$(node -v | sed 's/v//') is too old (need v${MIN_NODE_MAJOR}+)"
    fi
  else
    info "Node.js not found"
  fi

  info "Installing Node.js via nvm..."

  # Install nvm if missing
  if ! command_exists nvm && [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi

  # Source nvm
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

  if ! command_exists nvm; then
    fail "nvm installation failed. Install Node.js v${MIN_NODE_MAJOR}+ manually and re-run."
  fi

  nvm install --lts
  nvm use --lts
  ok "Node.js $(node -v) installed via nvm"
}

# ── Ensure git ───────────────────────────────────────────────────
ensure_git() {
  if command_exists git; then
    ok "git found"
    return
  fi

  case "$PLATFORM" in
    macos)
      info "Installing git via Xcode Command Line Tools..."
      xcode-select --install 2>/dev/null || true
      ;;
    linux)
      if command_exists apt-get; then
        sudo apt-get update -qq && sudo apt-get install -y -qq git
      elif command_exists dnf; then
        sudo dnf install -y git
      elif command_exists yum; then
        sudo yum install -y git
      fi
      ;;
  esac

  command_exists git || fail "git is required. Please install it and re-run."
  ok "git installed"
}

# ── Clone / update repo ─────────────────────────────────────────
install_throughline() {
  mkdir -p "$THROUGHLINE_HOME"

  if [ -d "$THROUGHLINE_INSTALL_DIR/.git" ]; then
    info "Updating existing installation..."
    cd "$THROUGHLINE_INSTALL_DIR"
    git pull --ff-only origin main 2>/dev/null || git pull origin main
    cd - >/dev/null
  else
    info "Cloning Throughline..."
    rm -rf "$THROUGHLINE_INSTALL_DIR"
    git clone --depth 1 "$THROUGHLINE_REPO" "$THROUGHLINE_INSTALL_DIR"
  fi

  ok "Source downloaded to $THROUGHLINE_INSTALL_DIR"
}

# ── Build CLI ────────────────────────────────────────────────────
build_cli() {
  info "Installing CLI dependencies..."
  cd "$THROUGHLINE_INSTALL_DIR/cli"
  npm install --no-audit --no-fund --loglevel=error
  ok "Dependencies installed"

  info "Building CLI..."
  npm run build
  ok "CLI built"

  cd - >/dev/null
}

# ── Install template dependencies ────────────────────────────────
install_template_deps() {
  info "Installing template dependencies..."
  cd "$THROUGHLINE_INSTALL_DIR/template"
  npm install --no-audit --no-fund --loglevel=error
  ok "Template ready"
  cd - >/dev/null
}

# ── Symlink into PATH ───────────────────────────────────────────
link_binary() {
  local BIN_DIR=""
  local THROUGHLINE_BIN="$THROUGHLINE_INSTALL_DIR/cli/bin/throughline.js"

  chmod +x "$THROUGHLINE_BIN"

  # Determine best bin directory
  if [ -d "/opt/homebrew/bin" ] && echo "$PATH" | grep -q "/opt/homebrew/bin"; then
    BIN_DIR="/opt/homebrew/bin"
  elif [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
    BIN_DIR="/usr/local/bin"
  else
    BIN_DIR="$HOME/.local/bin"
    mkdir -p "$BIN_DIR"
  fi

  # Remove old symlink if present
  rm -f "$BIN_DIR/throughline"
  ln -sf "$THROUGHLINE_BIN" "$BIN_DIR/throughline"
  ok "Linked ${BOLD}throughline${RESET} → $BIN_DIR/throughline"

  # Check if BIN_DIR is in PATH
  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$BIN_DIR"; then
    warn "$BIN_DIR is not in your PATH"
    echo ""
    echo "  Add this to your shell profile (~/.zshrc or ~/.bashrc):"
    echo ""
    echo "    export PATH=\"$BIN_DIR:\$PATH\""
    echo ""
  fi
}

# ── Write default config ─────────────────────────────────────────
write_config() {
  local CONFIG_FILE="$THROUGHLINE_HOME/config.json"
  if [ ! -f "$CONFIG_FILE" ]; then
    cat > "$CONFIG_FILE" << EOF
{
  "template_path": "$THROUGHLINE_INSTALL_DIR/template",
  "decks_path": "$HOME/decks",
  "port_range": [5173, 5199]
}
EOF
    ok "Config written to $CONFIG_FILE"
  else
    ok "Config already exists — kept as-is"
  fi
}

# ── Done ─────────────────────────────────────────────────────────
finish() {
  echo ""
  printf "  ${GREEN}${BOLD}Throughline is installed!${RESET}\n"
  echo ""
  printf "  ${DIM}Get started:${RESET}\n"
  echo ""
  echo "    throughline new my-deck      # Create a deck"
  echo "    throughline serve my-deck    # Start dev server"
  echo "    throughline open my-deck     # Open in browser"
  echo ""
  printf "  ${DIM}Manage decks:${RESET}\n"
  echo ""
  echo "    throughline ls               # List all decks"
  echo "    throughline publish my-deck  # Publish to cloud"
  echo "    throughline export my-deck   # Export to PDF"
  echo ""
  printf "  ${DIM}Update anytime:${RESET}\n"
  echo ""
  echo "    throughline update           # Pull latest & rebuild"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────
main() {
  banner
  detect_platform
  ensure_git
  ensure_node
  install_throughline
  build_cli
  install_template_deps
  link_binary
  write_config
  finish
}

main "$@"
