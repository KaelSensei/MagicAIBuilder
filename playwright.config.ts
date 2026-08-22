import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  // The e2e suite runs in exactly one place: the Dockerised pre-push gate in
  // docker-compose.e2e.yml. **No GitHub workflow runs Playwright**, and that
  // container does not set `CI` — so every setting keyed on `process.env.CI`
  // was dead code that never once took its intended value. They are stated
  // outright below rather than inferred from a variable nothing sets.
  fullyParallel: true,

  // A stray `test.only` must never pass the gate. Keyed on `CI`, this was
  // never enforced: one `.only` would have narrowed the run to a single test
  // and still reported green — the same shape as the hardcoded
  // `PLAYWRIGHT_SPEC` that once ran 1 of 8 spec files while reporting a full
  // green.
  forbidOnly: true,

  // **Deliberately 0, and left that way.** docs/engineering/quality-gate.md:
  // "adding retries would stop a known intermittent failure from blocking,
  // which is the sort of quiet loosening this gate has already been fixed for
  // twice. Fix the flake, do not pad the gate."
  retries: 0,

  // One worker, because contention *is* the flake. Measured 2026-08-22 on the
  // same 58 tests: 8–13s each under parallel load against ~2.5s each serially,
  // a fourfold inflation. Total wall clock rises only from 1m36 to 2m24, and
  // the load-sensitivity the gate doc has been chasing since #495 goes with
  // it. That is fixing the flake rather than padding the gate.
  workers: 1,
  // `list` alongside `html`: the HTML report is written inside the e2e
  // container, so until it is mounted out the only thing a reader ever sees is
  // stdout. A run that failed printed no failing test name at all.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    // `on-first-retry` can never fire while retries are 0, which is why the
    // only forensic artifact a gate failure has ever produced is an aria
    // snapshot — no network log, no DOM timeline. This captures a trace for a
    // failing test without adding retries.
    trace: "retain-on-failure",
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
