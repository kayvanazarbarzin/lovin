---
applyTo: "apps/api/**,apps/worker/**,services/**,packages/authz/**,packages/events/**,packages/settings/**"
---
# Backend rules

- Stack: Node 22, TypeScript strict, Fastify 5, Zod, Drizzle (queries) + plain SQL migrations, NATS JetStream, Valkey.
- Module layout: `modules/<name>/{index.ts, routes.ts, service.ts, repo.ts, events.ts, schema.ts, *.test.ts}`. Only `index.ts` is imported by others.
- Route = validate (Zod) → `requirePermission` → service → response. No business logic in routes, no SQL in services (use `repo.ts`).
- Repos always apply `scopeFilter(principal, permission)` and `tenant_id`. Out-of-scope reads return 404, not 403 (do not leak existence); both are audited.
- Mutations: one DB transaction = domain change + `evnt.outbox` row + `logs.audit_event` row. Use `Idempotency-Key` for non-idempotent POSTs; optimistic lock with `version`/`If-Match`.
- Consumers: subscribe via `packages/events`, check `evnt.inbox` first, make handlers idempotent, let failures go to `evnt.dead_letter` after retries.
- Errors: RFC 9457 problem+json with a stable `code` (`AUTHZ_DENIED`, `TRANSITION_REJECTED`, `VERSION_CONFLICT`, `UNSUPPORTED_CAPABILITY`, `CONSENT_REQUIRED`). Never return stack traces.
- Long work (AI, render, ingestion, eval) never runs inside an HTTP request: enqueue a job and return 202.
- Every request carries `X-Correlation-ID`; log it; pass it to events and outbound calls.
- Keep OpenAPI (`docs/api/openapi.yaml`) in sync with Zod schemas in the same commit.
