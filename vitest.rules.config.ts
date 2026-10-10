import { defineConfig } from 'vitest/config'

// Runs against the Firestore emulator started by `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 15000,
    fileParallelism: false,
  },
})
