# STATE — read me first (keep ≤ 60 lines; rewrite at the end of every session)

**Updated:** 2026-11-26 by planning session
**Phase:** F0 Discovery → starting Sprint 0
**Active task:** none — start with `T-001` in `docs/agent/TASKS.md`

## Done so far
- PRD analysed; repo audit, license decision, ADR-000..005, OpenAPI draft, permission matrix, first migration (`database/migrations/0001_platform_core.sql`, 12 schemas / 43 tables, tested on PostgreSQL 16).
- Owner decisions recorded in `docs/agent/DECISIONS.md`.

## Next 3 tasks
1. T-001 Create the GitHub repo and push this scaffold.
2. T-002 Monorepo skeleton (pnpm + Turborepo + TS strict).
3. T-003 Ruflo pin + skills install.

## Open questions for the owner
- None blocking Sprint 0.

## Known risks
- Corteza has no Persian locale (PoC T-020 decides).
- No BPMN designer off the shelf without watermark (PoC T-021 decides A vs B).
- Rubika has no documented webhook signature.
