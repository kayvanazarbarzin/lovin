# Developer & agent setup

Run once per developer machine (VS Code + coding agent). Development tooling only — none of this ships in production images.

## 1. Prerequisites
- Node.js 22 LTS (`.nvmrc`), pnpm 10 (pinned in `packageManager`; `corepack enable`), Docker + Compose v2, Git.
- pnpm supply-chain guards live in `pnpm-workspace.yaml` (7-day `minimumReleaseAge`, `trustPolicy`, `blockExoticSubdeps`); dependency build scripts are blocked unless approved.
- VS Code extensions: GitHub Copilot Chat and/or Claude Code, ESLint, Prettier, Tailwind CSS IntelliSense, Playwright Test, PostgreSQL client of choice.

## 2. Ruflo skill (global, owner decision)
```bash
# Installs the Ruflo skill at user level so every project/agent sees it
npx skills add https://github.com/ruvnet/ruflo --skill ruflo -g
npx skills list -g          # verify "ruflo" is listed
```
Pinning: the fork `kayvanazarbarzin/ruflo` must first be synced with upstream (GitHub → "Sync fork"), then tagged `lavin-pin-<date>`. Record the tag/SHA in `docs/agent/DECISIONS.md`. Update deliberately with `npx skills update -g ruflo` and review the diff; never auto-update.

## 3. Ruflo CLI in the repo (dev dependency, pinned)
```bash
pnpm add -D -w ruflo@3.80.8        # exact version, lockfile committed
pnpm exec ruflo init                # review the generated diff before committing
pnpm exec ruflo doctor              # do NOT use --fix until you have reviewed what it changes
pnpm exec ruflo discover-plugins
pnpm exec ruflo mcp list
```
Rules: Ruflo is for multi-agent tasks marked `Mode: swarm` only. Never give Ruflo agents real secrets or customer data. `ruflo init` output (`.claude/`, MCP config, hooks) is committed only after review.

## 4. Recommended skills (project level, small set to save tokens)
Every installed skill adds its description to the agent's context, so install only what the tasks use.

| Skill | Why | Install |
|---|---|---|
| `ruflo` | orchestration entry point | global (above) |
| `adr-create`, `adr-review` | ADR discipline (every architecture change) | `npx skills add ruvnet/ruflo --skill adr-create` (repeat per skill) |
| `migrate-create`, `migrate-validate` | SQL migration hygiene | same pattern |
| `tdd-workflow`, `test-gaps` | test-first and missing-test detection | same pattern |
| `security-scan`, `dependency-check` | per-PR security & dependency audit | same pattern |
| `cost-compact-context` | keep long sessions small | same pattern |

Do **not** install `--all` (267 skills): it bloats context on every turn.
After installing, commit `skills-lock.json` so every agent restores the same set: `npx skills install --frozen-lockfile`.

## 5. Local stack
```bash
cp .env.example .env               # fill only local dev values; never commit .env
docker compose -f infra/compose/docker-compose.yml --profile core up -d
pnpm install && pnpm db:migrate && pnpm db:seed
pnpm dev
```
Profiles: `core` (postgres, valkey, nats, keycloak, api, web, worker), `bpm` (flowable), `crm` (corteza), `cms` (payload), `cti` (asterisk test PBX), `ai` (ollama), `meet` (jitsi), `obs` (observability).
One PostgreSQL instance hosts separate databases: `lavin`, `keycloak`, `flowable`, `corteza`, `payload`.
