import { defineConfig } from '@playwright/test'

// We use Synpress's ethereum-wallet-mock fixture, which injects window.ethereum
// via addInitScript — no browser extension, so headed mode isn't required.
// Default to headless for CI / unattended runs; opt in to headed with the
// `test:e2e:headed` script for local debugging.
const PORT = Number(process.env.E2E_PORT ?? 3100)

export default defineConfig({
  testDir: './test/e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // The dev server runs on its own port so it doesn't collide with a
  // developer's local server on 3000.
  webServer: {
    command: `bun run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
