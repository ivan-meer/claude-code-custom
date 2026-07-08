# Data Model: VibeChat Terminal UI

**Feature**: VibeChat Terminal UI
**Status**: Draft

## Entities

### AgentEvent

Primary unit of data — represents single notification event from Claude Code.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (UUID) | Yes | Unique event identifier |
| `type` | Enum (EventType) | Yes | Category of event |
| `data` | Object | Yes | Event-specific payload |
| `timestamp` | ISO 8601 | Yes | When event occurred |
| `source` | String | No | Which hook generated event (hook name) |

**EventType enum**:

| Value | Description | data.tool_name/data |
|-------|-------------|---------------------|
| `ToolUse` | Tool execution start/end | `{ tool_name, tool_input, state: 'start'|'end' }` |
| `ThinkingBlock` | Agent thinking | `{ content }` |
| `SubagentSpawn` | Subagent lifecycle | `{ agent_name, action: 'start'|'end', model }` |
| `TokenCount` | Token usage | `{ tokens_in, tokens_out, total }` |
| `Timing` | Timing info | `{ duration_ms, action }` |
| `ModelSwitch` | Model change | `{ from_model, to_model, reason }` |
| `PermissionRequest` | Permission dialog | `{ tool_name, args, decision: 'pending'|'approved'|'denied' }` |
| `MessageDisplay` | Text message | `{ text, stream: boolean, chunk: string }` |

**Validation rules**:
- `id` — must be non-empty UUID format
- `type` — must be one of EventType enum values
- `timestamp` — must be valid ISO 8601, server may reject events > 5s in future

### SessionState

Current running state of Claude Code agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentTool` | String | No | Currently executing tool name (null if idle) |
| `currentSubagent` | String | No | Currently active subagent name |
| `lastThought` | String | No | Most recent thinking block content |
| `status` | Enum | Yes | `idle` | `thinking` | `executing` | `waiting_permission` |
| `model` | String | No | Active model identifier |
| `sessionStart` | ISO 8601 | Yes | When session started |
| `eventCount` | Number | Yes | Total events this session |

**State transitions**: `idle` → `thinking` → `executing` → `thinking` | `idle`. `executing` → `waiting_permission` → `executing`.

### NotificationFilter

User preference controlling which events display.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventType` | String | Yes | EventType name |
| `enabled` | Boolean | Yes | True = show this type |
| `subtype` | String | No | Optional sub-filter (e.g., show only start for ToolUse) |

**Defaults**: All types enabled. Config stored at `~/.vibechat.json`.

### EventLog

In-memory rolling buffer.

| Field | Type | Description |
|-------|------|-------------|
| `entries` | Array<AgentEvent> | Event list, newest last |
| `maxSize` | Number | Max before oldest evicted (default: 2000) |
| `currentSize` | Number | Current entry count |
