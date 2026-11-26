import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@lavin/i18n', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@lavin/i18n');
  });
});
