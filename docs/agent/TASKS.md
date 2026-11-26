# TASKS — ordered queue for the coding agent

How to use: search for the task ID; read only that block. Take the first `todo` task whose `Depends` are all `done`.
Each task fits one session. `Size`: S ≤ ½ day, M ≤ 2 days (split if bigger). `Mode`: `single` (default) or `swarm` (Ruflo multi-agent).
Fields: `Read` = the only files to open · `Do` = scope · `Done when` = checks you must run · `Evidence` = one-line result summary.
Phases F2–F6 are listed as epics; expanding an epic into tasks is itself a task (`T-1xx EXPAND`), done when its predecessor phase is done.

---
## Phase F0/F1 — Sprint 0 and Foundation

### T-001 · Repository bootstrap
Status: done · Size: S · Mode: single · Depends: —
Read: `AGENTS.md`, `docs/agent/SETUP.md` §1
Do: Create GitHub repo `lavin` (private), push this scaffold as the first commit on `main`, protect `main` (PR + 1 review + CI green), add `.gitignore` (node, next, env, coverage), `.editorconfig`, `LICENSE` (owner to choose; default proprietary notice).
Done when: `git log --oneline` shows the scaffold commit on the remote; branch protection visible in repo settings.
Evidence: repo `kayvanazarbarzin/lovin` (public, owner choice); `git log --oneline origin/main` shows scaffold + T-001 commits; `gh api .../branches/main/protection` → reviews=1, force_push=false, deletions=false, admins bypass. Required CI check deferred to T-004.

### T-002 · Monorepo skeleton
Status: done · Size: M · Mode: single · Depends: T-001
Read: ADR-000 §1, §4 · PRD §20.5 (search "Monorepo")
Do: pnpm workspaces + Turborepo; folders `apps/{web,api,worker}`, `services/{crm-adapter,workflow-facade,channel-gateway,cti-gateway,ai-gateway,eval-service}`, `packages/{authz,contracts,events,i18n,ui,settings,http,observability,test-kit}`; shared `tsconfig.base.json` (strict, noUncheckedIndexedAccess), ESLint flat config + Prettier, Vitest workspace; each package has `index.ts` + one passing smoke test; `dependency-cruiser` rule: no imports of another module's non-index files.
Done when: `pnpm install && pnpm lint && pnpm typecheck && pnpm test` green; a deliberate cross-module internal import fails `pnpm lint:deps`.
Evidence: 2026-11-26 — install OK (pnpm 9.15.9); `pnpm lint` ✔ (eslint + depcruise: 0 violations, 36 modules); `pnpm typecheck` 18/18; `pnpm test` 18/18. Deliberate `modules/beta → modules/alpha/internal.ts` and `packages/http → packages/authz/src/deep.ts` → `lint:deps` exit 2 with `no-api-module-internals` + `no-workspace-package-internals`; import via `alpha/index` allowed.

### T-003 · Ruflo pin and skills
Status: done · Size: S · Mode: single · Depends: T-002
Read: `docs/agent/SETUP.md` §2–4, PRD §20.1–20.2
Do: verify global `ruflo` skill; add `ruflo@3.80.8` as exact dev dependency; run `ruflo init`, review and commit only needed files; run `doctor`, `discover-plugins`, `mcp list` and save output summary to `docs/dev/ruflo-setup.md`; install the recommended project skills; commit `skills-lock.json`; record fork tag/SHA in DECISIONS.md.
Done when: `npx skills list` shows exactly the recommended set; `pnpm exec ruflo --version` = 3.80.8; `pnpm audit --prod` unaffected (Ruflo is dev-only).
Evidence: 2026-11-26 — `npx skills list` = exactly the 9 recommended skills (source kayvanazarbarzin/ruflo@lavin-pin-2026-11-26); `pnpm exec ruflo --version` → v3.80.8; `pnpm audit --prod` → no known vulnerabilities; doctor 24 pass / 12 optional warnings. Details: `docs/dev/ruflo-setup.md`.
Amended 2026-11-27 (owner, during T-004): Ruflo removed from devDependencies (its tree fails pnpm trust/age guards); run as `npx -y ruflo@3.80.8` → `ruflo v3.80.8`; `cost-compact-context` removed (works only inside the Ruflo repo) → 8 skills in `skills-lock.json`.

