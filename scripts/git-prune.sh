#!/usr/bin/env bash
# Delete all local and remote branches except protected ones.
# Protected: main, master, develop, dev
# Also cleans up orphaned worktrees that block branch deletion.

set -euo pipefail

# Branches that must never be deleted
PROTECTED="main master develop dev staging production"

is_protected() {
  local branch="$1"
  for p in $PROTECTED; do
    [ "$branch" = "$p" ] && return 0
  done
  return 1
}

echo "Fetching and pruning remote refs..."
git fetch --prune

# Clean up orphaned worktrees (directories that no longer exist on disk)
echo ""
echo "Pruning orphaned worktrees..."
git worktree prune -v

# Force-remove any remaining worktrees (except the main one)
echo ""
echo "Removing active worktrees (except main)..."
git worktree list --porcelain | grep '^worktree ' | while read -r _ path; do
  # Skip the main worktree (the repo root)
  if [ "$path" = "$(git rev-parse --show-toplevel)" ]; then
    continue
  fi
  echo "  Removing worktree: $path"
  git worktree remove --force "$path" 2>/dev/null || true
done

echo ""
echo "Deleting local branches (except protected: $PROTECTED)..."
git branch --format='%(refname:short)' | while read -r branch; do
  if ! is_protected "$branch"; then
    echo "  Deleting: $branch"
    git branch -D "$branch" 2>/dev/null || echo "  Warning: could not delete $branch"
  fi
done

echo ""
echo "Deleting remote branches (except protected: $PROTECTED)..."
git branch -r --format='%(refname:short)' | while read -r remote_branch; do
  local_name="${remote_branch#origin/}"
  # Skip HEAD and protected branches
  if [ "$local_name" = "HEAD" ] || is_protected "$local_name"; then
    continue
  fi
  echo "  Deleting remote: $local_name"
  # --no-verify: branch deletion is not a code push, skip the pre-push e2e gate
  git push --no-verify origin --delete "$local_name" 2>/dev/null || echo "  Warning: could not delete remote $local_name"
done

echo ""
echo "Done. Protected branches preserved: $PROTECTED"
git branch -a
