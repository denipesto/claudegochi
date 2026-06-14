# cc-statusline one-liner bootstrap (Windows / PowerShell).
#   irm https://raw.githubusercontent.com/denipesto/cc-statusline/main/install.ps1 | iex
# Clones (or updates) the repo into ~/.cc-statusline and runs the installer.

$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/denipesto/cc-statusline.git'
$dir  = Join-Path $HOME '.cc-statusline'

foreach ($cmd in 'git', 'node') {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Host "✗ '$cmd' not found in PATH. Install it first." -ForegroundColor Red
    return
  }
}

if (Test-Path (Join-Path $dir '.git')) {
  Write-Host "↻ updating $dir"
  git -C $dir pull --ff-only
} else {
  Write-Host "↓ cloning into $dir"
  git clone --depth 1 $repo $dir
}

node (Join-Path $dir 'bin/install.mjs') @args
