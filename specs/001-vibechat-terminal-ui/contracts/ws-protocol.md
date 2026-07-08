# WebSocket Protocol Contract: VibeChat

**Feature**: VibeChat Terminal UI
**Transport**: WebSocket at `ws://127.0.0.1:2209`
**Format**: JSON text frames

## Server → Client (events)

### Event notification
```json
{
  "action": "event",
  "event": { }
}
```

Serialized AgentEvent in full. Each received event triggers UI update.

### Status snapshot
```json
{
  "action": "status_snapshot",
  "session": {
    "status": "executing",
    "currentTool": "Bash",
    "currentSubagent": null,
    "lastThought": "...",
    "model": "claude-sonnet-5",
    "eventCount": 42
  }
}
```

Sent on client connect (catch-up) and on significant state changes.

### Log replay
```json
{
  "action": "log_replay",
  "events": [ ]
}
```

Full event log buffer sent on client connect.

## Client → Server (control)

### Set filters
```json
{
  "action": "set_filters",
  "filters": {
    "ToolUse": true,
    "ThinkingBlock": false,
    "TokenCount": false
  }
}
```

### Get config
```json
{
  "action": "get_config"
}
```

### Response
```json
{
  "action": "config",
  "filters": { },
  "display": { "maxLogEntries": 2000 }
}
```
