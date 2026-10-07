import {
  defineConfig,
} from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.js',
    ],

    environment:
      'node',

    clearMocks:
      true,

    coverage: {
      provider:
        'v8',

      include: [
        'src/api/conflicts.js',
      ],

      reporter: [
        'text',
        'lcov',
      ],

      reportsDirectory:
        'coverage-conflict-web',
    },
  },
});