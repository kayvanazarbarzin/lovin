import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/ui', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/ui');
  });
});
