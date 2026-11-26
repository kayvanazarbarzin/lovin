-- 0002 — least-privilege grants for the application role (T-006, AGENTS.md §5).
-- lavin_app: DML only, no DDL; INSERT/SELECT only on the append-only audit log.
-- The role itself is created at bootstrap by a superuser (infra/compose/postgres/init).

GRANT USAGE ON SCHEMA orgs, auth, conf, evnt, logs, cust, task, chnl, call, care, know, aiml TO lavin_app;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA orgs, auth, conf, evnt, cust, task, chnl, call, care, know, aiml TO lavin_app;
GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA orgs, auth, conf, evnt, logs, cust, task, chnl, call, care, know, aiml TO lavin_app;

-- Migration bookkeeping is the migrator's business only.
REVOKE ALL ON conf.schema_migrations FROM lavin_app;

-- Audit log: append-only for the app (the trigger also blocks UPDATE/DELETE for everyone).
GRANT SELECT, INSERT ON logs.audit_event TO lavin_app;

-- Tables created by later migrations get the same DML grants automatically (logs excluded on purpose).
ALTER DEFAULT PRIVILEGES FOR ROLE lavin_migrator
  IN SCHEMA orgs, auth, conf, evnt, cust, task, chnl, call, care, know, aiml
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lavin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE lavin_migrator
  IN SCHEMA orgs, auth, conf, evnt, logs, cust, task, chnl, call, care, know, aiml
  GRANT USAGE, SELECT ON SEQUENCES TO lavin_app;
