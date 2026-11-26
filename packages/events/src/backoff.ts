export interface BackoffOptions {
  baseMs: number;
  capMs: number;
}

export const DEFAULT_BACKOFF: BackoffOptions = { baseMs: 500, capMs: 60_000 };

/** Exponential backoff with full jitter: a random delay in [0, min(cap, base · 2^attempt)). */
export function backoffDelay(attempt: number, options: BackoffOptions = DEFAULT_BACKOFF): number {
  const ceiling = Math.min(options.capMs, options.baseMs * 2 ** Math.max(0, attempt));
  return Math.floor(Math.random() * ceiling);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
