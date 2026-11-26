// @integration — needs Docker. Real PostgreSQL (migrated) + NATS JetStream; app runs as lavin_app.
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { migrate } from '@lavin/db-migrate';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  connectEventBus,
  consume,
  createEvent,
  jetStreamPublisher,
  relayBatch,
  startRelay,
  writeOutbox,
  type EventBus,
  type Publish,
} from './index.ts';

if (process.platform === 'win32') process.env['TESTCONTAINERS_RYUK_DISABLED'] ??= 'true';

const PG_IMAGE =
  'pgvector/pgvector:0.8.7-pg16@sha256:484e838076e04939d27d3e176e91c86eea96236126023be8d3059761122e579f';
const NATS_IMAGE =
  'nats:2.10.29-alpine@sha256:b83efabe3e7def1e0a4a31ec6e078999bb17c80363f881df35edc70fcb6bb927';
const MIGRATIONS = resolve(import.meta.dirname, '../../../database/migrations');
const migratorPassword = randomBytes(16).toString('hex');
const appPassword = randomBytes(16).toString('hex');
const FAST = { maxAttempts: 3, backoff: { baseMs: 20, capMs: 100 } };

let pgContainer: StartedPostgreSqlContainer;
let natsContainer: StartedTestContainer;
let appPool: pg.Pool;
let bus: EventBus;

async function freePort(): Promise<number> {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  server.close();
  return port;
}

function lavinClient(user: string, password: string): pg.ClientConfig {
  return {
    host: pgContainer.getHost(),
    port: pgContainer.getPort(),
    user,
    password,
    database: 'lavin',
  };
}

async function preparePostgres(): Promise<void> {
  pgContainer = await new PostgreSqlContainer(PG_IMAGE)
    .withExposedPorts({ container: 5432, host: await freePort() })
    .start();
  const admin = new pg.Client({ connectionString: pgContainer.getConnectionUri() });
  await admin.connect();
  await admin.query(`CREATE ROLE lavin_migrator LOGIN PASSWORD '${migratorPassword}'`);
  await admin.query(`CREATE ROLE lavin_app LOGIN PASSWORD '${appPassword}'`);
  await admin.query('CREATE DATABASE lavin OWNER lavin_migrator');
  await admin.end();
  const lavinAdmin = new pg.Client({
    connectionString: pgContainer.getConnectionUri().replace(/\/[^/]+$/, '/lavin'),
  });
  await lavinAdmin.connect();
  await lavinAdmin.query(
    'CREATE EXTENSION pgcrypto; CREATE EXTENSION vector; GRANT CONNECT ON DATABASE lavin TO lavin_app',
  );
  await lavinAdmin.end();
  const migrator = new pg.Client(lavinClient('lavin_migrator', migratorPassword));
  await migrator.connect();
  await migrate(migrator, MIGRATIONS);
  // Test-only side-effect table; default privileges give lavin_app DML on it.
  await migrator.query(
    'CREATE TABLE task.test_side_effect (consumer text NOT NULL, event_id uuid NOT NULL)',
  );
  await migrator.end();
}

async function prepareNats(): Promise<void> {
  natsContainer = await new GenericContainer(NATS_IMAGE)
    .withCommand(['-js'])
    .withExposedPorts({ container: 4222, host: await freePort() })
    .withWaitStrategy(Wait.forLogMessage(/Server is ready/))
    .start();
  bus = await connectEventBus({
    servers: `${natsContainer.getHost()}:${natsContainer.getMappedPort(4222)}`,
  });
}

beforeAll(async () => {
  await Promise.all([preparePostgres(), prepareNats()]);
  appPool = new pg.Pool(lavinClient('lavin_app', appPassword));
}, 240_000);

afterAll(async () => {
  await bus?.connection.drain();
  await appPool?.end();
  await Promise.all([pgContainer?.stop(), natsContainer?.stop()]);
}, 60_000);

/** Polls a condition instead of sleeping (tests.instructions.md). */
async function waitFor(
  check: () => Promise<boolean>,
  label = 'condition',
  timeoutMs = 20_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for: ${label}`);
    await new Promise((r) => setTimeout(r, 100));
  }
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await appPool.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM ${sql}`,
    params,
  );
  return rows[0]?.n ?? 0;
}

function testEvent(eventType: string) {
  return createEvent({
    event_type: eventType,
    schema_version: 1,
    tenant_id: randomUUID(),
    aggregate_type: 'test',
    aggregate_id: randomUUID(),
    aggregate_version: 1,
    correlation_id: randomUUID(),
    actor: { type: 'system', id: 'integration-test' },
    payload: {},
  });
}

