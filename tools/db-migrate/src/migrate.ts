import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ClientBase } from 'pg';

/** `NNNN_<verb>_<what>.sql` (database.instructions.md). */
const FILE_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;
/** Any constant works; it only has to be the same for every runner. */
const ADVISORY_LOCK_KEY = 4_517_301;

const BOOKKEEPING_SQL = `
  CREATE SCHEMA IF NOT EXISTS conf;
  CREATE TABLE IF NOT EXISTS conf.schema_migrations (
    version    text PRIMARY KEY,
    name       text NOT NULL,
    checksum   text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  );`;

export interface MigrationFile {
  version: string;
  name: string;
  sql: string;
  checksum: string;
}

export async function readMigrations(directory: string): Promise<MigrationFile[]> {
  const names = (await readdir(directory)).filter((name) => FILE_PATTERN.test(name)).sort();
  const files = await Promise.all(
    names.map(async (name) => {
      const sql = await readFile(join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      return { version: name.slice(0, 4), name, sql, checksum };
    }),
  );
  const versions = new Set(files.map((file) => file.version));
  if (versions.size !== files.length) throw new Error('Two migration files share a version number');
  return files;
}

/** The runner owns the transaction, so a file-level `BEGIN; … COMMIT;` pair is removed. */
export function stripOuterTransaction(sql: string): string {
  return sql.replace(/^((?:\s*--[^\n]*\n)*)\s*BEGIN;/, '$1').replace(/COMMIT;\s*$/, '');
}

async function applyOne(client: ClientBase, file: MigrationFile): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query(stripOuterTransaction(file.sql));
    await client.query(
      'INSERT INTO conf.schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
      [file.version, file.name, file.checksum],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${file.name} failed`, { cause: error });
  }
}

/** Applies pending migrations in order; returns the names it applied. */
export async function migrate(client: ClientBase, directory: string): Promise<string[]> {
  const files = await readMigrations(directory);
  await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
  try {
    await client.query(BOOKKEEPING_SQL);
    const result = await client.query<{ version: string; checksum: string }>(
      'SELECT version, checksum FROM conf.schema_migrations',
    );
    const applied = new Map(result.rows.map((row) => [row.version, row.checksum]));
    const done: string[] = [];
    for (const file of files) {
      const checksum = applied.get(file.version);
      if (checksum === undefined) {
        await applyOne(client, file);
        done.push(file.name);
      } else if (checksum !== file.checksum) {
        throw new Error(
          `${file.name} was edited after it was applied; add a new migration instead`,
        );
      }
    }
    return done;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
  }
}
