// @integration — needs Docker. Run: pnpm db:test-migrations
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type AddressInfo } from 'node:net';
import { cp, mkdtemp, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from './index.ts';

// Same image as infra/compose (pinned by digest).
const IMAGE =
  'pgvector/pgvector:0.8.7-pg16@sha256:484e838076e04939d27d3e176e91c86eea96236126023be8d3059761122e579f';
const MIGRATIONS = resolve(import.meta.dirname, '../../../database/migrations');
// Ryuk (the crash-cleanup sidecar) also needs a random host port, which Docker Desktop 29 on
// Windows does not bind. Locally afterAll stops the container; CI (Linux) keeps Ryuk on.
if (process.platform === 'win32') process.env['TESTCONTAINERS_RYUK_DISABLED'] ??= 'true';

const migratorPassword = randomBytes(16).toString('hex');
const appPassword = randomBytes(16).toString('hex');

let container: StartedPostgreSqlContainer;

function connect(user: string, password: string): pg.Client {
  const { host, port } = { host: container.getHost(), port: container.getPort() };
  return new pg.Client({ host, port, user, password, database: 'lavin' });
}

async function withClient<T>(client: pg.Client, work: (c: pg.Client) => Promise<T>): Promise<T> {
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Mirrors infra/compose/postgres/init/01-databases.sh for the lavin database. */
async function bootstrap(): Promise<void> {
  const admin = new pg.Client({ connectionString: container.getConnectionUri() });
  await withClient(admin, async (c) => {
    await c.query(`CREATE ROLE lavin_migrator LOGIN PASSWORD '${migratorPassword}'`);
    await c.query(`CREATE ROLE lavin_app LOGIN PASSWORD '${appPassword}'`);
    await c.query('CREATE DATABASE lavin OWNER lavin_migrator');
  });
  const lavinAdmin = new pg.Client({
    connectionString: container.getConnectionUri().replace(/\/[^/]+$/, '/lavin'),
  });
  await withClient(lavinAdmin, async (c) => {
    await c.query('CREATE EXTENSION pgcrypto; CREATE EXTENSION vector');
    await c.query('REVOKE ALL ON DATABASE lavin FROM PUBLIC; GRANT CONNECT ON DATABASE lavin TO lavin_app');
  });
}

/** Docker Desktop 29 on Windows ignores `HostPort: "0"`, so pick a free host port ourselves. */
async function freePort(): Promise<number> {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  server.close();
  return port;
}

beforeAll(async () => {
  container = await new PostgreSqlContainer(IMAGE)
    .withExposedPorts({ container: 5432, host: await freePort() })
    .start();
  await bootstrap();
}, 180_000);

afterAll(async () => {
  await container?.stop();
});

const AUDIT_ROW = `INSERT INTO logs.audit_event
  (tenant_id, actor_type, actor_id, action, entity_type, outcome, correlation_id, hash)
  VALUES (gen_random_uuid(), 'system', 'test', 'test.insert', 'test', 'success', gen_random_uuid(), '\\x00')`;

describe('db:test-migrations', () => {
  it('applies every migration on an empty database, then is a no-op', async () => {
    const applied = await withClient(connect('lavin_migrator', migratorPassword), (c) =>
      migrate(c, MIGRATIONS),
    );
    expect(applied).toEqual(['0001_platform_core.sql', '0002_grant_app_role.sql']);
    const again = await withClient(connect('lavin_migrator', migratorPassword), (c) =>
      migrate(c, MIGRATIONS),
    );
    expect(again).toEqual([]);
  });

  it('refuses to run when an applied migration was edited', async () => {
    const copy = await mkdtemp(join(tmpdir(), 'lavin-migrations-'));
    await cp(MIGRATIONS, copy, { recursive: true });
    await appendFile(join(copy, '0001_platform_core.sql'), '\n-- edited\n');
    const run = withClient(connect('lavin_migrator', migratorPassword), (c) => migrate(c, copy));
    await expect(run).rejects.toThrow('0001_platform_core.sql was edited');
  });

  it('lets lavin_app insert and read audit events', async () => {
    await withClient(connect('lavin_app', appPassword), async (c) => {
      await c.query(AUDIT_ROW);
      const { rows } = await c.query('SELECT count(*)::int AS n FROM logs.audit_event');
      expect(rows[0].n).toBeGreaterThan(0);
    });
  });

  it.each([
    ['UPDATE', "UPDATE logs.audit_event SET actor_id = 'x'"],
    ['DELETE', 'DELETE FROM logs.audit_event'],
    ['TRUNCATE', 'TRUNCATE logs.audit_event'],
    ['DDL create', 'CREATE TABLE orgs.intruder (id int)'],
    ['DDL alter', 'ALTER TABLE orgs.tenant ADD COLUMN intruder int'],
    ['bookkeeping', 'SELECT * FROM conf.schema_migrations'],
  ])('denies lavin_app %s', async (_label, sql) => {
    await withClient(connect('lavin_app', appPassword), async (c) => {
      // 42501 = insufficient_privilege (not the append-only trigger, not a missing table).
      await expect(c.query(sql)).rejects.toMatchObject({ code: '42501' });
    });
  });
});
