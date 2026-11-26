---
mode: agent
description: Start (or resume) the next Lavin task with minimal context
---
1. Read `docs/agent/STATE.md`.
2. Find the active task (or the first `Status: todo` task whose `Depends:` are all `done`) in `docs/agent/TASKS.md` by searching its ID. Read only that block.
3. Read only the files on its `Read:` line (use line ranges / search for PRD sections).
4. Set its `Status: doing` and update the "Active task" line in STATE.md.
5. Reply with a plan of at most 5 bullets and the exact `Done when:` commands you will run. Then implement.
${input:taskId:Optional task ID to start instead of the next one}
