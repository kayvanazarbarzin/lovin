---
applyTo: "**/*.test.ts,**/*.test.tsx,tests/**"
---
# Test rules

- Vitest for unit/integration, Testcontainers for Postgres/NATS/Valkey/Keycloak, Playwright for E2E, k6 for load.
- Test behaviour through public interfaces (routes, module `index.ts`), not private functions.
- Every endpoint: one allowed case, one denied case, one cross-team/cross-tenant case (must return 404 and leak nothing).
- Every event consumer: duplicate delivery test (processed once) and crash-before-ack test.
- Acceptance tests are named after PRD IDs: `AT-06 drag to unapproved column is rejected`. Store evidence summaries in `docs/acceptance-evidence/AT-XX.md`.
- Fixtures are synthetic. No real customer data, no Arkan company data, no secrets.
- Fast by default: unit tests < 100 ms each; mark slow suites `@integration`. Do not use sleeps; await conditions.
- Fix the code, not the test. Never skip, disable or loosen a test to make CI green.
