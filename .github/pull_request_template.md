<!-- PRD §20.4: every field is required. Write "n/a" with a reason when a field does not apply. -->

## Summary
<!-- What changed and why, in 1–3 lines. Task ID: T-XXX -->

| Field | Value |
|---|---|
| requirement_ids | <!-- e.g. FR-CRM-01, AT-06 --> |
| source_refs | <!-- PRD §, ADR, issue links --> |
| ADR_if_any | <!-- ADR-00X or n/a --> |
| test_results | <!-- commands run + summary (unit / integration / e2e) --> |
| security_scan | <!-- gitleaks / semgrep / audit result; authz allow/deny/cross-team tests --> |
| license_diff | <!-- new/removed deps and their licenses, or "none" --> |
| migration_plan | <!-- migration file(s), forward-only, tested on fresh DB, or n/a --> |
| rollback_plan | <!-- how to undo safely --> |
| perf_impact | <!-- expected impact / measurements --> |
| screenshot_RTL_if_UI | <!-- RTL screenshots or n/a --> |
| Ruflo_run_trace | <!-- swarm trace link for `Mode: swarm` tasks, else n/a --> |

## Checklist
- [ ] Input validated with Zod at the edge; authz + scope tests (allow / deny / cross-team)
- [ ] No secrets or PII in code, logs, tests or fixtures
- [ ] User-facing text via i18n keys (fa), RTL logical CSS
- [ ] `docs/agent/TASKS.md` status + evidence updated; `docs/agent/STATE.md` rewritten
- [ ] Reviewer is not the authoring agent
