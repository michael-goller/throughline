#!/usr/bin/env bash
# Pack Throughline into a distributable tarball.
# Includes pre-built CLI (with node_modules) and template (without node_modules).
#
# Usage: ./scripts/pack-tarball.sh
# Output: ./dist/throughline-v<version>.tar.gz

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$REPO_ROOT/cli"
TEMPLATE_DIR="$REPO_ROOT/template"
VERSION="$(node -e "console.log(require('$CLI_DIR/package.json').version)")"
TARBALL_NAME="throughline-v${VERSION}.tar.gz"
DIST_DIR="$REPO_ROOT/dist"
STAGING_DIR="$DIST_DIR/.staging/throughline"

echo "==> Packing Throughline v${VERSION}"

# ── Clean staging area ──────────────────────────────────────────
rm -rf "$DIST_DIR/.staging"
mkdir -p "$STAGING_DIR"

# ── Build CLI ───────────────────────────────────────────────────
echo "==> Building CLI..."
cd "$CLI_DIR"
npm install --no-audit --no-fund --loglevel=error
npm run build
echo "    CLI built."

# ── Copy CLI (pre-built with production deps) ──────────────────
echo "==> Copying CLI..."
mkdir -p "$STAGING_DIR/cli"
cp "$CLI_DIR/package.json" "$STAGING_DIR/cli/"
cp "$CLI_DIR/package-lock.json" "$STAGING_DIR/cli/" 2>/dev/null || true
cp -r "$CLI_DIR/bin" "$STAGING_DIR/cli/"
cp -r "$CLI_DIR/dist" "$STAGING_DIR/cli/"

# Install production-only deps for the CLI in staging
cd "$STAGING_DIR/cli"
npm install --omit=dev --no-audit --no-fund --loglevel=error
echo "    CLI copied with production deps."

# ── Build and copy @throughline/types ────────────────────────────────
echo "==> Building @throughline/types..."
cd "$REPO_ROOT/packages/types"
npm install --no-audit --no-fund --loglevel=error
npm run build
mkdir -p "$STAGING_DIR/packages/types"
cp -r "$REPO_ROOT/packages/types/dist" "$STAGING_DIR/packages/types/"
cp "$REPO_ROOT/packages/types/package.json" "$STAGING_DIR/packages/types/"
echo "    @throughline/types built and copied."

# ── Copy template (without node_modules, dist, .git) ───────────
echo "==> Copying template..."
rsync -a \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.vercel' \
  --exclude='.env*' \
  "$TEMPLATE_DIR/" "$STAGING_DIR/template/"
echo "    Template copied."

# ── Copy root install.sh (for reference) ───────────────────────
cp "$REPO_ROOT/install.sh" "$STAGING_DIR/" 2>/dev/null || true

# ── Write version marker ───────────────────────────────────────
echo "$VERSION" > "$STAGING_DIR/VERSION"

# ── Create tarball ──────────────────────────────────────────────
echo "==> Creating tarball..."
mkdir -p "$DIST_DIR"
cd "$DIST_DIR/.staging"
tar -czf "$DIST_DIR/$TARBALL_NAME" throughline/
echo "    Created: $DIST_DIR/$TARBALL_NAME"

# ── Cleanup staging ─────────────────────────────────────────────
rm -rf "$DIST_DIR/.staging"

# ── Summary ─────────────────────────────────────────────────────
SIZE="$(du -h "$DIST_DIR/$TARBALL_NAME" | cut -f1)"
echo ""
echo "==> Done! $TARBALL_NAME ($SIZE)"
echo "    Upload with: node scripts/upload-blob.mjs"
