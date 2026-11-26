---
applyTo: "services/channel-gateway/**,services/cti-gateway/**,services/crm-adapter/**,services/workflow-facade/**,services/ai-gateway/**,integrations/**"
---
# Integration rules

- Each external system sits behind a port interface in `packages/contracts` and one adapter. Domain code never imports an SDK directly.
- Channel connectors implement the full interface from ADR-005; unsupported operations throw `UNSUPPORTED_CAPABILITY`, never fake success. Capabilities are verified by a real test before being enabled.
- Bale/Telegram: verify `X-Telegram-Bot-Api-Secret-Token`. Rubika has no documented signature: use the secret path + anti-replay; do not claim signature verification.
- CTI: AMI read-only account for events, separate account for originate; correlate by `(pbx_connection_id, linkedid)`; reconnect with exponential backoff + jitter; never expose AMI/ARI outside the PBX network.
- Corteza: only the `lavin_crm` namespace via a low-privilege service account; our authz is the source of truth; never start Flowable processes from Corteza workflows.
- Flowable: only through `workflow-facade`; domain logic lives in external workers, not Java delegates.
- Contract tests with recorded fixtures for every adapter (`tests/contract/<system>/`). Record fixtures with secrets removed.
- Timeouts, retries with jitter, and a circuit breaker on every adapter; a failing integration must not block others.
