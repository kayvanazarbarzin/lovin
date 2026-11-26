import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/ai-gateway', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/ai-gateway');
  });
});
