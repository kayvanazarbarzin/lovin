# STATE — read me first (keep ≤ 60 lines; rewrite at the end of every session)

**Updated:** 2026-11-27 after T-006
**Phase:** Sprint 0
**Active task:** T-007 (events package)

## Done so far
- Planning docs: PRD analysis, ADR-000..005, OpenAPI draft, permission matrix, migration `0001_platform_core.sql`.
- T-001 repo https://github.com/kayvanazarbarzin/lovin (public, proprietary LICENSE); `main` protected: PR + 1 review, required check `ci-ok`, admins bypass (agent commits directly to main).
- T-002 monorepo: pnpm workspaces (`apps/*`, `services/*`, `packages/*`, `tools/*`), Turborepo, TS 6 strict, ESLint flat (AGENTS size limits enforced), Prettier, Vitest 5, dependency-cruiser boundaries (`pnpm lint:deps`).
- T-003 Ruflo: fork tag `lavin-pin-2026-11-26`; 8 project skills in `.agents/skills` (`skills-lock.json`). Ruflo is NOT a dependency — run `npx -y ruflo@3.80.8` (AGENTS.md §9).
- T-005 compose core (`pnpm stack:up`, `env.example` → `.env`): postgres16+pgvector (DBs lavin/keycloak/flowable/corteza/payload, own roles), valkey, nats JetStream, keycloak 26 — all digest-pinned, 127.0.0.1 ports.
- T-006 `tools/db-migrate` (`pnpm db:migrate`, `pnpm db:test-migrations`): roles lavin_migrator (DDL) / lavin_app (DML, audit INSERT-only via 0002).
- T-004 CI (`.github/workflows/ci.yml`): lint/typecheck/test/test:integration, license gate (`tools/license-gate`, policy `docs/compliance/license-policy.json`), CycloneDX SBOM artifact, pnpm audit, gitleaks, semgrep OWASP; AT-20 evidence in `docs/acceptance-evidence/AT-20.md`.

## Toolchain facts (owner decisions)
- Node 22 (`.nvmrc`; local machine runs Node 24 — fine), pnpm 10.34.9 via `packageManager`.
- `pnpm-workspace.yaml` guards: `minimumReleaseAge` 7 days, `trustPolicy: no-downgrade`, `blockExoticSubdeps`. Use caret ranges that allow ≥7-day-old versions; pnpm picks the newest mature one.
- If a required peer is missing, declare it explicitly (auto-install-peers bypasses the age guard).
- New deps: install without asking only if named in the task's `Do:`; otherwise ask the owner. @types/node@22 pre-approved.
- Testcontainers on Windows: tests pick an explicit free port and disable Ryuk (Docker Desktop 29 ignores HostPort 0).
- Local installs need `CI=true` (non-TTY) when pnpm wants to purge node_modules.

## Next 3 tasks
1. T-007 events package (outbox relay → NATS, inbox dedupe, DLQ).
2. T-008 Keycloak realm as code; T-012 audit writer (both unblocked).
3. T-016 Persian design system (unblocked); PoCs T-020/T-021/T-024 after T-005.

## Open questions for the owner
- None blocking.

## Known risks
- Repo is public: gitleaks runs in CI on every push/PR.
- Ruflo via npx resolves its dependency tree unlocked (dev tooling only, never in product).
- Corteza has no Persian locale (PoC T-020); no watermark-free BPMN designer (PoC T-021); Rubika has no webhook signature.
