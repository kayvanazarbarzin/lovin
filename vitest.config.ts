import { defineConfig } from 'vitest/config';

// Lets `pnpm vitest` at the root (and IDE runners) see every workspace package.
export default defineConfig({
  test: {
    projects: ['apps/*', 'services/*', 'packages/*'],
  },
});
