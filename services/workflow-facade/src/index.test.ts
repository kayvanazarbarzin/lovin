import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/workflow-facade', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/workflow-facade');
  });
});
