import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/test-kit', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/test-kit');
  });
});
