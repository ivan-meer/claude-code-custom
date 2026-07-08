#!/bin/bash
# ponytail: single POST per tool call. Switch to batch when needed.
set -euo pipefail

WS_URL="${VIBECHAT_URL:-http://127.0.0.1:2209/event}"

if [ ! -t 0 ]; then
  INPUT=$(cat)
else
  exit 0
fi

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null)
TOOL_OUTPUT=$(echo "$INPUT" | jq -sRr '@json' 2>/dev/null || echo "")

if [ -z "$TOOL_NAME" ]; then
  exit 0
fi

PAYLOAD=$(jq -n \
  --arg tn "$TOOL_NAME" \
  --arg ti "$TOOL_INPUT" \
  --arg to "$TOOL_OUTPUT" \
  '{type: "ToolUse", data: {tool_name: $tn, tool_input: $ti, tool_output: $to, state: "end"}, source: "post-tool-use"}')

curl -s -X POST "$WS_URL" -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1 || true
exit 0