### T-004 · CI pipeline
Status: done · Size: M · Mode: single · Depends: T-002
Read: AGENTS.md §7–8, LICENSE-DECISION §4
Do: GitHub Actions: lint, typecheck, unit tests, integration tests (Testcontainers), Gitleaks, Semgrep (OWASP rules), `pnpm audit --audit-level=high`, CycloneDX SBOM artifact, license allowlist gate (fail on unknown/AGPL/SSPL/BUSL); PR template with fields from PRD §20.4; add the CI job as a required status check on `main` protection.
Done when: CI green on main; a test PR adding a GPL-3 or unknown-license package fails the license job (AT-20); SBOM artifact downloadable.
Evidence: 2026-11-27 — CI green on main @5cb6dce (6/6 jobs: lint·typecheck·test, license gate·SBOM, dependency audit, gitleaks 0 leaks, semgrep OWASP 0 findings, ci-ok); PR #1 adding `chessground` (GPL-3.0-or-later) → license gate ✖, ci-ok ✖, merge BLOCKED (docs/acceptance-evidence/AT-20.md); artifact `sbom-cyclonedx` (CycloneDX 1.6) on main run; `ci-ok` required on `main`.

### T-005 · Docker Compose core profile
Status: done · Size: M · Mode: single · Depends: T-002
Read: ADR-000 §3–4, `docs/agent/SETUP.md` §5
Do: `infra/compose/docker-compose.yml` with profiles; core = postgres16+pgvector (one instance; init script creates DBs `lavin, keycloak, flowable, corteza, payload` with separate owner roles), valkey, nats (JetStream), keycloak; networks `edge, app, data`; healthchecks; images pinned by digest; `.env.example` without real values.
Done when: `docker compose --profile core up -d` healthy in < 10 min on a clean machine; `psql -l` shows the 5 databases with distinct owners; no image uses `latest`.
Evidence: 2026-11-27 — images removed + volumes wiped, `up -d --wait`: all 4 healthy in 314 s incl. pulls (containers ~57 s); `psql -l`: lavin/lavin_migrator, keycloak/keycloak, flowable/flowable, corteza/corteza, payload/payload (all NOSUPERUSER/NOCREATEDB/NOCREATEROLE, CONNECT revoked from PUBLIC — keycloak→lavin denied); pgcrypto 1.3 + vector 0.8.7 in `lavin`; 0 images with `latest` (all tag@sha256); valkey NOAUTH / nats Authorization Violation without creds; ports bound to 127.0.0.1 only.

### T-006 · Database migration runner
Status: done · Size: S · Mode: single · Depends: T-005
Read: `.github/instructions/database.instructions.md`, `database/migrations/0001_platform_core.sql` (header only)
Do: plain-SQL migration runner (e.g. `postgres-shift` or a 60-line script) with a `schema_migrations` table in `conf`; scripts `db:migrate`, `db:test-migrations` (fresh DB in Testcontainers); app roles: `lavin_app` (DML, INSERT-only on `logs.audit_event`), `lavin_migrator` (DDL).
Done when: `pnpm db:test-migrations` applies 0001 on an empty DB; `lavin_app` cannot UPDATE/DELETE `logs.audit_event` or run DDL (tested).
Evidence: 2026-11-27 — `pnpm db:test-migrations` (Testcontainers, pgvector 0.8.7-pg16 digest): 9/9 pass — 0001+0002 applied on empty DB, re-run no-op, edited migration rejected (checksum), lavin_app INSERT/SELECT audit ok; UPDATE/DELETE/TRUNCATE audit, CREATE/ALTER table, read conf.schema_migrations → 42501. Real stack: `db:migrate` applied 0001, 0002 (44 tables), second run "up to date"; psql as lavin_app DELETE audit → permission denied.

### T-007 · Events package (outbox/inbox)
Status: todo · Size: M · Mode: single · Depends: T-006
Read: ADR-000 §3, PRD §15.3 (search "رویداد استاندارد"), migration `evnt` section
Do: `packages/events`: envelope Zod schema, `writeOutbox(tx, event)`, relay worker (poll + LISTEN/NOTIFY) → NATS JetStream with retries + jitter, `consume(consumerName, handler)` with `evnt.inbox` dedupe and dead-letter after N attempts, replay CLI.
Done when: integration tests: duplicate delivery processed once; kill relay mid-batch → no loss, no duplicate side effect (AT-13 core); DLQ row after poison message.
Evidence:

### T-008 · Keycloak realm as code
Status: todo · Size: M · Mode: single · Depends: T-005
Read: ADR-003 §Identity
Do: realm `lavin` via `keycloak-config-cli`; clients `lavin-web` (confidential, PKCE), `lavin-api`, service accounts; user attribute `tenant_id` mapped to token claim; required OTP for admin roles; break-glass local user; LDAP federation config (READ_ONLY, LDAPS) with Samba AD container in a `test-ad` profile; Persian login theme (minimal RTL CSS).
Done when: login with AD test user and with local user both issue tokens containing `tenant_id`; admin without OTP cannot log in; AT-02 scenario scripted (AD container stopped → break-glass works, event logged).
Evidence:

