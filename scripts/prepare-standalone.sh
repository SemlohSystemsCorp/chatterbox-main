#!/usr/bin/env bash
# Builds the Next.js standalone output and copies static assets into the
# standalone directory so the sidecar server can serve everything.
# This is called by tauri.conf.json's beforeBuildCommand via `npm run build:standalone`.

set -euo pipefail

echo "Building Next.js in standalone mode..."
TAURI_BUILD=1 npx next build

echo "Copying static assets into standalone directory..."
# Next.js standalone doesn't include the static dir or public dir by default
if [ -d ".next/static" ]; then
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/
fi

if [ -d "public" ]; then
  mkdir -p .next/standalone/public
  cp -r public/* .next/standalone/public/
fi

echo "Standalone build ready."
