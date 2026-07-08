<!--
  Sync Impact Report
  ==================
  Version change: template → 1.0.0 (initial ratification)
  Modified principles: None (initial creation)
  Added sections: Core Principles (5), Technology Stack, Development Workflow, Governance
  Removed sections: None
  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — Constitution Check section compatible
    ✅ .specify/templates/spec-template.md — Requirements/acceptance format compatible
    ✅ .specify/templates/tasks-template.md — Phase structure compatible
    ✅ .specify/templates/checklist-template.md — compatible
  Follow-up TODOs: None
-->

# Claude Code Custom Constitution

## Core Principles

### I. Lazy Efficiency

Stop at the first rung that holds. The ladder: (1) does this need to exist?
(2) stdlib does it? (3) native platform covers it? (4) already-installed
dependency solves it? (5) can it be one line? (6) only then: minimum code.

Deletion over addition. Boring over clever. Fewest files, shortest diff.
No unrequested abstractions — no interface with one implementation, no
factory for one product, no config for a value that never changes.
No boilerplate or scaffolding "for later".

Non-trivial logic leaves ONE runnable check behind (assert, small test).
Trivial one-liners need no test.

### II. Hook-First Automation

Any recurring action ("from now on when X", "whenever Y", "before/after Z")
MUST be implemented as a Claude Code hook in settings.json, never as a
memory instruction or conversation artifact.

Hooks fire at lifecycle events (SessionStart, PreToolUse, PostToolUse,
Stop, Notification). Each hook receives JSON via stdin and returns
decisions via exit codes and stdout JSON. Hook errors MUST exit 0 to
avoid blocking Claude — non-blocking unless intentional deny.

Hook scripts live in `~/.claude/hooks/` (global) or `.claude/hooks/`
(project). Reference via `${CLAUDE_PROJECT_DIR}` or absolute paths.
Always add `timeout` field. Set `async: true` for notifications,
`async: false` for gates/denials.

### III. Composable Architecture

Everything MUST compose. Skills, agents, hooks, plugins, and workflows
are first-class building blocks. Prefer composing existing pieces over
building new ones.

- Skills: YAML frontmatter + instructions. Scoped to directory or global.
- Agents: Specialized sub-agents with tool restrictions.
- Hooks: Lifecycle automation via settings.json.
- Plugins: Marketplace-installed bundles of skills/hooks/agents.
- Workflows: Multi-agent orchestration for complex tasks.

Each component MUST be independently testable and replaceable. Never
tightly couple two components when one can call the other through a
standard interface.

### IV. Security at Trust Boundaries

Input validation at trust boundaries is NEVER simplified away. Error
handling that prevents data loss is NEVER removed. Security measures
and accessibility basics are NEVER bypassed for speed.

Hooks that auto-approve permissions MUST have explicit `if` matchers
scoped to known-safe patterns (e.g., `Bash(git status)` not `Bash(*)`).
Dangerous commands (rm -rf, DROP TABLE, force push to main) MUST be
blocked via PreToolUse hooks with `permissionDecision: "deny"`.

Secrets (API keys, tokens) MUST live in environment variables or
`.claude/settings.local.json` (gitignored), NEVER in committed files.

### V. Iterative Delivery

Ship the lazy version first, then question it. Each user story MUST be
independently testable and deployable. MVP = one working story, not a
complete system.

Foundational work (Phase 1-2) MUST complete before any user story.
User stories can proceed in parallel after foundation is ready.
Stop at each checkpoint to validate independently.

Commits after each logical group. Rollback plans for irreversible
actions. No big-bang integrations.

## Technology Stack

- **Runtime**: Node.js (primary), Bash/PowerShell (Windows hooks)
- **Platform**: Windows 11 (Git Bash shell for hooks)
- **Storage**: SQLite (better-sqlite3) for dashboard metrics
- **Frontend**: Vanilla HTML/JS or Svelte (no build tooling for MVP)
- **Notifications**: curl → ntfy.sh / Telegram / localhost:2208 (Ninerouter)
- **Models**: Via proxy (ANTHROPIC_BASE_URL), multiple model routing

## Development Workflow

- Use `/speckit-*` commands for spec-driven development
- Specs → Plan → Tasks → Issues pipeline
- Caveman mode: terse prose, fragments OK, technical terms exact
- Ponytail mode: shortest working diff, YAGNI, stdlib first
- Hooks auto-execute extension commands after specify/plan phases

## Governance

This constitution supersedes all other development practices for this
project. Amendments require:

1. Documentation of proposed change with rationale
2. Impact assessment on dependent templates and hooks
3. Version bump per semantic versioning (MAJOR/MINOR/PATCH)
4. Update of `LAST_AMENDED_DATE` in this file
5. Sync check against plan-template, spec-template, tasks-template

Compliance is verified during speckit-plan (Constitution Check gate).
Complexity violations MUST be justified in the Complexity Tracking
table of the implementation plan.

All PRs and code reviews MUST verify adherence to the five principles.
Use CLAUDE.md for runtime development guidance referenced by agents.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
