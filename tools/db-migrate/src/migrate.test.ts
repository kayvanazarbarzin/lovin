import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readMigrations, stripOuterTransaction } from './index.ts';

describe('stripOuterTransaction', () => {
  it('removes a file-level BEGIN/COMMIT pair after header comments', () => {
    const sql = '-- header\n-- more\n\nBEGIN;\nCREATE TABLE a (id int);\n\nCOMMIT;\n';
    expect(stripOuterTransaction(sql)).toBe('-- header\n-- more\n\nCREATE TABLE a (id int);\n\n');
  });

  it('leaves a file without its own transaction unchanged', () => {
    const sql = '-- header\nGRANT USAGE ON SCHEMA x TO y;\n';
    expect(stripOuterTransaction(sql)).toBe(sql);
  });
});

describe('readMigrations', () => {
  it('orders files by version and ignores non-migration files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lavin-migrations-'));
    await writeFile(join(directory, '0002_add_b.sql'), 'SELECT 2;');
    await writeFile(join(directory, '0001_add_a.sql'), 'SELECT 1;');
    await writeFile(join(directory, 'README.md'), 'notes');
    const files = await readMigrations(directory);
    expect(files.map((file) => file.name)).toEqual(['0001_add_a.sql', '0002_add_b.sql']);
    expect(files[0]?.checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects two files with the same version number', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lavin-migrations-'));
    await writeFile(join(directory, '0001_add_a.sql'), 'SELECT 1;');
    await writeFile(join(directory, '0001_add_b.sql'), 'SELECT 1;');
    await expect(readMigrations(directory)).rejects.toThrow('share a version');
  });
});
