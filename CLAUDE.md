<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
specs/001-vibechat-terminal-ui/plan.md
<!-- SPECKIT END -->

# VibeCoder Studio — Project Context

> Язык разработки: **Русский**. Документация и общение с пользователем — на русском.
> Коммиты, код, имена функций/переменных — английский.

## Navigation

| What | Where |
|------|-------|
| **Architecture & Stack** | [specs/001-vibechat-terminal-ui/plan.md](specs/001-vibechat-terminal-ui/plan.md) |
| **Spec & Requirements** | [specs/001-vibechat-terminal-ui/spec.md](specs/001-vibechat-terminal-ui/spec.md) |
| **Implementation Tasks** | [specs/001-vibechat-terminal-ui/tasks.md](specs/001-vibechat-terminal-ui/tasks.md) |
| **Data Model** | [specs/001-vibechat-terminal-ui/data-model.md](specs/001-vibechat-terminal-ui/data-model.md) |
| **Contracts (Event types, WS, Hooks)** | [specs/001-vibechat-terminal-ui/contracts/](specs/001-vibechat-terminal-ui/contracts/) |
| **Research Decisions** | [specs/001-vibechat-terminal-ui/research.md](specs/001-vibechat-terminal-ui/research.md) |
| **Validation Scenarios** | [specs/001-vibechat-terminal-ui/quickstart.md](specs/001-vibechat-terminal-ui/quickstart.md) |
| **Project Constitution** | [.specify/memory/constitution.md](.specify/memory/constitution.md) |
| **Repo README** | [README.md](README.md) |

## Tech Stack

- **Runtime**: Node.js 18+ LTS
- **Primary deps**: ws (WebSocket), ansi-escapes (terminal control)
- **Hooks**: Bash + curl (fire-and-forget via HTTP POST to WS server)
- **UI**: ANSI escape codes — statusline (fixed bottom bar) + scrollable log
- **Storage**: Session-only in-memory. Config at `~/.vibechat.json`
- **Platform**: Windows 11 / macOS / Linux. Terminal must support ANSI.

## Architecture

```
Claude Code Hooks → (POST) → WS Server (:2209) → (broadcast) → Terminal UI → Statusline + Log
                                                            → Future Web GUI
```

## Constitution Quick Reference

1. **Lazy Efficiency** — YAGNI, stdlib first, shortest working diff
2. **Hook-First** — hooks over memory instructions, settings.json over manual steps
3. **Composable** — independent replaceable components
4. **Security** — validate at trust boundaries, 127.0.0.1 only, no secrets in files
5. **Iterative** — MVP first, validate independently, ship incrementally

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
