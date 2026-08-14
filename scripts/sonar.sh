#!/usr/bin/env bash
set -e

# Load token from .env.sonar (gitignored)
if [ ! -f "$(dirname "$0")/../.env.sonar" ]; then
  echo "❌ .env.sonar not found — copy .env.sonar.example and add your token"
  exit 1
fi

source "$(dirname "$0")/../.env.sonar"

if [ -z "$SONAR_TOKEN" ] || [ "$SONAR_TOKEN" = "your_token_here" ]; then
  echo "❌ SONAR_TOKEN not set in .env.sonar"
  exit 1
fi

# Regenerate coverage first. The scanner uploads coverage/lcov.info as-is, so a
# stale file silently scores the gate against code that no longer exists — this
# once reported new_coverage as 44.3% from a five-month-old report when the real
# figure was 85.5%, failing the gate with no code change behind it.
echo "🧪 Regenerating coverage report..."
pnpm test:coverage

echo "🔍 Running SonarCloud analysis..."

# All analysis settings (project key, sources, test/coverage exclusions, ignored
# rules) live in sonar-project.properties so this matches the CI analysis exactly.
# Only the host URL and the secret token are supplied here. Do NOT re-declare
# sonar.sources on the CLI — it bypasses the exclusions and pollutes the dashboard
# with issues from test files.
npx sonarqube-scanner \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token="$SONAR_TOKEN"

echo "✅ Done — check results at https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder"
