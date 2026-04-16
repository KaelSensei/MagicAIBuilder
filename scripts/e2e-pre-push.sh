#!/usr/bin/env bash
# Pre-push e2e runner.
# Invokes the `e2e-runner` Claude subagent (headless) when the `claude` CLI is on PATH,
# otherwise falls back to running docker-compose directly. Either path blocks the push
# on any non-zero exit from the e2e container.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

printf '\n▶ Running full Playwright e2e suite in Docker (pre-push gate)...\n\n'

# Skip hook entirely when explicitly opted out (emergency escape hatch).
if [[ "${SKIP_E2E:-}" == "1" ]]; then
  echo "⚠  SKIP_E2E=1 set — skipping e2e pre-push gate."
  exit 0
fi

# Skip in CI — CI has its own e2e job.
if [[ -n "${CI:-}" ]]; then
  echo "ℹ  CI detected — skipping local e2e pre-push gate (CI runs e2e separately)."
  exit 0
fi

run_direct() {
  PLAYWRIGHT_SPEC="" docker compose -f docker-compose.e2e.yml up \
    --build \
    --abort-on-container-exit \
    --exit-code-from e2e
}

cleanup() {
  docker compose -f docker-compose.e2e.yml down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

if command -v claude >/dev/null 2>&1; then
  echo "ℹ  Using Claude 'e2e-runner' agent (headless)."
  # Headless Claude invocation. The agent handles execution + diagnosis.
  # --dangerously-skip-permissions is intentional: pre-push must be non-interactive.
  if claude -p "@e2e-runner run the full e2e suite now and report PASS or FAIL" \
       --dangerously-skip-permissions; then
    echo "✓ E2E passed — push allowed."
    exit 0
  else
    echo "✗ E2E failed — push blocked."
    exit 1
  fi
fi

echo "ℹ  'claude' CLI not found — running docker-compose directly."
if run_direct; then
  echo "✓ E2E passed — push allowed."
  exit 0
else
  echo "✗ E2E failed — push blocked. Check playwright-report/ for details."
  exit 1
fi
