import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/nlp/rel-extract.test.ts'],

    testTimeout: 120000,
    hookTimeout: 120000,
    pool: 'forks',
    execArgv: ['--max-old-space-size=1536'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/cli/**', 'src/types/**'],
    },
  },
});
