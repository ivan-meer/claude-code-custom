#!/bin/bash
# ponytail: single POST per event. Switch to batch if >50 events/sec.
set -euo pipefail

WS_URL="${VIBECHAT_URL:-http://127.0.0.1:2209/event}"

if [ ! -t 0 ]; then
  INPUT=$(cat)
else
  exit 0
fi

NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // empty' 2>/dev/null)
MESSAGE=$(echo "$INPUT" | jq -r '.message // empty' 2>/dev/null)

if [ -z "$NOTIFICATION_TYPE" ]; then
  exit 0
fi

case "$NOTIFICATION_TYPE" in
  thinking)
    PAYLOAD=$(jq -n --arg content "$MESSAGE" '{type: "ThinkingBlock", data: {content: $content}, source: "notification"}')
    ;;
  subagent_spawn|subagent_start)
    PAYLOAD=$(jq -n --arg name "$MESSAGE" '{type: "SubagentSpawn", data: {agent_name: $name, action: "start"}, source: "notification"}')
    ;;
  subagent_end)
    PAYLOAD=$(jq -n --arg name "$MESSAGE" '{type: "SubagentSpawn", data: {agent_name: $name, action: "end"}, source: "notification"}')
    ;;
  permission|permission_request)
    PAYLOAD=$(jq -n --arg tool "$MESSAGE" '{type: "PermissionRequest", data: {tool_name: $tool, args: $tool, decision: "pending"}, source: "notification"}')
    ;;
  model_switch)
    PAYLOAD=$(jq -n --arg model "$MESSAGE" '{type: "ModelSwitch", data: {from_model: "", to_model: $model, reason: ""}, source: "notification"}')
    ;;
  *)
    # Generic notification → store as ThinkingBlock
    PAYLOAD=$(jq -n --arg msg "$MESSAGE" '{type: "ThinkingBlock", data: {content: $msg}, source: "notification"}')
    ;;
esac

curl -s -X POST "$WS_URL" -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1 || true
exit 0
