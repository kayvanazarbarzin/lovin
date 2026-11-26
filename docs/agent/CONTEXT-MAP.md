# Context map — what to read for each area

Read only the row for the area you are working in. PRD: open the cited section by search, never the whole file.

| Area | Read | PRD sections |
|---|---|---|
| Monorepo, CI, tooling | `docs/agent/SETUP.md`, ADR-000 | §16.1, §20 |
| Identity / login | ADR-003 §Identity | §14.1 |
| Authorization / RBAC | ADR-003, `docs/security/README.md`, `permission-matrix.csv` (grep the permission) | §14.2–14.4 |
| Audit | migration `logs` section | §1.3 KPI-08 |
| Settings / secrets | migration `conf` section, openapi `/admin/*` | §13 |
| Events / outbox | migration `evnt` section, ADR-000 §3 | §15.3 |
| Persian UI / Jalali | `.github/instructions/frontend.instructions.md` | §16 NFR-001..003 |
| CRM | ADR-001, openapi `/leads`, `/contacts`, `/deals` | §5 |
| Tasks / Kanban / BPM | ADR-002, migration `task` section | §10 |
| Support cases / SLA | migration `care` section | §10.3 BPM-COMPLAINT-01, §17 E2E-02 |
| Channels (Bale/Rubika/Telegram) | ADR-005 §Channel, migration `chnl` + `cust` | §8 |
| CTI (Asterisk/Issabel) | ADR-005 §CTI, migration `call` | §9 |
| Content / Brand (Payload) | `docs/backlog/epics.md` E12 | §7 |
| Marketing | epics E13 | §6 |
| AI / RAG | ADR-004, migration `know` + `aiml` | §11 |
| EVAL | ADR-004 §7, epics E15 | §12 |
| Licensing / reuse of Arkan repos | `docs/compliance/LICENSE-DECISION.md`, `docs/discovery/repo-audit.md` | §2 |
| Acceptance tests | `docs/backlog/epics.md` AT table | §18 |
