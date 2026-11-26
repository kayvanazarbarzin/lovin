import { AckPolicy, DeliverPolicy, type JsMsg } from '@nats-io/jetstream';
import type { ClientBase, Pool } from 'pg';
import { backoffDelay, DEFAULT_BACKOFF, type BackoffOptions } from './backoff.ts';
import { eventEnvelopeSchema, subjectFor, type EventEnvelope } from './envelope.ts';
import type { Running } from './relay.ts';
import { STREAM_NAME, type EventBus } from './stream.ts';

/** Runs inside the same transaction as the inbox row, so its DB effects happen exactly once. */
export type EventHandler = (event: EventEnvelope, tx: ClientBase) => Promise<void>;

export interface ConsumeOptions {
  bus: EventBus;
  pool: Pool;
  /** Durable consumer name; also the evnt.inbox dedupe key. */
  consumer: string;
  /** Event types to receive, e.g. ['lead.created.v1']; default: all. */
  eventTypes?: string[];
  handler: EventHandler;
  maxAttempts?: number;
  backoff?: BackoffOptions;
}

const NANOS_PER_MS = 1_000_000;
const UNKNOWN_EVENT_ID = '00000000-0000-0000-0000-000000000000';

export async function consume(options: ConsumeOptions): Promise<Running> {
  const { bus, consumer } = options;
  const filters = options.eventTypes?.map(subjectFor) ?? ['lavin.events.>'];
  await bus.manager.consumers.add(STREAM_NAME, {
    durable_name: consumer,
    ack_policy: AckPolicy.Explicit,
    deliver_policy: DeliverPolicy.All,
    filter_subjects: filters,
    ack_wait: 30_000 * NANOS_PER_MS,
  });
  const messages = await (await bus.js.consumers.get(STREAM_NAME, consumer)).consume();
  const loop = (async () => {
    for await (const message of messages) await handleMessage(message, options);
  })();
  return {
    async stop() {
      await messages.close();
      await loop;
    },
  };
}

async function handleMessage(message: JsMsg, options: ConsumeOptions): Promise<void> {
  const parsed = eventEnvelopeSchema.safeParse(safeJson(message));
  if (!parsed.success) {
    // Poison: retrying cannot fix a malformed envelope.
    await deadLetter(options, UNKNOWN_EVENT_ID, { raw: message.string() }, parsed.error.message);
    message.term('invalid envelope');
    return;
  }
  try {
    await processOnce(options, parsed.data);
    message.ack();
  } catch (error) {
    const maxAttempts = options.maxAttempts ?? 5;
    if (message.info.deliveryCount >= maxAttempts) {
      await deadLetter(options, parsed.data.event_id, parsed.data, String(error));
      message.term('max attempts reached');
    } else {
      message.nak(backoffDelay(message.info.deliveryCount, options.backoff ?? DEFAULT_BACKOFF));
    }
  }
}

async function processOnce(options: ConsumeOptions, event: EventEnvelope): Promise<void> {
  const client = await options.pool.connect();
  try {
    await client.query('BEGIN');
    const inbox = await client.query(
      'INSERT INTO evnt.inbox (consumer, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [options.consumer, event.event_id],
    );
    if (inbox.rowCount === 1) await options.handler(event, client); // 0 rows = duplicate delivery
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function deadLetter(
  options: ConsumeOptions,
  eventId: string,
  envelope: unknown,
  error: string,
): Promise<void> {
  await options.pool.query(
    'INSERT INTO evnt.dead_letter (consumer, event_id, envelope, error) VALUES ($1, $2, $3, $4)',
    [options.consumer, eventId, envelope, error],
  );
}

function safeJson(message: JsMsg): unknown {
  try {
    return message.json();
  } catch {
    return undefined;
  }
}
