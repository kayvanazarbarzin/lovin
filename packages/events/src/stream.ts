import {
  jetstream,
  jetstreamManager,
  type JetStreamClient,
  type JetStreamManager,
} from '@nats-io/jetstream';
import { connect, type NatsConnection } from '@nats-io/transport-node';

export const STREAM_NAME = 'LAVIN_EVENTS';
const NANOS_PER_MS = 1_000_000;
/** JetStream drops a re-published event (same msgID = event_id) inside this window. */
const DUPLICATE_WINDOW_MS = 10 * 60_000;

export interface NatsSettings {
  servers: string;
  user?: string;
  pass?: string;
}

export interface EventBus {
  connection: NatsConnection;
  js: JetStreamClient;
  manager: JetStreamManager;
}

/** Connects and makes sure the event stream exists (idempotent). */
export async function connectEventBus(settings: NatsSettings): Promise<EventBus> {
  const connection = await connect(settings);
  const manager = await jetstreamManager(connection);
  const config = {
    name: STREAM_NAME,
    subjects: ['lavin.events.>'],
    duplicate_window: DUPLICATE_WINDOW_MS * NANOS_PER_MS,
  };
  try {
    await manager.streams.info(STREAM_NAME);
    await manager.streams.update(STREAM_NAME, config);
  } catch {
    await manager.streams.add(config);
  }
  return { connection, js: jetstream(connection), manager };
}
