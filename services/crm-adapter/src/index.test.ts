import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/crm-adapter', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/crm-adapter');
  });
});
