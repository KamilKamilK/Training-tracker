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
