import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/cti-gateway', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/cti-gateway');
  });
});
