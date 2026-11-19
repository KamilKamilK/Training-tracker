import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({ disable: true })],
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
          // Component tests in jsdom are CPU-bound (0.1–0.4 s alone) and Vitest runs a worker per
          // core, so the suite itself fills the processor. With a parallel build or another load the
          // longer form tests pass 5 s, although nothing in them waits or hangs.
          testTimeout: 15_000,
        },
      },
      {
        // Vercel functions in api/ run in Node.js, without the browser APIs of jsdom.
        extends: true,
        test: {
          name: 'api',
          environment: 'node',
          include: ['tests/api/**/*.test.ts'],
        },
      },
    ],
  },
})
