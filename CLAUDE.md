@AGENTS.md

## Claude Code specifics
- The Ruflo skill is installed globally (`docs/agent/SETUP.md`). Use it only for tasks marked `Mode: swarm` in `docs/agent/TASKS.md`.
- Use plan mode for any task estimated `M` or larger.
- Prefer the project prompts in `.github/prompts/` (`start-task`, `finish-task`, `review`) — they encode the session protocol.
