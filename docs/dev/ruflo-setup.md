# Ruflo setup — T-003 (2026-11-26)

Development tooling only; nothing here ships in production images.

## Pin
- Fork `kayvanazarbarzin/ruflo` synced with `ruvnet/ruflo` (was 3228 commits behind, 0 ahead), tagged `lavin-pin-2026-11-26` = `3f2a40a2f06db9138f97ad8d582329189395e8ab`.
- CLI: `ruflo@3.80.8` (MIT, SLSA provenance verified by `init`), run only as `npx -y ruflo@3.80.8` → `ruflo v3.80.8`.
- **2026-11-27 change:** Ruflo was first an exact dev dependency, then removed. With pnpm 10 guards on, its ~700-package tree hit trust downgrades (`agentdb@3.10.1`, `@ruvector/core@0.1.39` lost provenance) and versions younger than 7 days (`ruflo` itself, `ruvector`, `metaharness`), blocking every `pnpm add`. Removing it cut the lockfile from 1683 to 334 packages and the license exceptions to zero.
- Global skill `ruflo` installed with `npx skills add https://github.com/ruvnet/ruflo --skill ruflo -g` (owner command).

## `ruflo init` (reviewed)
Run: `ruflo init --minimal --no-global --no-signup --no-telemetry-prompt --no-mods --no-plugin-install --no-codex-detect --no-skills-sh`.

| Output | Kept? | Why |
|---|---|---|
| `CLAUDE.md` | untouched | already existed (init skipped it) |
| `.mcp.json` (`claude-flow` → `npx ruflo@3.80.8 mcp start`, `autoStart:false`) | yes | needed for `Mode: swarm` tasks; pinned |
| `.claude/settings.json` | trimmed | removed statusLine (missing helper), auto-approve of unpinned `npx claude-flow*`, `AGENT_TEAMS` env (would change every session); `adr.autoGenerate` off and dir → `docs/architecture` (ADRs need owner approval); kept `.env` read deny |
| `.claude/skills/*` (6 generic skills, ~128 KB) | removed | not in the recommended set (SETUP §4) |
| `.claude-flow/config.yaml`, `.gitignore`, `CAPABILITIES.md` | yes | runtime config; data/logs/sessions are gitignored |

Funnel (promo/tips surfaces) disabled user-wide with `ruflo funnel disable`; telemetry consent: none.

## `ruflo doctor` (no `--fix`)
24 passed, 12 warnings — all optional (daemon not running, memory DB not initialised, agent-browser/agentic-flow absent, encryption at rest off, Cognitum not logged in).
Notable: **MCP schema overhead ≈ 394 tools / ~78k tokens** — enable the `claude-flow` MCP server only for swarm tasks.

## Plugins (`discover-plugins` is now `ruflo plugins list`)
Registry is unsigned; all 20 built-in entries show `Unverified`. **None installed.**

## MCP (`mcp list` is now `ruflo mcp status|tools`)
One server configured (`claude-flow`, stdio, pinned 3.80.8).

## Project skills
Installed from the pinned fork tag to Claude Code + GitHub Copilot, locked in `skills-lock.json` (commit `3f2a40a…`):
`adr-create, adr-review, migrate-create, migrate-validate, tdd-workflow, test-gaps, security-scan, dependency-check`
(`cost-compact-context` removed 2026-11-27: it only works inside the Ruflo repo's `v3/` tree).
Known gaps (handled by AGENTS.md §9): skills call `npx @claude-flow/cli@latest` → use `npx -y ruflo@3.80.8`; their `mcp__plugin_ruflo-core_*` tool names exist only with the Ruflo Claude Code plugin, so memory-store steps are skipped outside swarm tasks.
Files live in `.agents/skills/` (committed); `.claude/skills/` holds links (gitignored). Fresh clone: `npx skills experimental_install --frozen-lockfile`.

## Audit
`pnpm audit --prod` → no known vulnerabilities. Ruflo is outside the repo's dependency graph; `npx` resolves its tree unlocked, which is accepted for dev tooling only.
