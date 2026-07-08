# Research Document: VibeChat Terminal UI

**Feature**: VibeChat Terminal UI
**Status**: Complete

## Research Items

### R1: Claude Code Hook JSON Formats

**Decision**: Каждый тип хука получает стандартизированный JSON через stdin.

**Rationale**: Claude Code hooks have well-defined input formats documented in Claude Code docs:
- `PostToolUse`: `{tool_name, tool_input, tool_output, ...}`
- `PreToolUse`: `{tool_name, tool_input, ...}`
- `Stop`: `{stop_reason, ...}`
- `Notification`: `{notification_type, message, ...}`
- `MessageDisplay`: `{message, ...}`

Hook scripts parse stdin, extract relevant fields for AgentEvent, send via WebSocket.

**Alternatives considered**:
- Environment variables — limited for structured data, not viable
- Filesystem IPC — too slow, adds complexity
- stdin JSON — native Claude Code approach, zero extra config

### R2: WebSocket Server Design

**Decision**: Simple Node.js HTTP server upgraded to WebSocket via `ws` library. Single port (e.g., 2209).

**Rationale**:
- `ws` is 0-config, fast, widely deployed
- HTTP server handles initial upgrade handshake
- WebSocket provides persistent connection for UI clients
- Each client receives broadcast of all AgentEvents (plus filter context)
- Server stores rolling log buffer in memory (last 2000 events, FIFO)

**Alternatives considered**:
- SSE (Server-Sent Events) — unidirectional, can't use for config updates from UI to server
- Socket.io — overkill for local-only single-client connection
- Raw TCP — no browser compatibility for future web GUI

### R3: Terminal UI Rendering (Statusline + Scrollable Log)

**Decision**: Terminal split into two regions using ANSI escape codes:
- Upper area: scrollable log (uses terminal scrolling + line buffer)
- Bottom line(s): statusline (fixed position via cursor positioning)

**Rationale**:
- `ansi-escapes` npm package handles cursor positioning, clearing, etc.
- Statusline uses `ansi-escapes.cursorRestorePosition()` pattern to update without scroll interference
- Log area uses standard `process.stdout.write()` with newlines — scrolls naturally
- Terminal resize handled via `process.stdout.on('resize', ...)` event

**Key rendering approach**:
1. On terminal start: save cursor position
2. Reserve bottom 1-2 lines for statusline (clear + redraw on event)
3. All log output writes above statusline
4. On exit: restore cursor, clear statusline area

**ponytail:** Uses raw ANSI codes + ansi-escapes. No TUI framework (blessed, ink). Single file, ~100 lines for full UI. Add framework when layout complexity exceeds 5 screens.

**Alternatives considered**:
- `blessed` — overkill, adds 2MB dependency for what's ~100 lines of ANSI
- `ink` (React) — JSX build step, unnecessary complexity for terminal-only

### R4: Hook-to-WebSocket Bridge Pattern

**Decision**: Hook scripts send events via `curl` POST to HTTP endpoint on WebSocket server, server broadcasts to all clients.

**Rationale**:
- Hook scripts need no Node.js runtime — bash/curl is universal
- HTTP POST is fire-and-forget (async), matches hook requirement of non-blocking
- Server validates event JSON format before broadcasting
- Retry not needed — if server is down, events are missed (acceptable for MVP)

**Endpoint design**:
```
POST http://127.0.0.1:2209/event  ->  server.broadcast(event)
Content-Type: application/json
Body: {"type": "ToolUse", "data": {...}}
```

**ponytail:** curl-based POST from hooks. If performance issues arise (>50 events/sec), switch to Unix domain sockets or named pipes. Not expected for single-user terminal.

### R5: Configuration Storage

**Decision**: JSON file at `~/.vibechat.json` with filter preferences.

**Rationale**:
- Simple, human-readable
- No DB dependency for MVP
- Config loaded once on WS server start + on `POST /config` update
- Default config: all notification types enabled

**Config schema**:
```json
{
  "filters": {
    "ToolUse": true,
    "ThinkingBlock": true,
    "SubagentSpawn": true,
    "TokenCount": true,
    "Timing": true,
    "ModelSwitch": true,
    "PermissionRequest": true
  },
  "display": {
    "statuslineLines": 1,
    "maxLogEntries": 2000
  }
}
```
