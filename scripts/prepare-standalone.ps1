# Builds the Next.js standalone output and copies static assets into the
# standalone directory so the sidecar server can serve everything.
# Windows equivalent of prepare-standalone.sh.
# Called by tauri.conf.json's beforeBuildCommand on Windows.

$ErrorActionPreference = "Stop"

Write-Host "Building Next.js in standalone mode..."
$env:TAURI_BUILD = "1"
npx next build

Write-Host "Copying static assets into standalone directory..."

if (Test-Path ".next\static") {
    New-Item -ItemType Directory -Path ".next\standalone\.next\static" -Force | Out-Null
    Copy-Item -Path ".next\static\*" -Destination ".next\standalone\.next\static\" -Recurse -Force
}

if (Test-Path "public") {
    New-Item -ItemType Directory -Path ".next\standalone\public" -Force | Out-Null
    Copy-Item -Path "public\*" -Destination ".next\standalone\public\" -Recurse -Force
}

Write-Host "Standalone build ready."
