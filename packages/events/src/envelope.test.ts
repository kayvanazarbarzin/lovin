import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { backoffDelay, createEvent, eventEnvelopeSchema, subjectFor } from './index.ts';

const base = {
  event_type: 'lead.created.v1',
  schema_version: 1,
  tenant_id: randomUUID(),
  aggregate_type: 'lead',
  aggregate_id: randomUUID(),
  aggregate_version: 1,
  correlation_id: randomUUID(),
  actor: { type: 'user' as const, id: 'u-1' },
  payload: { source: 'bale' },
};

describe('event envelope', () => {
  it('creates a valid envelope with id, UTC timestamp and null causation', () => {
    const event = createEvent(base);
    expect(eventEnvelopeSchema.parse(event)).toEqual(event);
    expect(event.occurred_at.endsWith('Z')).toBe(true);
    expect(event.causation_id).toBeNull();
  });

  it('rejects an event type without a version suffix', () => {
    expect(() => createEvent({ ...base, event_type: 'lead.created' })).toThrow();
  });

  it('maps event types to JetStream subjects', () => {
    expect(subjectFor('lead.created.v1')).toBe('lavin.events.lead.created.v1');
  });
});

describe('backoffDelay', () => {
  it('stays within [0, min(cap, base·2^attempt))', () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const delay = backoffDelay(attempt, { baseMs: 100, capMs: 5_000 });
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(Math.min(5_000, 100 * 2 ** attempt));
    }
  });
});
