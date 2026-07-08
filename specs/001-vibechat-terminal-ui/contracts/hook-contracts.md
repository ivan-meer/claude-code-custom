# Hook Contracts: VibeChat

**Feature**: VibeChat Terminal UI

Each hook script receives JSON via stdin and MUST exit 0 (non-blocking).

## PostToolUse Hook

**File**: `hook-scripts/post-tool-use.sh`

**Input** (stdin):
```json
{
  "tool_name": "Bash",
  "tool_input": "ls",
  "tool_output": "...",
  "tool_result": "..."
}
```

**Action**: POST AgentEvent(type=ToolUse, state='end') to WS server.

## PreToolUse Hook

**File**: `hook-scripts/pre-tool-use.sh`

**Input** (stdin):
```json
{
  "tool_name": "Bash",
  "tool_input": "ls"
}
```

**Action**: POST AgentEvent(type=ToolUse, state='start') to WS server.

## Stop Hook

**File**: `hook-scripts/stop.sh`

**Input** (stdin):
```json
{
  "stop_reason": "end_turn",
  "stop_type": null
}
```

**Action**: POST AgentEvent(type=Timing) with duration + set SessionState to idle.

## Notification Hook

**File**: `hook-scripts/notification.sh`

**Input** (stdin):
```json
{
  "notification_type": "thinking",
  "message": "Claude is analyzing...",
  "tool_use_id": null
}
```

**Action**: POST appropriate AgentEvent (ThinkingBlock, SubagentSpawn based on notification_type).

## MessageDisplay Hook

**File**: `hook-scripts/message-display.sh`

**Input** (stdin):
```json
{
  "message": {
    "role": "assistant",
    "content": [{"type": "text", "text": "Hello"}]
  },
  "streaming": true
}
```

**Action**: POST AgentEvent(type=MessageDisplay) to WS server.
