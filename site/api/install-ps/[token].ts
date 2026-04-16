import type { VercelRequest, VercelResponse } from "@vercel/node";

const VALID_TOKENS = new Set([
  "9b3998ea32f54ec9",
]);

const SITE_URL = process.env.SHINE_SITE_URL || "https://shine-site-lemon.vercel.app";

function buildPowerShellScript(siteUrl: string, token: string): string {
  // PowerShell backtick is the escape char — must be escaped in JS template literals
  const BT = '`';  // backtick helper to avoid breaking the template literal

  return `#Requires -Version 5.1
# Shine installer for Windows (PowerShell)
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
    Write-Host "  Beautiful slide decks made simple." -ForegroundColor DarkGray
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
function Install-Shine {
    ${"$"}shineHome = if (${"$"}env:SHINE_HOME) { ${"$"}env:SHINE_HOME } else { Join-Path ${"$"}env:USERPROFILE ".shine" }
    ${"$"}installDir = Join-Path ${"$"}shineHome "install"
    ${"$"}tarballUrl = "${siteUrl}/api/download/${token}"

    New-Item -ItemType Directory -Path ${"$"}shineHome -Force | Out-Null

    ${"$"}tarball = Join-Path ${"$"}shineHome "shine-latest.tar.gz"

    Write-Info "Downloading Shine..."
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
    & tar -xzf ${"$"}tarball -C ${"$"}shineHome 2>${"$"}null
    if (${"$"}LASTEXITCODE -ne 0) {
        Write-Fail "Extraction failed. Ensure Windows 10 1803+ or install tar/7-zip."
    }

    # tarball extracts as shine/ -- move to install/
    ${"$"}extracted = Join-Path ${"$"}shineHome "shine"
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

    # Create shims for shine command
    ${"$"}shimPath = Join-Path ${"$"}env:USERPROFILE ".shine" "bin"
    New-Item -ItemType Directory -Path ${"$"}shimPath -Force | Out-Null

    # Create a .cmd shim
    ${"$"}cmdLines = @(
        '@echo off',
        ('node "%~dp0..\\install\\cli\\bin\\shine.js" %*')
    )
    [System.IO.File]::WriteAllLines((Join-Path ${"$"}shimPath "shine.cmd"), ${"$"}cmdLines)

    # Create a .ps1 shim
    ${"$"}ps1Lines = @(
        '& node (Join-Path $PSScriptRoot "..\\install\\cli\\bin\\shine.js") @args'
    )
    [System.IO.File]::WriteAllLines((Join-Path ${"$"}shimPath "shine.ps1"), ${"$"}ps1Lines)

    Write-Ok "Created shine command in ${"$"}shimPath"

    # Check if shimPath is in PATH
    ${"$"}userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    if (${"$"}userPath -notlike "*${"$"}shimPath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "${"$"}shimPath;${"$"}userPath", "User")
        ${"$"}env:Path = "${"$"}shimPath;${"$"}env:Path"
        Write-Ok "Added ${"$"}shimPath to user PATH"
        Write-Warn "You may need to restart your terminal for PATH changes to take effect"
    }

    # Write default config
    ${"$"}configFile = Join-Path ${"$"}shineHome "config.json"
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
    Write-Host "  Shine is installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Get started:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    shine new my-deck      # Create a deck"
    Write-Host "    shine serve my-deck    # Start dev server"
    Write-Host "    shine open my-deck     # Open in browser"
    Write-Host ""
    Write-Host "  Manage decks:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    shine ls               # List all decks"
    Write-Host "    shine publish my-deck  # Publish to cloud"
    Write-Host "    shine export my-deck   # Export to PDF"
    Write-Host ""
    Write-Host "  Update anytime:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    shine update           # Pull latest & rebuild"
    Write-Host ""
}

# -- Main ---
Show-Banner
Ensure-Node
Install-Shine
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
