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

echo "🔍 Running SonarCloud analysis..."

npx sonarqube-scanner \
  -Dsonar.projectKey=KaelSensei_MagicAIBuilder \
  -Dsonar.organization=kaelsensei \
  -Dsonar.sources=src \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token="$SONAR_TOKEN"

echo "✅ Done — check results at https://sonarcloud.io/project/overview?id=KaelSensei_MagicAIBuilder"
