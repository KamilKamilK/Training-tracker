import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run the production build (`vite build --mode e2e`) against the Firebase
// emulators, so they catch failures that only appear after bundling. Start them with
// `npm run test:e2e`, which also starts the emulators.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Optional path to a preinstalled Chromium; without it Playwright uses its own download.
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined },
      },
    },
  ],
  webServer: {
    command:
      'vite build --mode e2e --outDir dist-e2e && vite preview --mode e2e --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
