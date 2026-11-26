import { describe, expect, it } from 'vitest';
import { findViolations, isLicenseAllowed, type LicensePolicy } from './index.ts';

const allow = new Set(['MIT', 'Apache-2.0']);

describe('isLicenseAllowed', () => {
  it('accepts a plain allowed license', () => {
    expect(isLicenseAllowed('MIT', allow)).toBe(true);
  });
  it('accepts an OR expression when one branch is allowed', () => {
    expect(isLicenseAllowed('(MIT OR WTFPL)', allow)).toBe(true);
  });
  it('rejects an AND expression with a copyleft term', () => {
    expect(isLicenseAllowed('Apache-2.0 AND LGPL-3.0-or-later', allow)).toBe(false);
  });
  it('rejects unknown and empty licenses', () => {
    expect(isLicenseAllowed('Unknown', allow)).toBe(false);
    expect(isLicenseAllowed('', allow)).toBe(false);
  });
});

describe('findViolations', () => {
  const policy: LicensePolicy = {
    allow: ['MIT'],
    devExceptions: [{ package: '@img/sharp-*', license: 'LGPL-3.0-or-later', reason: 'test' }],
  };

  it('AT-20 a GPL-3 package fails the gate', () => {
    const violations = findViolations(
      [{ name: 'gpl-lib', license: 'GPL-3.0-only', scope: 'dev' }],
      policy,
    );
    expect(violations).toEqual([
      { name: 'gpl-lib', license: 'GPL-3.0-only', scope: 'dev', rule: 'not-allowed' },
    ]);
  });

  it('AT-20 an unknown-license prod package fails the gate', () => {
    const violations = findViolations(
      [{ name: 'mystery', license: 'Unknown', scope: 'prod' }],
      policy,
    );
    expect(violations).toHaveLength(1);
  });

  it('lets a reviewed dev exception pass but never in prod', () => {
    const dev = { name: '@img/sharp-libvips', license: 'LGPL-3.0-or-later', scope: 'dev' as const };
    expect(findViolations([dev], policy)).toEqual([]);
    expect(findViolations([{ ...dev, scope: 'prod' }], policy)[0]?.rule).toBe(
      'not-allowed-in-prod',
    );
  });

  it('does not let an exception cover a changed license', () => {
    const changed = { name: '@img/sharp-x', license: 'GPL-3.0-only', scope: 'dev' as const };
    expect(findViolations([changed], policy)).toHaveLength(1);
  });
});
