#!/usr/bin/env node
/**
 * Upload the Shine tarball to Vercel Blob storage.
 *
 * Prerequisites:
 *   - Run ./scripts/pack-tarball.sh first
 *   - Set BLOB_READ_WRITE_TOKEN env var (from Vercel dashboard → Storage → Blob)
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/upload-blob.mjs
 *
 * The script uploads dist/shine-v<version>.tar.gz and prints the download URL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "..", "template", "node_modules", "x"));
const { put } = require("@vercel/blob");

const repoRoot = resolve(__dirname, "..");

// Read version from CLI package.json
const cliPkg = JSON.parse(
  readFileSync(resolve(repoRoot, "cli/package.json"), "utf-8")
);
const version = cliPkg.version;
const tarballPath = resolve(repoRoot, `dist/shine-v${version}.tar.gz`);

// Verify token
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error(
    "Error: BLOB_READ_WRITE_TOKEN env var is required.\n" +
      "Get it from: Vercel Dashboard → Storage → Blob → Tokens"
  );
  process.exit(1);
}

// Read tarball
let tarball;
try {
  tarball = readFileSync(tarballPath);
} catch {
  console.error(
    `Error: Tarball not found at ${tarballPath}\n` +
      "Run ./scripts/pack-tarball.sh first."
  );
  process.exit(1);
}

console.log(`Uploading shine-v${version}.tar.gz (${(tarball.length / 1024 / 1024).toFixed(1)} MB)...`);

const blob = await put(`shine/shine-v${version}.tar.gz`, tarball, {
  access: "private",
  token,
  addRandomSuffix: false,
});

console.log(`\nUploaded successfully!`);
console.log(`Blob URL: ${blob.url}`);
console.log(`Blob pathname: shine/shine-v${version}.tar.gz`);
console.log(`\nThe tarball is served through the token-gated download endpoint:`);
console.log(`  curl -fSL https://<site-domain>/api/download/<token> -o shine.tar.gz`);
console.log(`\nThe install script handles this automatically.`);
