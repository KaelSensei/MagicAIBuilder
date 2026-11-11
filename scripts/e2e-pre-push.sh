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

# Skip in CI. CI runs the same Docker stack from .github/workflows/e2e.yml (see
# "E2E gate" in docs/engineering/quality-gate.md); this guard keeps a push made
# from a CI job from starting it a second time.
if [[ -n "${CI:-}" ]]; then
  echo "ℹ  CI detected — skipping the local e2e pre-push gate. CI runs e2e in .github/workflows/e2e.yml."
  exit 0
fi

# Every clone and worktree on this machine shares one compose project
# (`name: magicaibuilder-e2e`). Two pushes at once replaced each other's
# containers mid-run on 2026-11-09 and both gates failed with no failing test.
# A second run therefore waits for the first. The lock is held until this
# script exits, so the diagnosis pass and `compose down` finish first too.
acquire_e2e_lock() {
  if ! command -v flock >/dev/null 2>&1; then
    echo "ℹ  flock not found — running without the machine-wide e2e lock."
    return 0
  fi
  exec 9>"${E2E_LOCK_FILE:-/tmp/magicaibuilder-e2e-pre-push.lock}"
  if ! flock -n 9; then
    echo "⏳ Another pre-push e2e run is in progress on this machine — waiting for it to finish..."
    flock 9
  fi
}

# The report directory is bind-mounted, so Playwright writes into whatever is
# already there. It overwrites index.html but leaves older attachments in
# data/, which means a reader browsing that folder can still open evidence from
# a previous run. Clearing first is the difference between "the report is this
# run" and "the report is mostly this run".
#
# The container writes as root. A run that is killed before it finishes leaves
# root-owned traces the host user cannot delete, and `set -e` then blocked
# every later push until someone ran `sudo chown`. Remove them through a
# container instead.
clear_report() {
  if ! rm -rf playwright-report test-results 2>/dev/null; then
    echo "ℹ  Removing root-owned report files left by an earlier run."
    docker run --rm -v "$ROOT":/w alpine rm -rf /w/playwright-report /w/test-results
  fi
  mkdir -p playwright-report test-results
}

run_direct() {
  PLAYWRIGHT_SPEC="" docker compose -f docker-compose.e2e.yml up \
    --build \
    --abort-on-container-exit \
    --exit-code-from e2e
}

cleanup() {
  docker compose -f docker-compose.e2e.yml down -v >/dev/null 2>&1 || true
}
acquire_e2e_lock
trap cleanup EXIT

clear_report

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
