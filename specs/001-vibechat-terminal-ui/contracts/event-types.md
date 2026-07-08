# Event Types Contract: VibeChat

**Feature**: VibeChat Terminal UI

Each event is a JSON object sent from hook → WS server → UI client.

## Wire Format (UI-facing)

```json
{
  "id": "evt_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "ToolUse",
  "data": { },
  "timestamp": "2026-07-09T12:34:56.789Z",
  "source": "post-tool-use"
}
```

## Event Schemas

### ToolUse
```json
{
  "type": "ToolUse",
  "data": {
    "tool_name": "Bash",
    "tool_input": "ls -la",
    "tool_output": "total 42\ndrwxr-xr-x",
    "state": "end"
  }
}
```

### ThinkingBlock
```json
{
  "type": "ThinkingBlock",
  "data": {
    "content": "analyzing user request for file structure..."
  }
}
```

### SubagentSpawn
```json
{
  "type": "SubagentSpawn",
  "data": {
    "agent_name": "explore",
    "action": "start",
    "model": "claude-sonnet-5"
  }
}
```

### TokenCount
```json
{
  "type": "TokenCount",
  "data": {
    "tokens_in": 1250,
    "tokens_out": 340,
    "total": 1590
  }
}
```

### Timing
```json
{
  "type": "Timing",
  "data": {
    "duration_ms": 2450,
    "action": "tool_execution"
  }
}
```

### ModelSwitch
```json
{
  "type": "ModelSwitch",
  "data": {
    "from_model": "claude-sonnet-5",
    "to_model": "claude-opus-4-8",
    "reason": "complex_reasoning"
  }
}
```

### PermissionRequest
```json
{
  "type": "PermissionRequest",
  "data": {
    "tool_name": "Bash",
    "args": "rm -rf /tmp/build",
    "decision": "pending"
  }
}
```

### MessageDisplay
```json
{
  "type": "MessageDisplay",
  "data": {
    "text": "Claude is working on your request...",
    "stream": true,
    "chunk": "Building"
  }
}
```
