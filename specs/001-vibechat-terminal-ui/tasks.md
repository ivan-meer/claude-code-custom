# Tasks: VibeChat Terminal UI

**Input**: Design documents from `/specs/001-vibechat-terminal-ui/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL — included only where explicitly noted.

**Organization**: Tasks grouped by user story for independent implementation/testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (MX = MVP cross-cutting, US1-4 = story-specific)
- Include exact file paths

## Path Conventions

- Project root: `d:\.AGENTOS\claude-code-custom\`
- Source: `hook-scripts/`, `server/`, `ui/`, `config/`, `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize npm project in `package.json` with ws + ansi-escapes dependencies
- [ ] T002 [P] Create source directories: `hook-scripts/`, `server/`, `ui/`, `config/`, `tests/`
- [ ] T003 [P] Create `.gitignore` excluding `node_modules/`, `*.log`, `~/.vibechat.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Must complete before ANY user story work begins

- [ ] T004 [P] Implement WebSocket server entry point in `server/index.js` — HTTP server on `127.0.0.1:2209`, WebSocket upgrade handler, POST `/event` endpoint for hooks, GET `/health` endpoint
- [ ] T005 [P] Implement config loader in `config/index.js` — reads `~/.vibechat.json` (default if missing), validates filter keys against known EventType list
- [ ] T006 Implement session state tracker in `server/session-state.js` — state machine (idle → thinking → executing → waiting_permission), exposes `getState()`, `updateState(event)` methods, emits state change events

**Checkpoint**: Server starts, accepts WS connections, responds to GET /health. Config loads without errors.

---

## Phase 3: MVP — Core Notifications + Statusline + Log (US1 + US3 + US4) 🎯

**Goal**: User sees Full Debug notifications from Claude Code in both statusline (live state) and scrollable log (history).

**Independent Test**: Start server, send test event via `curl -X POST http://127.0.0.1:2209/event -d '{"type":"ThinkingBlock","data":{"content":"test"}}'` → verify statusline updates and log entry appears.

### Hook Scripts (Event Producers)

- [ ] T007 [P] [MX] Create `notification.sh` — reads stdin JSON, validates `notification_type` field, POSTs AgentEvent to `http://127.0.0.1:2209/event`, exits 0 on any outcome
- [ ] T008 [P] [MX] Create `post-tool-use.sh` — reads stdin, maps to AgentEvent(type=ToolUse, state='end') with tool_name, tool_input, tool_output, POSTs to WS server
- [ ] T009 [P] [MX] Create `pre-tool-use.sh` — reads stdin, maps to AgentEvent(type=ToolUse, state='start') with tool_name, tool_input, POSTs to WS server
- [ ] T010 [P] [MX] Create `stop.sh` — reads stdin, maps to AgentEvent(type=Timing) with duration_ms and sets session idle, POSTs to WS server
- [ ] T011 [P] [MX] Create `message-display.sh` — reads stdin, maps to AgentEvent(type=MessageDisplay) with text and streaming flag, POSTs to WS server

### UI Components (Event Consumers)

- [ ] T012 [P] [MX] Implement `ui/statusline.js` — subscribes to WS server, renders fixed bottom bar (1-2 lines) using ANSI escape codes showing current agent state (status, tool, thought, model, event count). Updates in-place without scroll flicker.
- [ ] T013 [P] [MX] Implement `ui/log.js` — subscribes to WS server, maintains in-memory rolling buffer (max 2000 entries), renders scrollable event history above statusline with GFM formatting, supports PgUp/PgDn/arrow keys for navigation
- [ ] T014 [MX] Implement `ui/ui.js` — orchestrator: starts WS client to `ws://127.0.0.1:2209`, instantiates statusline + log, handles terminal resize events, manages graceful shutdown (restore cursor on Ctrl+C)

### Integration

- [ ] T015 [MX] Create Claude Code hook registration in `.claude/hooks/settings.json` (or `~/.claude/settings.json`) — references all 5 hook scripts with `async: true` and `timeout: 1000`
- [ ] T016 [MX] Wire event dispatch in `server/index.js` — POST `/event` handler validates JSON against hook-contracts.md schemas, pushes to session-state, broadcasts to all WS clients, maintains log buffer

**Checkpoint**: Run scenario from quickstart.md — Claude Code executes command, statusline updates in real-time, log shows full history scrollable with keyboard.

---

