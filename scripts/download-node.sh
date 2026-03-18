#!/usr/bin/env bash
# Downloads a portable Node.js binary for bundling with the Tauri app.
# Usage: ./scripts/download-node.sh [version]

set -euo pipefail

NODE_VERSION="${1:-20.18.1}"
PLATFORM="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64)  ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

case "$PLATFORM" in
  darwin) EXT="tar.gz" ;;
  linux)  EXT="tar.xz" ;;
  *) echo "Unsupported platform: $PLATFORM"; exit 1 ;;
esac

FILENAME="node-v${NODE_VERSION}-${PLATFORM}-${ARCH}"
URL="https://nodejs.org/dist/v${NODE_VERSION}/${FILENAME}.${EXT}"
DEST="src-tauri/binaries"

mkdir -p "$DEST"

echo "Downloading Node.js v${NODE_VERSION} for ${PLATFORM}-${ARCH}..."
curl -fsSL "$URL" -o "/tmp/${FILENAME}.${EXT}"

echo "Extracting node binary..."
if [ "$EXT" = "tar.gz" ]; then
  tar -xzf "/tmp/${FILENAME}.${EXT}" -C /tmp "${FILENAME}/bin/node"
else
  tar -xJf "/tmp/${FILENAME}.${EXT}" -C /tmp "${FILENAME}/bin/node"
fi

cp "/tmp/${FILENAME}/bin/node" "$DEST/node"
chmod +x "$DEST/node"

rm -rf "/tmp/${FILENAME}" "/tmp/${FILENAME}.${EXT}"
echo "Node.js binary saved to $DEST/node"