function recordSideEffect(consumer: string) {
  return async (event: { event_id: string }, tx: pg.ClientBase) => {
    await tx.query('INSERT INTO task.test_side_effect (consumer, event_id) VALUES ($1, $2)', [
      consumer,
      event.event_id,
    ]);
  };
}

describe('events: outbox → JetStream → inbox', { timeout: 60_000 }, () => {
  it('processes a duplicate delivery once', async () => {
    const consumer = await consume({
      bus,
      pool: appPool,
      consumer: 'dup',
      eventTypes: ['test.dup.v1'],
      handler: recordSideEffect('dup'),
    });
    const event = testEvent('test.dup.v1');
    const publish = jetStreamPublisher(bus.js);
    await publish('lavin.events.test.dup.v1', JSON.stringify(event), 'first');
    await publish('lavin.events.test.dup.v1', JSON.stringify(event), 'second'); // distinct msg ids: both delivered
    await waitFor(
      async () =>
        (await bus.manager.consumers.info('LAVIN_EVENTS', 'dup')).num_ack_pending === 0 &&
        (await bus.manager.consumers.info('LAVIN_EVENTS', 'dup')).delivered.stream_seq >= 2,
    );
    await consumer.stop();
    expect(await count("task.test_side_effect WHERE consumer = 'dup'")).toBe(1);
  });

  it('AT-13 relay killed mid-batch: no loss, no duplicate side effect', async () => {
    const events = Array.from({ length: 20 }, () => testEvent('test.crash.v1'));
    const tx = await appPool.connect();
    await tx.query('BEGIN');
    for (const event of events) await writeOutbox(tx, event);
    await tx.query('COMMIT');
    tx.release();

    // Crash: after 5 sends the relay process dies; its DB session ends mid-transaction.
    const doomed = new pg.Client(lavinClient('lavin_app', appPassword));
    await doomed.connect();
    doomed.on('error', () => undefined);
    const { rows } = await doomed.query<{ pid: number }>('SELECT pg_backend_pid() AS pid');
    const killer = new pg.Client({ connectionString: pgContainer.getConnectionUri() });
    await killer.connect();
    let sent = 0;
    const real = jetStreamPublisher(bus.js);
    const crashing: Publish = async (subject, data, msgId) => {
      if (sent === 5) await killer.query('SELECT pg_terminate_backend($1)', [rows[0]?.pid]);
      await real(subject, data, msgId);
      sent += 1;
    };
    await expect(relayBatch(doomed, crashing)).rejects.toThrow();
    await killer.end();
    expect(sent).toBe(6); // the 6th send reached NATS, but its row was never marked published
    expect(
      await count("evnt.outbox WHERE event_type = 'test.crash.v1' AND published_at IS NULL"),
    ).toBe(20);

    const consumer = await consume({
      bus,
      pool: appPool,
      consumer: 'crash',
      eventTypes: ['test.crash.v1'],
      handler: recordSideEffect('crash'),
    });
    const relay = await startRelay({ pool: appPool, publish: real, pollMs: 100 });
    try {
      await waitFor(
        async () =>
          (await count(
            "evnt.outbox WHERE event_type = 'test.crash.v1' AND published_at IS NULL",
          )) === 0,
        'outbox drained',
      );
      await waitFor(
        async () => (await count("task.test_side_effect WHERE consumer = 'crash'")) >= 20,
        '20 side effects',
      );
    } finally {
      await relay.stop();
      await consumer.stop();
    }
    expect(
      await count("evnt.outbox WHERE event_type = 'test.crash.v1' AND published_at IS NULL"),
    ).toBe(0);
    expect(await count("task.test_side_effect WHERE consumer = 'crash'")).toBe(20);
    expect(
      await count(
        "(SELECT DISTINCT event_id FROM task.test_side_effect WHERE consumer = 'crash') d",
      ),
    ).toBe(20);
  });

  it('dead-letters a poison message after max attempts', async () => {
    const consumer = await consume({
      bus,
      pool: appPool,
      consumer: 'poison',
      eventTypes: ['test.poison.v1'],
      ...FAST,
      handler: async () => {
        throw new Error('cannot handle this');
      },
    });
    const event = testEvent('test.poison.v1');
    await jetStreamPublisher(bus.js)(
      'lavin.events.test.poison.v1',
      JSON.stringify(event),
      event.event_id,
    );
    await waitFor(async () => (await count("evnt.dead_letter WHERE consumer = 'poison'")) === 1);
    await consumer.stop();
    const { rows } = await appPool.query(
      "SELECT event_id, error FROM evnt.dead_letter WHERE consumer = 'poison'",
    );
    expect(rows[0]).toMatchObject({ event_id: event.event_id, error: 'Error: cannot handle this' });
    expect(await count("evnt.inbox WHERE consumer = 'poison'")).toBe(0);
  });
});
