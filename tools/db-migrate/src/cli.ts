// Usage (repo root): pnpm db:migrate — connects as lavin_migrator with values from .env.
import pg from 'pg';
import { migrate } from './migrate.ts';

const password = process.env['LAVIN_DB_PASSWORD'];
if (!password) throw new Error('LAVIN_DB_PASSWORD is not set (see env.example)');

const client = new pg.Client({
  host: process.env['POSTGRES_HOST'] ?? '127.0.0.1',
  port: Number(process.env['POSTGRES_PORT'] ?? 5432),
  user: 'lavin_migrator',
  password,
  database: 'lavin',
});

await client.connect();
try {
  const applied = await migrate(client, 'database/migrations');
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date');
} finally {
  await client.end();
}