### T-009 · BFF session in web app
Status: todo · Size: M · Mode: single · Depends: T-008, T-002
Read: ADR-003 items 5–7, frontend instructions
Do: Next.js auth routes (login/callback/logout), server session in Valkey, `__Host-` cookie, refresh rotation, back-channel logout endpoint, CSRF protection for mutations, BFF API client that forwards the access token server-side.
Done when: Playwright: login → protected page → logout; token never present in browser JS (`document.cookie`/storage check); back-channel logout kills session within 60 s.
Evidence:

### T-010 · API skeleton + JWT validation
Status: todo · Size: S · Mode: single · Depends: T-002, T-008
Read: backend instructions
Do: Fastify app with Zod type provider, JWT validation (iss/aud/exp, JWKS cache), correlation-id hook, problem+json error handler, health/readiness endpoints, OpenAPI served from Zod and diffed against `docs/api/openapi.yaml` in CI.
Done when: request without token → 401 problem+json with `correlation_id`; `/health/ready` checks DB+NATS; OpenAPI diff job runs.
Evidence:

### T-011 · Authz engine
Status: todo · Size: M · Mode: single · Depends: T-006, T-010
Read: ADR-003 §Authorization, `docs/security/README.md`, migration `auth` section
Do: `packages/authz`: load bindings (user + group + service), resolve effective permissions with scope, explicit deny wins; `requirePermission`, `scopeFilter` → SQL fragment, `fieldPolicy` serializer; Valkey cache 30 s + `authz.changed` invalidation; seed from `permission-matrix.csv`.
Done when: unit tests cover every scope type and deny; seed loads 131 permissions × 16 roles; property test: every route in OpenAPI has `x-permission` and a guard.
Evidence:

### T-012 · Audit writer
Status: todo · Size: S · Mode: single · Depends: T-006
Read: migration `logs` section, ADR-003 item 9
Do: `writeAudit(tx, entry)` with SHA-256 hash chain per tenant, redaction of sensitive fields, daily chain verification job, `GET /audit/events` with filters.
Done when: tampering a row in a test DB is detected by the verifier; denied requests produce `outcome=denied` rows; KPI-08 fields present.
Evidence:

### T-013 · Org & user sync
Status: todo · Size: S · Mode: single · Depends: T-011
Read: migration `orgs` section, ADR-003 §AD mapping
Do: upsert `orgs.user_profile` on login; AD group → role binding via `auth.group_role_mapping`; `/me` endpoint returning effective permissions.
Done when: AT-17: change a user's AD group, run sync → new scope effective in API within 60 s (test).
Evidence:

### T-014 · RBAC acceptance tests
Status: todo · Size: S · Mode: single · Depends: T-011, T-012
Read: PRD §18 AT-01, AT-08
Do: test-kit helpers to mint users with roles/teams; AT-01 (team A agent reading team B lead → 404 + audit, no leak) on a sample endpoint; AT-08 (marketing manager calling secret rotation API → 403 even if UI bug).
Done when: both tests pass in CI; evidence files `docs/acceptance-evidence/AT-01.md`, `AT-08.md`.
Evidence:

### T-015 · Settings & secrets
Status: todo · Size: M · Mode: single · Depends: T-011, T-012
Read: PRD §13 (search "Configuration Control Plane"), migration `conf` section, openapi `/admin/*`
Do: `packages/settings`: definitions registry, versioned values (draft → testing → pending_approval → active → rollback), test-action hook, dual approval for `critical`; secret store with AES-256-GCM envelope encryption (KEK from file mounted read-only), write-only API returning fingerprint; log redactor.
Done when: AT-14 at settings level (failed test keeps previous active version + audit); no API returns a secret value (test greps responses and logs).
Evidence:

### T-016 · Persian design system
Status: todo · Size: M · Mode: single · Depends: T-002
Read: frontend instructions, PRD §16 NFR-001..005
Do: `packages/ui` tokens + Vazirmatn (self-hosted), RTL primitives (Button, Input, Select, Dialog, Table, Tabs, Toast), `packages/i18n` (fa/en bundles, Persian normalizer, number/date formatters), `JalaliDatePicker` and calendar (day/week/month).
Done when: AT-11 Playwright test (Persian text + digits + English link render in correct order in table, card, calendar); axe shows no serious violations; Jalali⇄UTC round-trip unit tests incl. Tehran timezone edges.
Evidence:

### T-017 · App shell & admin settings UI
Status: todo · Size: M · Mode: single · Depends: T-009, T-015, T-016
Read: frontend instructions, openapi `/me`, `/admin/settings*`
Do: layout with permission-aware navigation, global search placeholder hidden until implemented (no fake UI), admin settings pages generated from definitions (validate, test, approve, rollback, history).
Done when: AT-02/E2E-05 partial: admin changes a setting with test-connection and sees history; sales agent cannot see or call admin APIs.
Evidence:

