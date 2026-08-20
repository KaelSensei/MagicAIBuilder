#!/usr/bin/env bash
# PreToolUse hook for Bash: blocks `gh pr create` while SonarCloud has open issues.
#
# Deterministic on purpose. The previous prompt-based hook ignored its
# `if: "Bash(gh pr create:*)"` filter and judged unrelated multi-line shell
# commands (heredocs, for-loops, pipelines), blocking them with a Sonar message.
# This script reads the tool input from stdin, exits 0 silently for anything
# that is not a PR creation, and otherwise asks the SonarCloud API itself.
set -u

input="$(cat)"
command="$(printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -n 1)"

case "$command" in
  gh\ pr\ create*) ;;
  *) exit 0 ;;
esac

API="https://sonarcloud.io/api/issues/search?componentKeys=KaelSensei_MagicAIBuilder&statuses=OPEN&ps=1"
body="$(curl -s --ssl-no-revoke --max-time 20 "$API" 2>/dev/null)"
total="$(printf '%s' "$body" | sed -n 's/.*"total":\([0-9]*\).*/\1/p' | head -n 1)"

if [ -z "$total" ]; then
  echo "SonarCloud API unreachable — could not verify open issues. Retry, or check https://sonarcloud.io/project/issues?issueStatuses=OPEN&id=KaelSensei_MagicAIBuilder" >&2
  exit 2
fi

if [ "$total" != "0" ]; then
  # The count comes from the last analysis of the default branch, so a PR whose
  # whole purpose is to fix those issues is blocked by them — the fix cannot be
  # analysed until the PR exists. SONAR_GATE_OVERRIDE=1 is the escape hatch for
  # exactly that case (same shape as SKIP_E2E=1 on the pre-push gate); say why
  # in the PR body when you use it.
  if [ "${SONAR_GATE_OVERRIDE:-}" = "1" ]; then
    echo "SonarCloud has $total open issue(s) — SONAR_GATE_OVERRIDE=1 set, allowing." >&2
    exit 0
  fi
  echo "SonarCloud has $total open issue(s) — fix them before creating a PR (CLAUDE.md pre-PR gate, item 5)." >&2
  echo "If this PR is the fix, re-run with SONAR_GATE_OVERRIDE=1." >&2
  exit 2
fi

exit 0
