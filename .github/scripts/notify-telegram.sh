#!/usr/bin/env bash

set -euo pipefail

if [[ "$E2E_STATUS" == "success" && "$API_STATUS" == "success" ]]; then
  STATUS_ICON="PASSED"
  STATUS_TEXT="All tests passed"
elif [[ "$E2E_STATUS" == "cancelled" || "$API_STATUS" == "cancelled" ]]; then
  STATUS_ICON="CANCELLED"
  STATUS_TEXT="Run was cancelled"
else
  STATUS_ICON="FAILED"
  STATUS_TEXT="Tests failed"
fi

ALLURE_URL="https://${REPO_OWNER}.github.io/${REPO_NAME}/"

if [[ "$EVENT_NAME" == "pull_request" ]]; then
  TRIGGER="PR #${PR_NUMBER}: ${PR_TITLE}"
elif [[ "$EVENT_NAME" == "manual" ]]; then
  TRIGGER="Full regression, triggered by ${TRIGGERED_BY:-someone} (${REF_NAME})"
elif [[ "$EVENT_NAME" == "local" ]]; then
  TRIGGER="Local regression run (${REF_NAME})"
else
  TRIGGER="Push to ${REF_NAME}"
fi

if [[ "$EVENT_NAME" == "merged" ]]; then
  if [[ "$STATUS_ICON" == "PASSED" ]]; then
    MESSAGE="*Merged — PR #${PR_NUMBER}*

${PR_TITLE}
→ ${REF_NAME} · ${COMMIT_SHA}

✅ All required checks passed

🔗 [CI run](${RUN_URL})"
  else
    MESSAGE="*Merged — PR #${PR_NUMBER}*

${PR_TITLE}
→ ${REF_NAME} · ${COMMIT_SHA}

⚠️ pr-checks.yml did not report a clean pass (${E2E_STATUS}) for this commit — possibly a direct push that bypassed review.

🔗 [CI run](${RUN_URL})"
  fi
elif [[ "$EVENT_NAME" == "local" ]]; then
  MESSAGE="*Playwright Tests — ${STATUS_ICON}*

Status: ${STATUS_TEXT}
Trigger: ${TRIGGER}
Commit: ${COMMIT_SHA}

E2E: ${E2E_STATUS}
API: ${API_STATUS}

📄 Full report: allure-report/index.html (opened locally)"
else
  MESSAGE="*Playwright Tests — ${STATUS_ICON}*

Status: ${STATUS_TEXT}
Trigger: ${TRIGGER}
Commit: ${COMMIT_SHA}

E2E: ${E2E_STATUS}
API: ${API_STATUS}

📊 [Allure Report](${ALLURE_URL})
🔗 [GitHub Actions](${RUN_URL})"
fi

if [[ -n "${AI_SUMMARY_PATH:-}" && -f "$AI_SUMMARY_PATH" ]]; then
  AI_SNIPPET=$(sed -n '/^## 🧭 Manual Tester Verdict$/,/^---$/p' "$AI_SUMMARY_PATH" | sed '1d;$d' | grep -v "^$" || true)
  if [[ -z "$AI_SNIPPET" ]]; then
    AI_SNIPPET=$(sed -n '/^## Manual Verdict$/,/^## /p' "$AI_SUMMARY_PATH" | sed '1d;$d' | grep -v "^$" || true)
  fi
  if [[ -z "$AI_SNIPPET" ]]; then
    AI_SNIPPET=$(grep -v "^#\|^---\|^$" "$AI_SUMMARY_PATH" | head -5 | tr '\n' ' ' || true)
  fi
  if [[ -n "$AI_SNIPPET" ]]; then
    if [[ "$EVENT_NAME" == "local" ]]; then
      DETAIL_HINT="full analysis in ${AI_SUMMARY_PATH}"
    else
      DETAIL_HINT="full analysis available in GitHub Actions logs"
    fi
    MESSAGE="${MESSAGE}

AI Analysis (brief):
${AI_SNIPPET}
(${DETAIL_HINT})"
  fi
fi

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
    \"text\": $(printf '%s' "$MESSAGE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
    \"parse_mode\": \"Markdown\",
    \"disable_web_page_preview\": false
  }"

# Send the full report as a file too, when there's a real failure analysis to attach
if [[ "$STATUS_ICON" == "FAILED" && -n "${AI_SUMMARY_PATH:-}" && -f "$AI_SUMMARY_PATH" ]]; then
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
    -F "chat_id=${TELEGRAM_CHAT_ID}" \
    -F "document=@${AI_SUMMARY_PATH}" \
    -F "caption=📄 AI Analysis Report" \
    -F "parse_mode=Markdown"
fi
