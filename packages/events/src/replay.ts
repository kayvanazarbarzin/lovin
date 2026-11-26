import type { Pool } from 'pg';
import { eventEnvelopeSchema, subjectFor } from './envelope.ts';
import type { Publish } from './relay.ts';

/**
 * Re-publishes dead letters (optionally for one consumer). Consumers that already processed
 * the event skip it via evnt.inbox; the failed consumer gets a fresh delivery.
 */
export async function replayDeadLetters(
  pool: Pool,
  publish: Publish,
  consumer?: string,
): Promise<number> {
  const { rows } = await pool.query<{ id: string; envelope: unknown }>(
    `SELECT id, envelope FROM evnt.dead_letter
      WHERE replayed_at IS NULL AND ($1::text IS NULL OR consumer = $1) ORDER BY id`,
    [consumer ?? null],
  );
  let replayed = 0;
  for (const row of rows) {
    const parsed = eventEnvelopeSchema.safeParse(row.envelope);
    if (!parsed.success) continue; // malformed originals need a human, not a replay
    const event = parsed.data;
    await publish(
      subjectFor(event.event_type),
      JSON.stringify(event),
      `${event.event_id}:replay:${row.id}`,
    );
    await pool.query('UPDATE evnt.dead_letter SET replayed_at = now() WHERE id = $1', [row.id]);
    replayed += 1;
  }
  return replayed;
}

/** Marks outbox events in [since, until) unpublished so the relay sends them again. */
export async function replayOutbox(
  pool: Pool,
  since: Date,
  until: Date = new Date(),
): Promise<number> {
  const result = await pool.query(
    `UPDATE evnt.outbox SET published_at = NULL
      WHERE occurred_at >= $1 AND occurred_at < $2 AND published_at IS NOT NULL`,
    [since, until],
  );
  return result.rowCount ?? 0;
}
