#!/usr/bin/env bash
# Pre-push e2e runner.
#
# The verdict ALWAYS comes from the e2e container's exit code. An earlier
# version gated on `claude -p ...` instead, but that command exits 0 whenever
# the CLI itself ran — the agent's PASS/FAIL is only prose on stdout. The gate
# therefore printed "✓ E2E passed — push allowed" on a run with 27 failures.
#
# The agent is still useful, just not as the authority: it is invoked to
# diagnose a failure after the fact, and cannot turn a red run green.

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

if run_direct; then
  echo "✓ E2E passed — push allowed."
  exit 0
fi

echo "✗ E2E failed — push blocked. Check playwright-report/ for details."

# Optional diagnosis pass. Advisory only: the exit code below is unconditional.
if command -v claude >/dev/null 2>&1; then
  echo "ℹ  Asking the 'e2e-runner' agent to diagnose (advisory, cannot unblock)."
  # --dangerously-skip-permissions is intentional: pre-push must be non-interactive.
  claude -p "The e2e suite just failed. Read playwright-report/ and the compose logs, then explain the distinct root causes. Do not modify files." \
    --dangerously-skip-permissions || true
fi

exit 1
