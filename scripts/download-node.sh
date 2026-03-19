#!/usr/bin/env bash
# Downloads a portable Node.js binary for bundling with the Tauri app.
# Usage: ./scripts/download-node.sh [version]
# Supports macOS, Linux, and Windows (via Git Bash / MSYS2 / WSL).

set -euo pipefail

NODE_VERSION="${1:-20.18.1}"
PLATFORM="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64)  ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

DEST="src-tauri/binaries"
mkdir -p "$DEST"

case "$PLATFORM" in
  darwin)
    EXT="tar.gz"
    FILENAME="node-v${NODE_VERSION}-darwin-${ARCH}"
    URL="https://nodejs.org/dist/v${NODE_VERSION}/${FILENAME}.${EXT}"
    echo "Downloading Node.js v${NODE_VERSION} for darwin-${ARCH}..."
    curl -fsSL "$URL" -o "/tmp/${FILENAME}.${EXT}"
    echo "Extracting node binary..."
    tar -xzf "/tmp/${FILENAME}.${EXT}" -C /tmp "${FILENAME}/bin/node"
    cp "/tmp/${FILENAME}/bin/node" "$DEST/node"
    chmod +x "$DEST/node"
    rm -rf "/tmp/${FILENAME}" "/tmp/${FILENAME}.${EXT}"
    echo "Node.js binary saved to $DEST/node"
    ;;
  linux)
    EXT="tar.xz"
    FILENAME="node-v${NODE_VERSION}-linux-${ARCH}"
    URL="https://nodejs.org/dist/v${NODE_VERSION}/${FILENAME}.${EXT}"
    echo "Downloading Node.js v${NODE_VERSION} for linux-${ARCH}..."
    curl -fsSL "$URL" -o "/tmp/${FILENAME}.${EXT}"
    echo "Extracting node binary..."
    tar -xJf "/tmp/${FILENAME}.${EXT}" -C /tmp "${FILENAME}/bin/node"
    cp "/tmp/${FILENAME}/bin/node" "$DEST/node"
    chmod +x "$DEST/node"
    rm -rf "/tmp/${FILENAME}" "/tmp/${FILENAME}.${EXT}"
    echo "Node.js binary saved to $DEST/node"
    ;;
  mingw*|msys*|cygwin*)
    # Windows via Git Bash / MSYS2 / Cygwin
    FILENAME="node-v${NODE_VERSION}-win-${ARCH}"
    URL="https://nodejs.org/dist/v${NODE_VERSION}/${FILENAME}.zip"
    echo "Downloading Node.js v${NODE_VERSION} for win-${ARCH}..."
    curl -fsSL "$URL" -o "/tmp/${FILENAME}.zip"
    echo "Extracting node.exe..."
    unzip -o -j "/tmp/${FILENAME}.zip" "${FILENAME}/node.exe" -d "$DEST"
    rm -f "/tmp/${FILENAME}.zip"
    echo "Node.js binary saved to $DEST/node.exe"
    ;;
  *)
    echo "Unsupported platform: $PLATFORM"
    exit 1
    ;;
esac
