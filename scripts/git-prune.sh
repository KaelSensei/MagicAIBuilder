#!/usr/bin/env bash
# Delete all local and remote branches except main

set -e

echo "Fetching and pruning remote refs..."
git fetch --prune

echo ""
echo "Deleting local branches (except main)..."
git branch | grep -v '^\* main$' | grep -v '^  main$' | xargs -r git branch -D

echo ""
echo "Deleting remote branches (except main)..."
git branch -r \
  | grep -v 'origin/main' \
  | grep -v 'origin/HEAD' \
  | sed 's|  origin/||' \
  | xargs -r -I{} git push origin --delete {}

echo ""
echo "Done. Only main remains."
