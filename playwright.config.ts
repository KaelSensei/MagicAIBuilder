import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // `list` alongside `html`: the HTML report is written inside the e2e
  // container, so until it is mounted out the only thing a reader ever sees is
  // stdout. A run that failed printed no failing test name at all.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Compiles every route segment once before the suite runs. The web server
    // is `next dev`, and a navigation landing mid-compile intermittently
    // renders against a stale next-intl context module ("context from
    // NextIntlClientProvider was not found") and aborts — see
    // docs/engineering/quality-gate.md. The default testMatch never picks
    // this file up (it is .setup.ts, not .spec.ts), so it runs only here.
    {
      name: "warmup",
      testMatch: /warmup\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["warmup"],
    },
  ],
  webServer: {
    command: "cross-env PLAYWRIGHT_TEST=1 pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300000,
  },
});
