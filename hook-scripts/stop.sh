#!/bin/bash
# ponytail: simple stop event with current timestamp as duration proxy.
set -euo pipefail

WS_URL="${VIBECHAT_URL:-http://127.0.0.1:2209/event}"

if [ ! -t 0 ]; then
  INPUT=$(cat)
else
  exit 0
fi

STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // "end_turn"' 2>/dev/null)

PAYLOAD=$(jq -n \
  --arg reason "$STOP_REASON" \
  '{type: "Timing", data: {duration_ms: 0, action: $reason}, source: "stop"}')

curl -s -X POST "$WS_URL" -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1 || true
exit 0
