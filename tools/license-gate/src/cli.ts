// License gate (AT-20). Usage: node tools/license-gate/src/cli.ts [policyPath]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { findViolations, type InstalledPackage, type LicensePolicy } from './policy.ts';

interface PnpmLicenseEntry {
  name: string;
}

function listLicenses(prodOnly: boolean): Map<string, string> {
  const args = ['licenses', 'list', '--json', ...(prodOnly ? ['--prod'] : [])];
  // Run pnpm's JS entry with node directly: no shell, so no argument injection on Windows.
  const pnpmEntry = process.env['npm_execpath'];
  if (!pnpmEntry) throw new Error('Run via `pnpm audit:licenses` so npm_execpath points to pnpm.');
  const isScript = /\.[cm]?js$/.test(pnpmEntry);
  const [command, commandArgs] = isScript
    ? [process.execPath, [pnpmEntry, ...args]]
    : [pnpmEntry, args];
  const output = execFileSync(command, commandArgs, {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  }).trim();
  const byName = new Map<string, string>();
  if (!output.startsWith('{')) return byName; // pnpm prints a sentence when there are no packages
  const grouped = JSON.parse(output) as Record<string, PnpmLicenseEntry[]>;
  for (const [license, entries] of Object.entries(grouped)) {
    for (const entry of entries) byName.set(entry.name, license);
  }
  return byName;
}

function collectPackages(): InstalledPackage[] {
  const prod = listLicenses(true);
  const all = listLicenses(false);
  return [...all].map(([name, license]) => ({
    name,
    license,
    scope: prod.has(name) ? 'prod' : 'dev',
  }));
}

const policyPath = process.argv[2] ?? 'docs/compliance/license-policy.json';
const policy = JSON.parse(readFileSync(policyPath, 'utf8')) as LicensePolicy;
const packages = collectPackages();
const violations = findViolations(packages, policy);
const prodCount = packages.filter((pkg) => pkg.scope === 'prod').length;
console.log(`License gate: ${packages.length} packages (${prodCount} prod), policy ${policyPath}`);
for (const violation of violations) {
  console.error(
    `✖ ${violation.rule}: ${violation.name} [${violation.scope}] — ${violation.license}`,
  );
}
if (violations.length > 0) {
  console.error(
    `${violations.length} license violation(s). See docs/compliance/LICENSE-DECISION.md §4.`,
  );
  process.exit(1);
}
console.log('✔ all licenses allowed');