## Phase 4: User Story 2 — Configure Notification Filters (Priority: P2)

**Goal**: User can toggle which notification types display. All types shown by default.

**Independent Test**: Disable "TokenCount" filter, run token-heavy task in Claude Code, verify token events don't display but tool/thinking events still do.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Implement filter middleware in `server/filters.js` — loads config, exposes `isEnabled(eventType)` check, re-reads config on file change
- [ ] T018 [US2] Integrate filters into event broadcast path in `server/index.js` — before broadcasting to WS clients, filter each event against active filter config
- [ ] T019 [US2] Add filter toggle UI to `ui/statusline.js` — bottom-bar indicator showing active/inactive event types (e.g., `[T:✓][S:✓][K:✗]` for tools, thinking, tokens)
- [ ] T020 [US2] Implement config save endpoint in `server/index.js` — `POST /config` accepts filter map, persists to `~/.vibechat.json`, broadcasts config change to WS clients

**Checkpoint**: Toggle filters, verify only selected event types appear in both statusline and log. Config survives server restart.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, tests, documentation

- [ ] T021 [P] Write self-check test for server in `tests/test-server.js` — starts server, sends test events via curl, verifies WS broadcast received, verifies log buffer content, verifies disconnect → reconnect cycle
- [ ] T022 [P] Write self-check test for hook scripts in `tests/test-hooks.js` — pipes sample JSON into each hook script, verifies non-zero exit is never returned, verifies correct POST URL and body format
- [ ] T023 [P] Write self-check test for statusline in `tests/test-ui.js` — sends sequence of AgentEvents, verifies statusline contains expected state transitions
- [ ] T024 Handle edge cases in `server/index.js`: port conflict (try next port or error with clear message), malformed event JSON (log warning, discard), WS disconnect (cleanup client)
- [ ] T025 Handle edge cases in `ui/ui.js`: terminal resize redraw, WS reconnect with exponential backoff (max 3s), graceful Ctrl+C cleanup
- [ ] T026 Run `quickstart.md` validation scenarios and fix any failures
- [ ] T027 Update `README.md` with VibeChat usage instructions (prerequisites, install, run, config)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **MVP (Phase 3)**: Depends on Foundational completion — delivers US1 + US3 + US4
- **Filters (Phase 4)**: Depends on MVP completion — adds US2
- **Polish (Phase 5)**: Depends on all desired user stories

### User Story Dependencies

- **MX (MVP)**: US1 + US3 + US4 — combined, no internal story dependencies
- **US2 (P2)**: Independent of story structure, depends only on MVP event pipeline

### Within Each Phase

- [P] tasks in parallel. Non-[P] tasks sequential.
- Tests (if included) MUST fail before implementation.

### Parallel Opportunities

| Phase | [P] tasks |
|-------|-----------|
| Setup | T002, T003 |
| Foundational | T004, T005 |
| Phase 3 (MVP) | T007–T013 (all hook scripts + both UI components) |
| Phase 4 (US2) | T017 only |

---

## Parallel Example: MVP Launch

```bash
# Launch all hook scripts together:
Task: "Create hook-scripts/notification.sh"
Task: "Create hook-scripts/post-tool-use.sh"
Task: "Create hook-scripts/pre-tool-use.sh"
Task: "Create hook-scripts/stop.sh"
Task: "Create hook-scripts/message-display.sh"

# Launch UI components together:
Task: "Implement ui/statusline.js"
Task: "Implement ui/log.js"
```

---

## Implementation Strategy

### MVP First (Phase 1 → 2 → 3)

1. Complete Phase 1: Setup — directory structure, deps
2. Complete Phase 2: Foundational — server + config + state
3. Complete Phase 3: MVP — hooks + statusline + log
4. **STOP and VALIDATE**: Run quickstart.md scenarios
5. Ship if ready

### Incremental Delivery

1. Setup + Foundational → `node server/index.js` starts and accepts connections
2. Add hooks + UI → Full Debug visible in terminal (MVP!)
3. Add filters → User controls notification noise (US2)

### Notes

- [P] tasks = different files, no dependencies
- [MX] label = cross-cutting MVP tasks (US1+US3+US4)
- Commit after each logical group
- Stop at each checkpoint to validate independently
- Hook scripts use only bash + curl — no Node.js needed in hooks
- Server uses only ws + Node.js stdlib (http, fs, path)
- UI uses only ansi-escapes + Node.js stdlib
