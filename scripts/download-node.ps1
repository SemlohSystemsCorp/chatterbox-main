# Downloads a portable Node.js binary for bundling with the Tauri app on Windows.
# Usage: .\scripts\download-node.ps1 [-Version "20.18.1"]

param(
    [string]$Version = "20.18.1"
)

$ErrorActionPreference = "Stop"

$Arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
$Filename = "node-v${Version}-win-${Arch}"
$Url = "https://nodejs.org/dist/v${Version}/${Filename}.zip"
$Dest = "src-tauri\binaries"
$TempZip = "$env:TEMP\${Filename}.zip"
$TempDir = "$env:TEMP\${Filename}"

if (-not (Test-Path $Dest)) {
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
}

Write-Host "Downloading Node.js v${Version} for win-${Arch}..."
Invoke-WebRequest -Uri $Url -OutFile $TempZip -UseBasicParsing

Write-Host "Extracting node.exe..."
Expand-Archive -Path $TempZip -DestinationPath $env:TEMP -Force
Copy-Item "$TempDir\node.exe" "$Dest\node.exe" -Force

# Cleanup
Remove-Item $TempZip -Force -ErrorAction SilentlyContinue
Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Node.js binary saved to $Dest\node.exe"
