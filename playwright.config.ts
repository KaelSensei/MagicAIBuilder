import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/storage-state";

/**
 * The server Playwright drives. The Docker E2E stack (docker-compose.e2e.yml)
 * runs `next build` first and sets `E2E_DEVELOPMENT_BUILD=1`, so it serves that
 * build; a local `pnpm test:e2e` starts `next dev`, which compiles each route
 * on its first request.
 */
const WEB_SERVER_COMMAND =
  process.env.E2E_DEVELOPMENT_BUILD === "1"
    ? "pnpm exec next start"
    : "cross-env NODE_OPTIONS=--max-old-space-size=4096 PLAYWRIGHT_TEST=1 pnpm dev";

export default defineConfig({
  testDir: "./e2e",

  // The suite runs in the Docker stack of docker-compose.e2e.yml, from the
  // pre-push gate and from .github/workflows/e2e.yml. The container does not
  // set `CI`, so every setting keyed on `process.env.CI` was dead code that
  // never once took its intended value. They are stated outright below rather
  // than inferred from a variable the suite never sees.
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
    // Compiles every route segment once before the suite runs. Under
    // `next dev`, a navigation landing mid-compile intermittently renders
    // against a stale next-intl context module ("context from
    // NextIntlClientProvider was not found") and aborts — see
    // docs/engineering/quality-gate.md. Against the prebuilt server of the
    // Docker stack it only checks that every segment answers. The default
    // testMatch never picks this file up (it is .setup.ts, not .spec.ts), so
    // it runs only here.
    {
      name: "warmup",
      testMatch: /warmup\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      // Anything ending in .authed.spec.ts belongs to the signed-in project
      // below; without this it would run here too, with no session.
      testIgnore: /.*\.authed\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["warmup"],
    },
    // Signs in once and saves the browser state. PLAYWRIGHT_TEST=1 bypasses
    // auth server-side only, so without a real session every client-gated
    // screen renders its signed-out branch forever — which is why the deck
    // list flow was a permanent test.skip.
    {
      name: "auth",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["warmup"],
    },
    {
      name: "authenticated",
      testMatch: /.*\.authed\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["auth"],
    },
  ],
  webServer: {
    command: WEB_SERVER_COMMAND,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300000,
  },
});
