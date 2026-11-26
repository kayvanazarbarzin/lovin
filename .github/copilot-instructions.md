# Lavin — Copilot instructions

The canonical rules are in `/AGENTS.md`. Follow them exactly. The essentials:

1. Start: read `docs/agent/STATE.md`, then only the active task block in `docs/agent/TASKS.md`, then only the files on its `Read:` line. Never read `docs/PRD.md` whole.
2. End: update task `Status`/`Evidence` in TASKS.md, rewrite STATE.md (≤ 60 lines), append decisions to DECISIONS.md, commit `<TASK-ID>: <what>`.
3. Simplest code that passes the task's checks. Function ≤ 40 lines, file ≤ 300 lines. Abstraction only at the third use. No new dependency without approval.
4. Server-side authz on everything (`packages/authz`), outbox event in the same transaction, no cross-module imports, no secrets anywhere in code/logs.
5. DB schema names are exactly 4 letters (`orgs auth conf evnt logs cust task chnl call care know aiml`). Every business table has `tenant_id`.
6. UI text is Persian via i18n keys, RTL-first, Jalali dates in UI only; code and identifiers in English.
7. Ask before: new dependency, new service, API/event schema change, RBAC change, destructive migration.
