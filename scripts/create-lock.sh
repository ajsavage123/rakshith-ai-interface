#!/bin/bash
cd "$(dirname "$0")/.."
echo "[v0] Working directory: $(pwd)"
echo "[v0] Creating package-lock.json..."
npm install --package-lock-only --legacy-peer-deps
if [ $? -eq 0 ]; then
  echo "[v0] Success! package-lock.json created"
else
  echo "[v0] Error creating lock file"
  exit 1
fi
