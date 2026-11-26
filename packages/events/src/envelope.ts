import { randomUUID } from 'node:crypto';
import { z } from 'zod';

/** Standard event envelope (PRD §15.3, table evnt.outbox). */
export const eventEnvelopeSchema = z.object({
  event_id: z.uuid(),
  event_type: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*\.v[0-9]+$/),
  schema_version: z.int().positive(),
  tenant_id: z.uuid(),
  aggregate_type: z.string().min(1),
  aggregate_id: z.uuid(),
  aggregate_version: z.int().nonnegative(),
  occurred_at: z.iso.datetime({ offset: true }),
  correlation_id: z.uuid(),
  causation_id: z.uuid().nullable(),
  actor: z.object({ type: z.enum(['user', 'service', 'system']), id: z.string().min(1) }),
  payload: z.record(z.string(), z.unknown()),
});

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;

export type NewEvent = Omit<EventEnvelope, 'event_id' | 'occurred_at' | 'causation_id'> & {
  causation_id?: string | null;
};

export function createEvent(input: NewEvent): EventEnvelope {
  return eventEnvelopeSchema.parse({
    ...input,
    event_id: randomUUID(),
    occurred_at: new Date().toISOString(),
    causation_id: input.causation_id ?? null,
  });
}

/** JetStream subject for an event type: `lavin.events.lead.created.v1`. */
export function subjectFor(eventType: string): string {
  return `lavin.events.${eventType}`;
}
