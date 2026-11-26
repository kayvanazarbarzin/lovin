// Replay CLI (runs as lavin_app). From repo root:
//   pnpm events:replay dead-letters [consumer]
//   pnpm events:replay outbox <sinceISO> [untilISO]
import pg from 'pg';
import { replayDeadLetters, replayOutbox } from './replay.ts';
import { jetStreamPublisher } from './relay.ts';
import { connectEventBus } from './stream.ts';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see env.example)`);
  return value;
}

const [command, first, second] = process.argv.slice(2);
const pool = new pg.Pool({
  host: process.env['POSTGRES_HOST'] ?? '127.0.0.1',
  port: Number(process.env['POSTGRES_PORT'] ?? 5432),
  user: 'lavin_app',
  password: required('LAVIN_APP_DB_PASSWORD'),
  database: 'lavin',
});

try {
  if (command === 'outbox' && first) {
    const count = await replayOutbox(pool, new Date(first), second ? new Date(second) : undefined);
    console.log(`Marked ${count} outbox events for re-publishing`);
  } else if (command === 'dead-letters') {
    const bus = await connectEventBus({
      servers: `127.0.0.1:${process.env['NATS_PORT'] ?? 4222}`,
      user: 'lavin',
      pass: required('NATS_PASSWORD'),
    });
    const count = await replayDeadLetters(pool, jetStreamPublisher(bus.js), first);
    await bus.connection.drain();
    console.log(`Re-published ${count} dead letters`);
  } else {
    console.error('Usage: events:replay dead-letters [consumer] | outbox <sinceISO> [untilISO]');
    process.exitCode = 2;
  }
} finally {
  await pool.end();
}
