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

# An unattended run claims its slice by pushing an empty commit before it
# writes any code (I-74 §3.6, docs/product/specs/i74-a-roadmap-agents-can-execute.md),
# and that push must not cost a full E2E run. Git gives a pre-push hook one
# line per pushed ref on stdin: `<local ref> <local sha> <remote ref> <remote sha>`.
# The suite is skipped only when at least one ref line arrived and no pushed
# commit changes a file. Anything uncertain keeps the full gate: no ref lines
# (the script started by hand), a root commit, or a git command that fails.
readonly ZERO_SHA="0000000000000000000000000000000000000000"

# The commits a push sends for one ref: reachable from the local sha, and from
# no remote-tracking ref nor the remote's old tip when this clone has it.
commits_to_push() {
  local local_sha="$1" remote_sha="$2"
  local exclude=(--not --remotes)
  if [[ "$remote_sha" != "$ZERO_SHA" ]] && git cat-file -e "${remote_sha}^{commit}" 2>/dev/null; then
    exclude+=("$remote_sha")
  fi
  git rev-list "$local_sha" "${exclude[@]}"
}

# A commit changes no file when its tree is its first parent's tree. A root
# commit has no parent to compare with, so it counts as a change.
changes_files() {
  local commit="$1" parent_tree
  parent_tree="$(git rev-parse --verify -q "${commit}^1^{tree}")" || return 0
  [[ "$(git rev-parse "${commit}^{tree}")" != "$parent_tree" ]]
}

# Succeeds when stdin held at least one ref line and every commit the push
# sends changes no file. Deleting a remote branch sends no commit.
push_changes_no_file() {
  [[ -t 0 ]] && return 1
  local _local_ref local_sha _remote_ref remote_sha commits commit saw_ref=false
  while read -r _local_ref local_sha _remote_ref remote_sha; do
    [[ -n "$local_sha" ]] || continue
    saw_ref=true
    [[ "$local_sha" == "$ZERO_SHA" ]] && continue
    commits="$(commits_to_push "$local_sha" "$remote_sha")" || return 1
    for commit in $commits; do
      if changes_files "$commit"; then
        return 1
      fi
    done
  done
  [[ "$saw_ref" == true ]]
}

if push_changes_no_file; then
  echo "ℹ  Every commit in this push changes no file — skipping the e2e pre-push gate (I-74 §3.6)."
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
