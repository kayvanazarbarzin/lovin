# Decision log (append-only, one line each)

Format: `date | task | decision | why`. Big decisions also get an ADR.

2026-11-26 | PLAN | Product name: Lavin (لاوین) | owner
2026-11-26 | PLAN | Modular monolith (TS) + engines behind adapters | ADR-000
2026-11-26 | PLAN | Corteza is CRM system of record behind `crm-adapter`, gated by Sprint-0 PoC; fallback native CRM (ADR-001b) if ≥2 criteria fail | owner chose, ADR-001
2026-11-26 | PLAN | Flowable OSS 7 engine; no bpmn-js (owner rejected bpmn.io watermark); own designer with React Flow + bpmn-moddle, Apache KIE editor as PoC alternative | ADR-002
2026-11-26 | PLAN | Keycloak for authentication; RBAC + scope enforced in app (`packages/authz`) | ADR-003
2026-11-26 | PLAN | One org now, multi-tenant ready: `tenant_id` everywhere, tenant claim, RLS | owner
2026-11-26 | PLAN | DB schemas: exactly 4-letter names, one per domain: orgs auth conf evnt logs cust task chnl call care know aiml (reserved sale mktg meet eval) | owner
2026-11-26 | PLAN | One PostgreSQL instance; separate databases lavin/keycloak/flowable/corteza/payload with separate roles | owner
2026-11-26 | PLAN | AI CPU-first (Ollama), optional GPU profile (vLLM); external LLMs disabled by default | owner: ≤50 users, GPU maybe; ADR-004
2026-11-26 | PLAN | Arkan repos: owner has permission to reuse code; Arkan company data/prompts/brand still excluded; red flags never copied | owner, LICENSE-DECISION
2026-11-26 | PLAN | Ruflo: sync fork with upstream, pin 3.80.8; skill installed globally; swarm only for `Mode: swarm` tasks | owner, SETUP.md
2026-11-26 | PLAN | Agent docs in English to save tokens; all UI text Persian via i18n | token economy
2026-11-26 | T-001 | GitHub repo is `kayvanazarbarzin/lovin` (not `lavin`), public so free-plan branch protection works; LICENSE stays proprietary | owner
2026-11-26 | T-001 | `main` protection: PR + 1 approving review, no force-push/delete, admins may bypass (solo owner + agent commit protocol); required CI check added in T-004 | no CI jobs exist yet
2026-11-26 | T-002 | Toolchain per SETUP.md: Node >=22 (`.nvmrc` 22), pnpm pinned via `packageManager: pnpm@9.15.9` | owner rejected Node 24/pnpm 12
2026-11-26 | T-002 | Dev deps: turbo, typescript ~6.0 (TS 7 unsupported by typescript-eslint), eslint + @eslint/js + typescript-eslint + eslint-config-prettier, prettier, vitest, dependency-cruiser — all MIT/Apache-2.0 | named in T-002
2026-11-26 | T-002 | Workspace packages export TS source (`exports: ./src/index.ts`, moduleResolution Bundler, no build step yet); AGENTS.md size limits enforced by ESLint | KISS
2026-11-26 | T-003 | Ruflo fork synced and tagged `lavin-pin-2026-11-26` = 3f2a40a2f06db9138f97ad8d582329189395e8ab; CLI `ruflo@3.80.8` exact dev dep (MIT); project skills installed from that tag only | SETUP.md §2-4
2026-11-26 | T-003 | `ruflo init --minimal`, trimmed: no auto-approve, no AGENT_TEAMS env, no generic skills, ADR auto-generate off; no Ruflo plugins (registry unsigned); funnel promos disabled | least privilege, token economy
2026-11-27 | T-004 | pnpm 9 → 10.34.9 for supply-chain guards: minimumReleaseAge 7 days, trustPolicy no-downgrade, blockExoticSubdeps; build scripts blocked by default | owner; Semgrep OWASP A08 findings
2026-11-27 | T-004 | Ruflo removed from devDependencies; run only as `npx -y ruflo@3.80.8`; project skills usable in any task, swarms/MCP only for `Mode: swarm` | owner; its tree failed trust/age guards (agentdb@3.10.1, @ruvector/core@0.1.39 lost provenance)
2026-11-27 | T-004 | License gate: prod = strict allowlist; dev = allowlist + reviewed exceptions (currently none); allowlist += BlueOak-1.0.0, CC0-1.0, Unlicense, CC-BY-4.0 | owner
2026-11-27 | T-004 | trustPolicyExclude `undici-types@6.21.0` (2024 Node core release, pre-provenance line; needed by @types/node@22) | reviewed false positive
2026-11-27 | T-004 | `vite` declared explicitly (required peer of vitest 5): pnpm auto-install-peers pins the newest version and bypasses minimumReleaseAge | pnpm behaviour
2026-11-27 | T-004 | CI tools: actions pinned by SHA, gitleaks/semgrep Docker images by digest, SBOM via `npx @cyclonedx/cdxgen@12.9.3` in CI only; `ci-ok` aggregate job is the required check | owner chose cdxgen
2026-11-27 | T-004 | @types/node@22 approved as a root dev dependency for all Node packages | owner
2026-11-27 | T-005 | Compose core: pgvector 0.8.7-pg16, valkey 8.1.12, nats 2.10.29 (JetStream, user/pass), keycloak 26.8.2 (`start-dev` locally; `start`+TLS in hardening), all tag@digest, ≥7 days old | ADR-000 §4
2026-11-27 | T-005 | `lavin` DB owner = `lavin_migrator` (DDL); `lavin_app` comes in T-006. Superuser creates pgcrypto/vector at init. `data` network not `internal` so dev tools reach Postgres via 127.0.0.1 | KISS
2026-11-27 | T-005 | Env template is `env.example` (no leading dot) so the agent read-deny on `.env*` stays strict | security
2026-11-27 | T-006 | Own ~60-line runner (`tools/db-migrate`) on `pg` (MIT): advisory lock, sha256 checksum per file (edited applied migration = error), one transaction per file incl. bookkeeping in `conf.schema_migrations`; file-level BEGIN/COMMIT stripped | owner chose pg; KISS
2026-11-27 | T-006 | Roles: `lavin_migrator` owns DB (DDL), `lavin_app` created at bootstrap by superuser; grants in migration 0002 (DML; audit SELECT+INSERT only; default privileges for future tables) | AGENTS.md §5
2026-11-27 | T-006 | Integration tests pick an explicit free host port and disable Ryuk on Windows only: Docker Desktop 29 does not bind `HostPort: "0"` | env quirk
2026-11-27 | T-007 | Events: NATS client @nats-io/transport-node + @nats-io/jetstream 3.x (Apache-2.0), Zod 4; one stream `LAVIN_EVENTS` (`lavin.events.<type>`), 10-min duplicate window, msgID = `<event_id>:<attempts>` so crash re-sends dedupe but explicit replays do not | task-named
2026-11-27 | T-007 | Relay batch = one transaction with `FOR UPDATE SKIP LOCKED` + `idle_in_transaction_session_timeout 30s` (dead relay frees locks); consumer = inbox row + handler in one transaction, then ack; DLQ after maxAttempts (default 5) with exponential full-jitter nak delays | PRD §15.3
