import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE } from "./storage-state";
import { suppressOnboarding } from "./helpers";

const ACCOUNT = {
  name: "Playwright Session",
  email: "playwright-session@test.local",
  password: "playwright-session-password",
} as const;

/**
 * Signs in for real, once, and saves the browser state.
 *
 * `PLAYWRIGHT_TEST=1` bypasses auth **server-side only** — `requireAuth`
 * resolves a user and `authorized()` returns true — so every API call succeeds
 * while the browser holds no NextAuth session at all. Any screen gated on the
 * *client* session therefore never renders: `decks/page.tsx` returns early
 * unless `sessionStatus === "authenticated"`, so the deck list sat on
 * "Loading…" forever and the test that asserted on it was skipped for months.
 * Its neighbour asserted on the same list and was only shallowly green.
 *
 * The account is created through the app's own signup route and the session
 * through the app's own sign-in form — no test-only branch in production code,
 * and the credentials path gets exercised on every run as a side effect.
 */
setup("authenticate", async ({ page, request }) => {
  // 409 means a previous run already created it; the volume outlives a single
  // `playwright test` even though the gate starts from a cold one.
  const created = await request.post("/api/auth/signup", { data: ACCOUNT });
  expect(
    created.ok() || created.status() === 409,
    await created.text()
  ).toBe(true);

  // The onboarding dialog mounts over every page for a first-time visitor and
  // its backdrop swallows the click on the submit button.
  await suppressOnboarding(page);
  await page.goto("/auth/signin");
  await page.fill("#email", ACCOUNT.email);
  await page.fill("#password", ACCOUNT.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  // The form redirects with `location.href`, so the URL change is the signal
  // that the credentials call came back without an error.
  await page.waitForURL(/\/decks$/);
  await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();

  // suppressOnboarding only covers the signed-OUT path: useOnboarding reads the
  // localStorage flag for anonymous visitors and `user.onboardingDone` from the
  // database for everyone else. So the wizard mounts for this account whatever
  // localStorage says, and its backdrop swallows every click on the pages below.
  // Marking it done through the app own route is the signed-in equivalent.
  const onboarded = await page.request.post("/api/user/onboarding");
  expect(onboarded.ok(), await onboarded.text()).toBe(true);

  await page.context().storageState({ path: STORAGE_STATE });
});
