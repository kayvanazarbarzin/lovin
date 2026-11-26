# STATE — read me first (keep ≤ 60 lines; rewrite at the end of every session)

**Updated:** 2026-11-26 after T-001
**Phase:** Sprint 0
**Active task:** none — next is `T-002` in `docs/agent/TASKS.md`

## Done so far
- PRD analysed; repo audit, license decision, ADR-000..005, OpenAPI draft, permission matrix, first migration (`database/migrations/0001_platform_core.sql`, 12 schemas / 43 tables, tested on PostgreSQL 16).
- Owner decisions recorded in `docs/agent/DECISIONS.md`.
- T-001 done: repo https://github.com/kayvanazarbarzin/lovin (public), `.gitignore`, `.editorconfig`, proprietary `LICENSE`, `main` protected (PR + 1 review, admins bypass, no force-push).
- Ruflo skill installed globally (`~/.agents/skills/ruflo`, linked into `~/.claude/skills`).

## Next 3 tasks
1. T-002 Monorepo skeleton (pnpm + Turborepo + TS strict) — size M, use plan mode.
2. T-003 Ruflo pin + skills install (global skill already present).
3. T-004 CI pipeline — also make the CI job a required check on `main`.

## Open questions for the owner
- None blocking Sprint 0.

## Known risks
- Repo is public: any committed secret is exposed at once. Gitleaks arrives in T-004; until then keep `.env*` out (already gitignored).
- Corteza has no Persian locale (PoC T-020 decides).
- No BPMN designer off the shelf without watermark (PoC T-021 decides A vs B).
- Rubika has no documented webhook signature.
