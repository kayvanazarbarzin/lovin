---
mode: agent
description: Independent review of the current diff against Lavin rules
---
Review `git diff main...HEAD` as an independent reviewer (not the author). Report only real problems, most severe first:
1. Correctness vs the task's `Done when:` and cited PRD IDs.
2. Security checklist (AGENTS.md §8) and authz/scope on every new endpoint, stream, file and job.
3. Simplicity limits (AGENTS.md §3): over-abstraction, dead code, files/functions over limits, unnecessary dependencies.
4. Architecture guardrails (AGENTS.md §4–5): cross-module imports, missing outbox/audit, schema naming, tenant_id.
5. Missing tests (allow/deny/cross-team, duplicate delivery).
For each: file:line, the problem, a concrete fix. If nothing is wrong, say so in one line.
