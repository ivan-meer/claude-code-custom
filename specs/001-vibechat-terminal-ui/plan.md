# Implementation Plan: VibeChat Terminal UI

**Branch**: `001-vibechat-terminal-ui` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-vibechat-terminal-ui/spec.md`

## Summary

VibeChat — enhanced terminal UI for Claude Code delivering Full Debug notifications (tool use, thinking blocks, subagents, token counts, timing, model switches, permission requests). Architecture: Claude Code hooks capture events → WebSocket server broadcasts to hybrid UI (statusline + scrollable log). Foundation for future web GUI.

## Technical Context

**Language/Version**: Node.js 18+ (LTS)

**Primary Dependencies**: ws (WebSocket), ansi-escapes (terminal control). Native Node.js modules only where possible (http, fs, path).

**Storage**: Session-only (in-memory log buffer). No persistence for MVP. Config file (~/.vibechat.json) for filter preferences.

**Testing**: Node.js built-in `assert` module + manual integration testing via Claude Code hooks.

**Target Platform**: Windows 11 (Git Bash), macOS, Linux — any terminal with ANSI support.

**Project Type**: CLI tool + hook scripts + local WebSocket server.

**Performance Goals**: Statusline update <50ms latency. Log buffer handles >2000 events without degradation. WebSocket handles >50 events/sec.

**Constraints**: Zero impact on Claude Code performance. Hooks must exit <1ms (non-blocking). No external infrastructure dependencies.

**Scale/Scope**: Single-user localhost. Multi-session not required for MVP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Lazy Efficiency
- ✅ Hook scripts are short, single-purpose bash/Node.js scripts
- ✅ WebSocket server — single file for MVP
- ✅ No over-engineering: in-memory log, no DB, no auth for MVP
- ✅ stdlib-first: http, fs, path from Node.js core

### II. Hook-First Automation
- ✅ Claude Code hooks (PostToolUse, Stop, PreToolUse, Notification, MessageDisplay) — first-class citizens
- ✅ Hook scripts in `~/.claude/hooks/vibechat/` (global) or project `.claude/hooks/`
- ✅ Non-blocking design: hooks exit 0, fire-and-forget via WebSocket

### III. Composable Architecture
- ✅ WebSocket server = independent process, composable with future web GUI
- ✅ Event types are composable — each hook handler is separate module
- ✅ Filter system = composable middleware between events and display

### IV. Security at Trust Boundaries
- ✅ WebSocket server binds to 127.0.0.1 only — no external access
- ✅ Hook scripts validate event JSON before processing
- ✅ No secrets stored — config for display preferences only

### V. Iterative Delivery
- ✅ MVP = User Story 1 (Full Debug notifications) + User Story 3 (Statusline) + User Story 4 (Log)
- ✅ User Story 2 (Filters) = phase 2 after core works
- ✅ Each hook type implemented incrementally

**No violations. Complexity Tracking not required.** ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-vibechat-terminal-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── event-types.md   # AgentEvent schema
│   ├── ws-protocol.md   # WebSocket message format
│   └── hook-contracts.md# Hook input/output contracts
└── tasks.md             # Phase 2 output (speckit-tasks)
```

### Source Code (repository root)

```text
hook-scripts/
├── notification.sh      # Notification hook (async)
├── post-tool-use.sh     # PostToolUse hook
├── stop.sh              # Stop hook
├── pre-tool-use.sh      # PreToolUse hook
└── message-display.sh   # MessageDisplay hook

server/                  # WebSocket server
├── index.js             # Entry point — HTTP + WS server
├── session-state.js     # Current agent state tracking
└── filters.js           # User notification filter config

ui/                      # Terminal UI
├── ui.js                # Main UI render (statusline + log)
├── statusline.js        # Bottom bar render
└── log.js               # Scrollable log render

config/
└── index.js             # Config loader (filters, display prefs)

tests/
├── test-server.js       # WebSocket server tests
├── test-ui.js           # UI rendering tests
└── test-hooks.js        # Hook script tests
```

**Structure Decision**: Monorepo layout with three top-level dirs (hook-scripts, server, ui) and config/tests. Single project — no apps/packages split needed for MVP.

## Complexity Tracking

Not required — all Constitution checks passed.
