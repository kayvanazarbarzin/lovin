export interface LicensePolicy {
  allow: string[];
  devExceptions: DevException[];
}

/** A reviewed dev-only package whose license is outside the allowlist. `package` may end with `*`. */
export interface DevException {
  package: string;
  license: string;
  reason: string;
}

export interface InstalledPackage {
  name: string;
  license: string;
  scope: 'prod' | 'dev';
}

export interface Violation extends InstalledPackage {
  rule: 'not-allowed' | 'not-allowed-in-prod';
}

/** SPDX expression check: OR needs one allowed branch, AND needs every term allowed. */
export function isLicenseAllowed(expression: string, allow: ReadonlySet<string>): boolean {
  const flat = expression.replace(/[()]/g, ' ').trim();
  if (flat === '') return false;
  return flat
    .split(/\s+OR\s+/i)
    .some((branch) => branch.split(/\s+AND\s+/i).every((term) => allow.has(term.trim())));
}

function matchesException(pkg: InstalledPackage, exception: DevException): boolean {
  const nameMatches = exception.package.endsWith('*')
    ? pkg.name.startsWith(exception.package.slice(0, -1))
    : pkg.name === exception.package;
  return nameMatches && exception.license === pkg.license;
}

export function findViolations(packages: InstalledPackage[], policy: LicensePolicy): Violation[] {
  const allow = new Set(policy.allow);
  const violations: Violation[] = [];
  for (const pkg of packages) {
    if (isLicenseAllowed(pkg.license, allow)) continue;
    const excepted = policy.devExceptions.some((exception) => matchesException(pkg, exception));
    if (pkg.scope === 'dev' && excepted) continue;
    violations.push({ ...pkg, rule: excepted ? 'not-allowed-in-prod' : 'not-allowed' });
  }
  return violations;
}
