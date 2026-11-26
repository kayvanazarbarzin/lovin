import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/events', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/events');
  });
});
