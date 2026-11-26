---
mode: agent
description: Close the current Lavin task and persist memory
---
1. Run the task's `Done when:` checks. If any fails, fix or set `Status: blocked` with the reason.
2. In `docs/agent/TASKS.md`: set `Status`, fill `Evidence:` with a one-line summary of the command results.
3. Rewrite `docs/agent/STATE.md` (≤ 60 lines): active/next task, what changed (files), open questions, known risks.
4. Append any design choice to `docs/agent/DECISIONS.md` as one line: `YYYY-MM-DD | TASK-ID | decision | why`.
5. Commit: `<TASK-ID>: <summary>`. Do not push unless asked.
