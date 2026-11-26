---
applyTo: "database/**,**/repo.ts,**/*.sql"
---
# Database rules

- PostgreSQL 16 + pgvector. Schemas (exactly 4 letters each): `orgs auth conf evnt logs cust task chnl call care know aiml`; reserved `sale mktg meet eval`. A new schema needs an ADR and owner approval.
- One PostgreSQL instance, separate databases: `lavin` (ours), `keycloak`, `flowable`, `corteza`, `payload`, each with its own owner role. Never query an engine database from app code.
- Naming: singular snake_case tables, `id uuid` PK, `tenant_id uuid not null`, `created_at timestamptz default now()`, FK columns `<entity>_id`, check constraints for enums-as-text, named partial unique indexes for dedupe.
- Migrations: `database/migrations/NNNN_<verb>_<what>.sql`, forward-only, wrapped in a transaction, idempotent where cheap (`IF NOT EXISTS`). Never edit a merged migration; add a new one.
- Destructive change (drop/rename/type narrowing) = expand → migrate data → contract, in separate migrations, with owner approval.
- Each new table needs: tenant index, the indexes its repo queries use, and an RLS policy if it holds customer data (`care`, `call`, `chnl`, `cust`).
- One role per service with least privilege. App role: no DDL; INSERT-only on `logs.audit_event`.
- Reports and aggregates in SQL (views/materialized views), never by loading rows into Node.
- Test each migration on an empty DB in CI (`pnpm db:test-migrations`).
