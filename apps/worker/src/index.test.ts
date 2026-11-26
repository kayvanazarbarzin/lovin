import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/worker', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/worker');
  });
});
