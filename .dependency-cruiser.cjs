/** Module boundaries (AGENTS.md §4): other code may import only a module's or package's index.ts. */
module.exports = {
  forbidden: [
    {
      name: 'no-api-module-internals',
      comment: 'Import another API module only through its index.ts.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/[^/]+/(?!index\\.ts$)',
        pathNot: '^apps/api/src/modules/$1/',
      },
    },
    {
      name: 'no-workspace-package-internals',
      comment: 'Import another workspace package only through its src/index.ts.',
      severity: 'error',
      from: { path: '^(apps|services|packages)/([^/]+)/' },
      to: {
        path: '^(apps|services|packages)/[^/]+/(?!src/index\\.ts$)',
        pathNot: '^$1/$2/',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|\\.next|dist|coverage)' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    tsPreCompilationDeps: true,
  },
};
