import type { VercelRequest, VercelResponse } from "@vercel/node";

const VALID_TOKENS = new Set([
  "9b3998ea32f54ec9",
]);

const SITE_URL = process.env.THROUGHLINE_SITE_URL || "https://shine-site-lemon.vercel.app";

function buildPowerShellScript(siteUrl: string, token: string): string {
  // PowerShell backtick is the escape char — must be escaped in JS template literals
  const BT = '`';  // backtick helper to avoid breaking the template literal

  return `#Requires -Version 5.1
# Throughline installer for Windows (PowerShell)
# irm ${siteUrl}/api/install-ps/${token} | iex

${"$"}ErrorActionPreference = "Stop"

# -- Colours ---
function Write-Info  { param(${"$"}msg) Write-Host "  i  ${"$"}msg" -ForegroundColor Cyan }
function Write-Ok    { param(${"$"}msg) Write-Host "  +  ${"$"}msg" -ForegroundColor Green }
function Write-Warn  { param(${"$"}msg) Write-Host "  !  ${"$"}msg" -ForegroundColor Yellow }
function Write-Fail  { param(${"$"}msg) Write-Host "  x  ${"$"}msg" -ForegroundColor Red; exit 1 }

# -- Banner ---
function Show-Banner {
    Write-Host ""
    Write-Host "   ____  _     _" -ForegroundColor Cyan
    Write-Host "  / ___|| |__ (_)_ __   ___" -ForegroundColor Cyan
    Write-Host "  \\___ \\| '_ \\| | '_ \\ / _ \\" -ForegroundColor Cyan
    Write-Host "   ___) | | | | | | | |  __/" -ForegroundColor Cyan
    Write-Host "  |____/|_| |_|_|_| |_|\\___|" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  The dev-native way to make decks." -ForegroundColor DarkGray
    Write-Host ""
}

# -- Ensure Node.js ---
function Ensure-Node {
    ${"$"}minMajor = 20

    try {
        ${"$"}nodeVersion = & node --version 2>${"$"}null
        if (${"$"}nodeVersion) {
            ${"$"}major = [int](${"$"}nodeVersion -replace '^v','').Split('.')[0]
            if (${"$"}major -ge ${"$"}minMajor) {
                Write-Ok "Node.js ${"$"}nodeVersion found"
                return
            }
            Write-Warn "Node.js ${"$"}nodeVersion is too old (need v${"$"}minMajor+)"
        }
    } catch {}

    Write-Info "Node.js not found or too old"

    # Try winget first
    try {
        ${"$"}wingetCheck = & winget --version 2>${"$"}null
        if (${"$"}wingetCheck) {
            Write-Info "Installing Node.js via winget..."
            & winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
            # Refresh PATH
            ${"$"}env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            ${"$"}nodeVersion = & node --version 2>${"$"}null
            if (${"$"}nodeVersion) {
                Write-Ok "Node.js ${"$"}nodeVersion installed via winget"
                return
            }
        }
    } catch {}

    # Fallback: direct download
    Write-Info "Downloading Node.js installer..."
    ${"$"}installerUrl = "https://nodejs.org/dist/v22.15.0/node-v22.15.0-x64.msi"
    ${"$"}installerPath = Join-Path ${"$"}env:TEMP "node-installer.msi"
    Invoke-WebRequest -Uri ${"$"}installerUrl -OutFile ${"$"}installerPath -UseBasicParsing
    Write-Info "Running Node.js installer (this may take a moment)..."
    Start-Process msiexec.exe -ArgumentList "/i", ${"$"}installerPath, "/quiet", "/norestart" -Wait
    Remove-Item ${"$"}installerPath -Force -ErrorAction SilentlyContinue

    # Refresh PATH
    ${"$"}env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

    try {
        ${"$"}nodeVersion = & node --version 2>${"$"}null
        if (${"$"}nodeVersion) {
            Write-Ok "Node.js ${"$"}nodeVersion installed"
            return
        }
    } catch {}

    Write-Fail "Could not install Node.js. Please install from https://nodejs.org and re-run."
}

# -- Download and extract ---
function Install-Throughline {
    ${"$"}throughlineHome = if (${"$"}env:THROUGHLINE_HOME) { ${"$"}env:THROUGHLINE_HOME } else { Join-Path ${"$"}env:USERPROFILE ".throughline" }
    ${"$"}installDir = Join-Path ${"$"}throughlineHome "install"
    ${"$"}tarballUrl = "${siteUrl}/api/download/${token}"

    New-Item -ItemType Directory -Path ${"$"}throughlineHome -Force | Out-Null

    ${"$"}tarball = Join-Path ${"$"}throughlineHome "throughline-latest.tar.gz"

    Write-Info "Downloading Throughline..."
    Invoke-WebRequest -Uri ${"$"}tarballUrl -OutFile ${"$"}tarball -UseBasicParsing
    Write-Ok "Downloaded tarball"

    # Remove old installation
    if (Test-Path ${"$"}installDir) {
        Write-Info "Removing previous installation..."
        Remove-Item -Recurse -Force ${"$"}installDir
    }

    Write-Info "Extracting..."
    New-Item -ItemType Directory -Path ${"$"}installDir -Force | Out-Null

    # Use tar (available on Windows 10+)
    & tar -xzf ${"$"}tarball -C ${"$"}throughlineHome 2>${"$"}null
    if (${"$"}LASTEXITCODE -ne 0) {
        Write-Fail "Extraction failed. Ensure Windows 10 1803+ or install tar/7-zip."
    }

    # tarball extracts as throughline/ -- move to install/
    ${"$"}extracted = Join-Path ${"$"}throughlineHome "throughline"
    if ((Test-Path ${"$"}extracted) -and (${"$"}extracted -ne ${"$"}installDir)) {
        if (Test-Path ${"$"}installDir) { Remove-Item -Recurse -Force ${"$"}installDir }
        Rename-Item ${"$"}extracted ${"$"}installDir
    }

    Remove-Item ${"$"}tarball -Force -ErrorAction SilentlyContinue
    Write-Ok "Extracted to ${"$"}installDir"

    # Install template dependencies
    Write-Info "Installing template dependencies..."
    Push-Location (Join-Path ${"$"}installDir "template")
    & npm install --no-audit --no-fund --loglevel=error
    Pop-Location
    Write-Ok "Template ready"

    # Create shims for throughline command
    ${"$"}shimPath = Join-Path ${"$"}env:USERPROFILE ".throughline" "bin"
    New-Item -ItemType Directory -Path ${"$"}shimPath -Force | Out-Null

    # Create a .cmd shim
    ${"$"}cmdLines = @(
        '@echo off',
        ('node "%~dp0..\\install\\cli\\bin\\throughline.js" %*')
    )
    [System.IO.File]::WriteAllLines((Join-Path ${"$"}shimPath "throughline.cmd"), ${"$"}cmdLines)

    # Create a .ps1 shim
    ${"$"}ps1Lines = @(
        '& node (Join-Path $PSScriptRoot "..\\install\\cli\\bin\\throughline.js") @args'
    )
    [System.IO.File]::WriteAllLines((Join-Path ${"$"}shimPath "throughline.ps1"), ${"$"}ps1Lines)

    Write-Ok "Created throughline command in ${"$"}shimPath"

    # Check if shimPath is in PATH
    ${"$"}userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    if (${"$"}userPath -notlike "*${"$"}shimPath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "${"$"}shimPath;${"$"}userPath", "User")
        ${"$"}env:Path = "${"$"}shimPath;${"$"}env:Path"
        Write-Ok "Added ${"$"}shimPath to user PATH"
        Write-Warn "You may need to restart your terminal for PATH changes to take effect"
    }

    # Write default config
    ${"$"}configFile = Join-Path ${"$"}throughlineHome "config.json"
    if (-not (Test-Path ${"$"}configFile)) {
        ${"$"}config = @{
            template_path = Join-Path ${"$"}installDir "template"
            decks_path = Join-Path ${"$"}env:USERPROFILE "decks"
            port_range = @(5173, 5199)
        } | ConvertTo-Json -Depth 2
        Set-Content -Path ${"$"}configFile -Value ${"$"}config -Encoding UTF8
        Write-Ok "Config written to ${"$"}configFile"
    } else {
        Write-Ok "Config already exists -- kept as-is"
    }

    # Done
    Write-Host ""
    Write-Host "  Throughline is installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Get started:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    throughline new my-deck      # Create a deck"
    Write-Host "    throughline serve my-deck    # Start dev server"
    Write-Host "    throughline open my-deck     # Open in browser"
    Write-Host ""
    Write-Host "  Manage decks:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    throughline ls               # List all decks"
    Write-Host "    throughline publish my-deck  # Publish to cloud"
    Write-Host "    throughline export my-deck   # Export to PDF"
    Write-Host ""
    Write-Host "  Update anytime:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    throughline update           # Pull latest & rebuild"
    Write-Host ""
}

# -- Main ---
Show-Banner
Ensure-Node
Install-Throughline
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
  res.status(200).send(buildPowerShellScript(SITE_URL, token));
}