### T-018 · Observability baseline
Status: todo · Size: S · Mode: single · Depends: T-010
Read: ADR-000 §4
Do: OpenTelemetry SDK in api/worker/web (traces + metrics), structured JSON logs with correlation id and redaction, `obs` compose profile (collector + Prometheus + Tempo/Loki or license-approved alternative).
Done when: one request is traceable from web → api → DB → outbox → consumer by correlation id.
Evidence:

## Sprint 0 PoCs (can run in parallel after T-005)

### T-020 · PoC Corteza CRM gate
Status: todo · Size: M · Mode: single · Depends: T-005
Read: ADR-001 (whole, it is short)
Do: `crm` compose profile; namespace `lavin_crm` with Lead/Account/Contact/Deal; minimal `crm-adapter` CRUD + search; custom field added in Corteza appears in adapter output; webhook → outbox; load 100k synthetic records.
Done when: report `docs/poc/corteza.md` with the 5 ADR-001 criteria measured and a go/no-go; update ADR-001 status.
Evidence:

### T-021 · PoC BPMN designer + Flowable
Status: todo · Size: M · Mode: swarm · Depends: T-005
Read: ADR-002
Do: Flowable 7 in `bpm` profile with event listener → outbox; option A: React Flow + bpmn-moddle mini designer (start, user task, exclusive gateway, timer boundary, end) exporting BPMN XML with DI; option B: Apache KIE standalone BPMN editor; deploy both outputs to Flowable.
Done when: `docs/poc/bpmn-designer.md` compares A vs B (Flowable compatibility, RTL, bundle size, license) with a recommendation; a designed process deploys and creates a user task.
Evidence:

### T-022 · PoC Bale bot webhook
Status: todo · Size: S · Mode: single · Depends: T-007
Read: ADR-005 §Channel items 1–4
Do: minimal Bale connector: setWebhook with secret token, receive, dedupe, send text, real capability test.
Done when: AT-03 test (two identical webhooks in parallel → one message, one event); `docs/poc/bale.md` lists verified capabilities.
Evidence:

### T-023 · PoC Asterisk AMI
Status: todo · Size: S · Mode: single · Depends: T-007
Read: ADR-005 §CTI
Do: `cti` profile with two Asterisk 20 containers + SIPp scenarios; AMI client with reconnect; normalize call by `(pbx_connection_id, linkedid)`.
Done when: AT-05 (simultaneous calls on two PBXs, no collision) and a network-drop test with no duplicates; `docs/poc/asterisk.md`.
Evidence:

### T-024 · PoC local Persian LLM benchmark
Status: todo · Size: S · Mode: single · Depends: T-005
Read: ADR-004 §2
Do: `ai` profile with Ollama (CPU); benchmark 3 candidate chat models + `bge-m3` embeddings on 50 synthetic Persian questions; record latency (CPU and, if available, GPU), quality notes, license.
Done when: `docs/poc/llm.md` with a recommended default model for CPU and for GPU.
Evidence:

### T-025 · Vertical slice E2E-02 (call → ticket → BPM → kanban)
Status: todo · Size: M · Mode: swarm · Depends: T-011, T-012, T-021, T-023
Read: PRD §17 E2E-02, ADR-002, ADR-005 §CTI
Do: inbound test call → screen-pop event → "create ticket" → `care.ticket` + outbox → Flowable BPM-COMPLAINT-01 (severity rule, SLA timer) → task appears on support board via SSE → escalation notification → audit trail.
Done when: AT-06 and AT-07 pass; slice demo recorded in `docs/acceptance-evidence/E2E-02.md`; Sprint 0 report written (`docs/sprints/sprint-0.md`: done / evidence / risks / deviations / next).
Evidence:

---
## Phase F2–F6 — epics (expand each into T-tasks when its phase starts)

### T-100 · EXPAND F2: CRM (E07), BPM & Kanban (E08), Support (E09), Meetings basic (E17)
Status: todo · Size: S · Mode: single · Depends: T-025
Read: `docs/backlog/epics.md` E07–E09, E17; PoC reports
Do: write T-1xx tasks in this file using the same format (≤ M each), ordered by dependency.
Done when: every feature F of those epics maps to ≥ 1 task with a runnable `Done when`.

### T-200 · EXPAND F3: Channels & Inbox (E10), CTI (E11)
Status: todo · Depends: F2 done · same format as T-100.

### T-300 · EXPAND F4: Content & Brand (E12), Marketing (E13), AI/RAG (E14), Analytics (E16)
Status: todo · Depends: F3 done · same format.

### T-400 · EXPAND F5: EVAL (E15), Hardening/Backup/Load/Release (E18)
Status: todo · Depends: F4 done · same format. Must cover AT-09, 10, 12, 15, 16, 19.

### T-500 · EXPAND F6: P1/P2 expansion (E19)
Status: todo · Depends: F5 done and owner approval.
