#!/usr/bin/env bash
set -euo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is required. Install Bun first, then run this script again."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

bun install
bun run typecheck
bun test

echo
echo "Setup verified. Start the application with:"
echo "  bun run dev"
echo "Then open http://127.0.0.1:9367"
