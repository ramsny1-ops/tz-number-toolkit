#!/usr/bin/env bash
set -euo pipefail
bun run typecheck
bun test
bun run doctor
