import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Each test file gets a clean module state so OpenFeature's global
    // provider registration in one file never leaks into another.
    isolate: true,
    include: ['test/**/*.test.ts'],
    testTimeout: 15000,
    reporters: 'verbose',
  },
});
