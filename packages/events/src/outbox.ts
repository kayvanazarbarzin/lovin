import type { ClientBase } from 'pg';
import { eventEnvelopeSchema, type EventEnvelope } from './envelope.ts';

/** Anything that can run a parameterized query: a pg client inside an open transaction. */
export type Queryable = Pick<ClientBase, 'query'>;

export const OUTBOX_CHANNEL = 'evnt_outbox';

/**
 * Writes the event in the caller's transaction (AGENTS.md §4): it becomes visible to the
 * relay only if the domain change commits. NOTIFY is also delivered only on commit.
 */
export async function writeOutbox(tx: Queryable, event: EventEnvelope): Promise<void> {
  const e = eventEnvelopeSchema.parse(event);
  await tx.query(
    `INSERT INTO evnt.outbox (id, tenant_id, event_type, schema_version, aggregate_type,
       aggregate_id, aggregate_version, occurred_at, correlation_id, causation_id, actor, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      e.event_id,
      e.tenant_id,
      e.event_type,
      e.schema_version,
      e.aggregate_type,
      e.aggregate_id,
      e.aggregate_version,
      e.occurred_at,
      e.correlation_id,
      e.causation_id,
      e.actor,
      e.payload,
    ],
  );
  await tx.query(`SELECT pg_notify('${OUTBOX_CHANNEL}', '')`);
}
