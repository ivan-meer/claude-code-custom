# Quickstart: VibeChat Terminal UI

**Feature**: VibeChat Terminal UI

## Prerequisites

- Node.js 18+ (`node --version`)
- Claude Code CLI installed and available
- Git Bash or bash-compatible terminal (Windows Git Bash OK)

## Setup

```bash
# Install dependencies
npm install ws ansi-escapes

# Link hooks (one-time)
# Add to .claude/settings_local.json (project) or ~/.claude/settings.json (global)
# See: hook-contracts.md for expected hook JSON schemas
```

## Run

```bash
# Terminal 1: Start WebSocket server + UI
node server/index.js

# Terminal 2: Start Claude Code (hooks auto-connect via settings)
claude
```

## Validation Scenarios

### Scenario 1: Server starts and accepts connections

```bash
node server/index.js
# Expected:
#   - Output: "VibeChat WS server listening on ws://127.0.0.1:2209"
#   - No crash on startup
```

### Scenario 2: Event received and displayed in UI

```bash
# In Claude Code session, run any command (e.g., ls)
# Expected:
#   - Statusline updates showing current tool/thinking state
#   - Log area shows event entries with timestamps
```

### Scenario 3: UI handles >100 events

```bash
# Run multi-step task in Claude Code (e.g., find + grep + sed pipeline)
# Expected:
#   - Statusline updates for each step
#   - Log scrollable through all events
#   - No visible lag or flicker
```

### Scenario 4: WebSocket reconnect

```bash
# Kill and restart server while Claude Code is running
# Expected:
#   - UI shows "disconnected" state
#   - Auto-reconnects within 3s when server restarts
```

## Config

Edit `~/.vibechat.json` to toggle notification types:

```json
{
  "filters": {
    "ToolUse": true,
    "ThinkingBlock": true,
    "SubagentSpawn": true,
    "TokenCount": false,
    "Timing": true,
    "ModelSwitch": true,
    "PermissionRequest": true
  }
}
```

## Expected Outcomes

- All 7 Full Debug event types display in both statusline and log
- Statusline updates within 50ms of event
- Log handles 2000+ entries without slowdown
- Filters respect user preferences
- Server binds 127.0.0.1 only (no external access)
