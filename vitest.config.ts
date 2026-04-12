import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@zwift-log-parser/core': path.resolve(__dirname, 'core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['{core,cli}/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
    },
  },
});
