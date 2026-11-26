import type { JetStreamClient } from '@nats-io/jetstream';
import type { ClientBase, Pool } from 'pg';
import { backoffDelay, DEFAULT_BACKOFF, type BackoffOptions } from './backoff.ts';
import { subjectFor, type EventEnvelope } from './envelope.ts';
import { OUTBOX_CHANNEL } from './outbox.ts';

/** Sends one event; `msgId` lets JetStream drop a re-send of the same attempt. */
export type Publish = (subject: string, data: string, msgId: string) => Promise<void>;

export function jetStreamPublisher(js: JetStreamClient): Publish {
  return async (subject, data, msgId) => {
    await js.publish(subject, data, { msgID: msgId });
  };
}

interface OutboxRow extends Omit<EventEnvelope, 'event_id' | 'occurred_at' | 'aggregate_version'> {
  id: string;
  occurred_at: Date;
  /** bigint column: node-postgres returns it as a string. */
  aggregate_version: string;
  attempts: number;
}

function toEnvelope(row: OutboxRow): EventEnvelope {
  const { id, occurred_at, aggregate_version, attempts, ...rest } = row;
  return {
    ...rest,
    event_id: id,
    occurred_at: occurred_at.toISOString(),
    aggregate_version: Number(aggregate_version),
  };
}

export interface BatchResult {
  published: number;
  failed: boolean;
}

/**
 * Publishes one batch inside a transaction holding row locks. If the process dies before
 * COMMIT, every row stays unpublished and is sent again; consumers dedupe via evnt.inbox.
 */
export async function relayBatch(
  client: ClientBase,
  publish: Publish,
  batchSize = 100,
): Promise<BatchResult> {
  await client.query('BEGIN');
  try {
    // If this relay dies or hangs, the server ends the session and frees the row locks.
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
    const { rows } = await client.query<OutboxRow>(
      `SELECT id, tenant_id, event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
              occurred_at, correlation_id, causation_id, actor, payload, attempts
         FROM evnt.outbox WHERE published_at IS NULL
        ORDER BY occurred_at, id LIMIT $1 FOR UPDATE SKIP LOCKED`,
      [batchSize],
    );
    const result = await publishRows(client, publish, rows);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

async function publishRows(
  client: ClientBase,
  publish: Publish,
  rows: OutboxRow[],
): Promise<BatchResult> {
  let published = 0;
  for (const row of rows) {
    try {
      // attempts is part of the id so an explicit replay is not dropped as a duplicate.
      await publish(
        subjectFor(row.event_type),
        JSON.stringify(toEnvelope(row)),
        `${row.id}:${row.attempts}`,
      );
    } catch (error) {
      await client.query(
        'UPDATE evnt.outbox SET attempts = attempts + 1, last_error = $2 WHERE id = $1',
        [row.id, String(error)],
      );
      return { published, failed: true }; // keep order: stop at the first failure
    }
    await client.query(
      'UPDATE evnt.outbox SET published_at = now(), attempts = attempts + 1, last_error = NULL WHERE id = $1',
      [row.id],
    );
    published += 1;
  }
  return { published, failed: false };
}

export interface RelayOptions {
  pool: Pool;
  publish: Publish;
  batchSize?: number;
  pollMs?: number;
  backoff?: BackoffOptions;
  /** Called when a batch fails; default logs to stderr (never swallow relay errors). */
  onError?: (error: unknown) => void;
}

export interface Running {
  stop(): Promise<void>;
}

/** Runs until stopped: wakes on NOTIFY or every pollMs; backs off with jitter after failures. */
export async function startRelay(options: RelayOptions): Promise<Running> {
  const batchSize = options.batchSize ?? 100;
  const listener = await options.pool.connect();
  await listener.query(`LISTEN ${OUTBOX_CHANNEL}`);
  const waker = createWaker();
  listener.on('notification', () => waker.wake());
  let stopped = false;
  const loop = (async () => {
    let failures = 0;
    while (!stopped) {
      const result = await runOnce(options, batchSize);
      failures = result.failed ? failures + 1 : 0;
      if (failures > 0)
        await waker.wait(backoffDelay(failures, options.backoff ?? DEFAULT_BACKOFF));
      else if (result.published < batchSize) await waker.wait(options.pollMs ?? 1_000);
    }
  })();
  return {
    async stop() {
      stopped = true;
      waker.wake();
      await loop;
      await listener.query('UNLISTEN *');
      listener.release();
    },
  };
}

async function runOnce(options: RelayOptions, batchSize: number): Promise<BatchResult> {
  const client = await options.pool.connect();
  try {
    const result = await relayBatch(client, options.publish, batchSize);
    client.release();
    return result;
  } catch (error) {
    (options.onError ?? ((e: unknown) => console.error('[events] relay batch failed', e)))(error);
    client.release(true); // drop a possibly broken connection
    return { published: 0, failed: true };
  }
}

/** A sleep that a NOTIFY (or stop) can cut short. */
function createWaker(): { wait(ms: number): Promise<void>; wake(): void } {
  let pending: (() => void) | undefined;
  return {
    wait: (ms) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(() => pending?.(), ms);
        pending = () => {
          clearTimeout(timer);
          pending = undefined;
          resolve();
        };
      }),
    wake: () => pending?.(),
  };
}
