#!/usr/bin/env bash

set -uo pipefail
cd "$(dirname "$0")/../.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

rm -rf allure-results

echo "── Running sd-e2e ──────────────────────────────────────"
E2E_STATUS="success"
npx playwright test --project=sd-e2e || E2E_STATUS="failure"

echo "── Running jp-api ──────────────────────────────────────"
API_STATUS="success"
npx playwright test --project=jp-api || API_STATUS="failure"

echo "── Generating Allure report ────────────────────────────"
npm run allure:gen

AI_SUMMARY_PATH=""
if [[ "$E2E_STATUS" == "failure" || "$API_STATUS" == "failure" ]]; then
  echo "── Analyzing failures (Groq) ───────────────────────────"
  npm run analyze:failures || true
  AI_SUMMARY_PATH="ai-analysis-summary.md"
fi

echo "── Self-healing summary ────────────────────────────────"
npm run healing:summary || true

echo "── Sending Telegram notification ───────────────────────"
COMMIT_SHA=$(git rev-parse --short HEAD)
REF_NAME=$(git rev-parse --abbrev-ref HEAD)
REPO_URL=$(git remote get-url origin)
REPO_OWNER=$(echo "$REPO_URL" | sed -E 's#.*[:/]([^/]+)/([^/.]+)(\.git)?$#\1#')
REPO_NAME=$(echo "$REPO_URL" | sed -E 's#.*[:/]([^/]+)/([^/.]+)(\.git)?$#\2#')

E2E_STATUS="$E2E_STATUS" \
API_STATUS="$API_STATUS" \
EVENT_NAME="local" \
PR_NUMBER="" \
PR_TITLE="" \
REF_NAME="$REF_NAME" \
REPO_OWNER="$REPO_OWNER" \
REPO_NAME="$REPO_NAME" \
RUN_URL="local run — see allure-report/index.html" \
COMMIT_SHA="$COMMIT_SHA" \
AI_SUMMARY_PATH="$AI_SUMMARY_PATH" \
bash .github/scripts/notify-telegram.sh

echo "── Opening Allure report ───────────────────────────────"
npm run allure:open
