import type { APIRequestContext, Page } from "@playwright/test";

/** localStorage key the app uses to remember the first-run onboarding was dismissed */
const ONBOARDING_LS_KEY = "mab-onboarding-done";

/**
 * Suppress the first-run onboarding wizard for the whole test.
 *
 * For unauthenticated clients (which is what the e2e harness is — auth is only
 * bypassed server-side) the wizard's "done" flag lives in localStorage. Seeding
 * it before any navigation keeps the wizard — whose backdrop intercepts pointer
 * events — from ever mounting. Must be called before the first `page.goto`.
 */
export async function suppressOnboarding(page: Page): Promise<void> {
  await page.addInitScript(
    ([key]) => {
      try {
        window.localStorage.setItem(key, "true");
      } catch {
        // localStorage may be unavailable — nothing to do
      }
    },
    [ONBOARDING_LS_KEY]
  );
}

/**
 * Create a fresh deck from the header "New Deck" button and land on the builder.
 */
export async function openBuilder(page: Page): Promise<void> {
  await suppressOnboarding(page);
  await page.goto("/decks");
  await page.click("text=New Deck");
  await page.waitForURL(/\/builder\//);
}

/**
 * A public deck plus the profile slug of the Playwright user who owns it.
 */
export interface PublicDeckFixture {
  readonly deckId: string;
  readonly username: string;
  readonly deckName: string;
}

/**
 * Seed a public deck owned by the Playwright user, via the app's own API.
 *
 * The e2e Postgres volume is wiped between runs, so nothing exists up front.
 * Write requests work because `PLAYWRIGHT_TEST=1` bypasses auth **server-side**
 * — the same reason browser-side authenticated flows do not work here. Public
 * deck and profile pages need no session at all, so they are readable from a
 * plain anonymous page context afterwards.
 *
 * @param request Playwright API context bound to the app's baseURL.
 * @param username Profile slug to claim; must be unique per test file.
 * @returns The seeded deck id, owner slug, and deck name.
 */
export async function seedPublicDeck(
  request: APIRequestContext,
  username: string
): Promise<PublicDeckFixture> {
  const claimed = await request.patch("/api/user/username", {
    data: { username },
  });
  if (!claimed.ok()) {
    throw new Error(`username claim failed: ${claimed.status()} ${await claimed.text()}`);
  }

  const deckName = `Public Deck ${username}`;
  const created = await request.post("/api/decks", {
    data: { name: deckName, format: "commander", targetBracket: 3 },
  });
  if (!created.ok()) {
    throw new Error(`deck create failed: ${created.status()} ${await created.text()}`);
  }
  const deck = (await created.json()) as { id: string };

  const published = await request.patch(`/api/decks/${deck.id}`, {
    data: { isPublic: true },
  });
  if (!published.ok()) {
    throw new Error(`publish failed: ${published.status()} ${await published.text()}`);
  }

  return { deckId: deck.id, username: username.toLowerCase(), deckName };
}
