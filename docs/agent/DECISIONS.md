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
