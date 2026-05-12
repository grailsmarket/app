import { defineConfig } from '@playwright/test'

// Synpress requires headed Chromium — the MetaMask extension can't load via
// the headless Chromium build. We force `headless: false` here rather than
// relying on `--headed`, so any invocation (CI, local, IDE-runner) gets the
// right mode without needing to remember the flag. Set PLAYWRIGHT_HEADED=0
// to opt back into headless ONLY for debugging non-wallet tests.
const PORT = Number(process.env.E2E_PORT ?? 3100)
const HEADLESS = process.env.PLAYWRIGHT_HEADED === '0'

export default defineConfig({
  testDir: './test/e2e',
  // The MetaMask flow is interactive and benefits from a generous timeout.
  // Wallet cache is built in advance so we don't pay seed-import cost per test.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Synpress doesn't support parallelism out of the box (each MetaMask
  // context is tied to a cached profile dir); run serially for now.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // The dev server is started by `bun run dev` against a separate port so
  // we don't collide with a developer's local server on 3000.
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
    headless: HEADLESS,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
