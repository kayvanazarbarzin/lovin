# AGENTS.md — Lavin (لاوین)

Self-hosted, Persian-first (fa-IR, RTL, Jalali) platform for CRM, sales, marketing, content, kanban/BPMN, call-center and AI.
You are the coding agent. These rules override your defaults. Keep this file short; details live in the files linked below.

## 1. Session protocol (prevents memory loss — mandatory)

**Start of every session**, read ONLY these, in order:
1. `docs/agent/STATE.md` — where we are, the active task, blockers. (~1 page)
2. The active task's block in `docs/agent/TASKS.md` (search by task ID; do not read the whole file).
3. The files listed in that task's `Read:` line, plus `docs/agent/CONTEXT-MAP.md` only if a file is missing.

**Never** read `docs/PRD.md` whole. Open only the section a task cites (e.g. `PRD §14.2`), using search.

**End of every session or task** (even if unfinished):
1. Update the task's `Status:` in `docs/agent/TASKS.md` (`todo | doing | blocked | review | done`).
2. Rewrite `docs/agent/STATE.md` (keep it ≤ 60 lines): active task, what changed, what is next, open questions.
3. If you made a design choice, append one line to `docs/agent/DECISIONS.md`.
4. Commit with message `<TASK-ID>: <what>`.

If your context is getting long: finish the current step, do the End protocol, and continue in a fresh session.

## 2. Working rules

- One task at a time. Do not start a task whose `Depends:` are not `done`.
- A task is done only when its `Done when:` checks pass by running them. Paste the command output summary into the task's `Evidence:` line. No mocks, placeholders or TODOs for P0 behaviour.
- Plan in ≤ 5 bullet points before editing. Touch only files the task needs.
- If a requirement is unclear or conflicts with an ADR: stop, set `Status: blocked`, write the question in STATE.md. Do not guess on security, licensing, money or data deletion.
- Ask before: adding a dependency, adding a service/container, changing a public API/event schema, changing RBAC/permissions, or any migration that drops/renames data.

## 3. Simplicity rules (KISS / YAGNI)

- Write the simplest code that passes the task's checks. No speculative abstraction, no "for later" options.
- Extract a helper/abstraction only at the **third** real use.
- Limits: function ≤ 40 lines, file ≤ 300 lines, nesting ≤ 3, parameters ≤ 4 (use an object). Split when exceeded.
- Prefer the platform and existing packages over new code; prefer plain functions over classes; no DI frameworks, no decorators magic, no generic repositories.
- Names are full English words; domain terms match `docs/agent/GLOSSARY.md`.
- Delete dead code; do not comment it out. Comments explain *why*, not *what*.
- No new dependency without: license in allowlist (`docs/compliance/LICENSE-DECISION.md` §4), active maintenance, and a one-line reason in DECISIONS.md.

## 4. Architecture guardrails (do not violate)

- Modular monolith: `apps/api/src/modules/<module>/` exposes only `index.ts`; never import another module's internals. Engines (Corteza, Flowable, Payload, Keycloak, Jitsi, PBX, channels, LLM) are reached **only** through their adapter in `services/` or `packages/`.
- Authorization is server-side only, default deny, via `packages/authz` (`requirePermission` + `scopeFilter`). Every endpoint, SSE stream, file URL, job and AI tool is checked. UI hiding is not security.
- Every state change that others care about writes an event to `evnt.outbox` **in the same transaction**. Consumers dedupe with `evnt.inbox`. No cross-module DB writes.
- Kanban drag-and-drop only calls `POST /tasks/{id}/transition`; never update a status column directly.
- Time is stored as UTC `timestamptz`; Jalali only in UI/input/export via `packages/i18n`.
- Secrets: never in code, logs, tests, fixtures, prompts or the browser. Use `conf.secret_ref`. Admin UI is write-only for secrets.
- External cloud services (LLM APIs, SaaS) are optional connectors, disabled by default. Core features must work offline.

## 5. Database rules

- Every schema name is **exactly 4 letters** and names one domain: `orgs auth conf evnt logs cust task chnl call care know aiml` (reserved: `sale mktg meet eval`). New schema → ADR + owner approval.
- Table names: singular snake_case, no schema prefix repeated (`task.board`, not `task.task_board`).
- Every business table has `tenant_id uuid not null` (single org now, multi-tenant ready) and `version` when it is edited concurrently.
- Migrations: plain SQL in `database/migrations/NNNN_<what>.sql`, forward-only, tested on a fresh DB in CI. Never edit a merged migration.
- `logs.audit_event` is append-only; the app role has INSERT only.

## 6. Language & UI

- Code, identifiers, commits and agent docs: English (fewer tokens, better tooling).
- All user-facing text: Persian via i18n keys (`packages/i18n/fa.json`), never hard-coded. RTL-first layout (logical CSS properties: `ms-`, `me-`, `start`, `end`).
- Normalize Persian input (ی/ک, ZWNJ, Persian/Arabic digits) at the boundary.

## 7. Quality gates (run before marking done)

```bash
pnpm lint && pnpm typecheck && pnpm test --filter <changed-package>
pnpm test:integration --filter <changed-package>   # when DB/engine touched
pnpm audit:licenses && pnpm audit:security        # when deps changed
```
Run only what the change affects; run the full suite only at the end of an epic. Re-run only failing tests while fixing.

## 8. Security checklist (every PR)

Input validated with Zod at the edge · authz + scope test for each new endpoint (one allow, one deny, one cross-team) · no secrets/PII in logs · SSRF guard on outbound URLs · uploads size/type-checked · SQL only parameterized · webhook secret checked before parsing body · rate limit on public routes.

## 9. Token economy

- Read the smallest thing that answers the question: search (`rg`) before opening; open line ranges, not whole files.
- Do not re-read files you just edited. Do not paste large files or logs into chat; summarize.
- Do not regenerate unchanged files. Prefer small diffs.
- Use Ruflo multi-agent orchestration (swarms, `claude-flow` MCP server) only for tasks marked `Mode: swarm`. Everything else is single-agent.
- Ruflo project skills (`adr-review`, `test-gaps`, `security-scan`, `migrate-*`, `tdd-workflow`, `dependency-check`) may be used in any task where they fit.
- Ruflo is **not** a repo dependency. Run it only as `npx -y ruflo@3.80.8 <command>`; where a skill says `npx @claude-flow/cli@latest`, use that pinned command instead. Skip skill steps that call `mcp__plugin_ruflo-core_*` tools unless the MCP server is enabled for a swarm task.

## 10. Map

| Need | File |
|---|---|
| Current status / next task | `docs/agent/STATE.md` |
| Task queue with acceptance checks | `docs/agent/TASKS.md` |
| Decision log | `docs/agent/DECISIONS.md` |
| Which docs to read for which area | `docs/agent/CONTEXT-MAP.md` |
| Terms | `docs/agent/GLOSSARY.md` |
| Tooling & skills setup | `docs/agent/SETUP.md` |
| Architecture decisions | `docs/architecture/ADR-*.md` |
| API contract | `docs/api/openapi.yaml` |
| Permissions | `docs/security/permission-matrix.csv` |
| Requirements (search only) | `docs/PRD.md` |

Path-specific rules: `.github/instructions/*.instructions.md` (backend, frontend, database, tests, security, integrations).
