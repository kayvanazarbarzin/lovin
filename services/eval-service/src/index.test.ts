import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/eval-service', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/eval-service');
  });
});
