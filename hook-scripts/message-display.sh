#!/bin/bash
# ponytail: extracts text content from MessageDisplay message. Simple grep approach.
set -euo pipefail

WS_URL="${VIBECHAT_URL:-http://127.0.0.1:2209/event}"

if [ ! -t 0 ]; then
  INPUT=$(cat)
else
  exit 0
fi

MESSAGE_TEXT=$(echo "$INPUT" | jq -r '.message.content[0].text // .message // empty' 2>/dev/null)
STREAMING=$(echo "$INPUT" | jq -r '.streaming // false' 2>/dev/null)

if [ -z "$MESSAGE_TEXT" ]; then
  exit 0
fi

PAYLOAD=$(jq -n \
  --arg text "$MESSAGE_TEXT" \
  --argjson stream "$STREAMING" \
  '{type: "MessageDisplay", data: {text: $text, stream: $stream, chunk: ""}, source: "message-display"}')

curl -s -X POST "$WS_URL" -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1 || true
exit 0
