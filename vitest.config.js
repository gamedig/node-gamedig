import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'test/**',
        'dist/**',
        'tools/**',
        'examples/**',
        'bin/**',
        '*.config.js'
      ]
    },
    testTimeout: 5000
  }
})
