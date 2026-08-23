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
 * Create a fresh deck from the header "New Deck" button and land on the builder,
 * **interactive**.
 *
 * `waitForURL` alone returns the moment the client-side navigation commits the
 * address — well before the route is usable. The builder renders a transient
 * `!deck` branch ("Loading deck…") while the store syncs, and React is still
 * hydrating the freshly-pushed route. A click dispatched in that window can be
 * swallowed: the listener has attached and calls `preventDefault`, but the
 * router is not ready to act on it, so the native navigation is cancelled and
 * no client-side one replaces it. The page simply stays where it is.
 *
 * That is load-sensitive by construction, which matches the observed flake:
 * `back navigation returns to home` failed three times in a row on a loaded
 * host and passed on an idle one, its `toHaveURL` timing out while the address
 * never left `/builder/`.
 *
 * Waiting for the deck title bar's back arrow — which only exists on the
 * loaded branch — closes the store-sync half. `waitForLoadState("networkidle")`
 * closes the hydration half: the route's JS has been fetched and run.
 *
 * Same shape as the fix for the playtest flake (#466), which waited for a
 * seeded card rather than for the modal's frame.
 */
export async function openBuilder(page: Page): Promise<void> {
  await suppressOnboarding(page);
  await page.goto("/decks");
  // Strict, and a role rather than text. "New Deck" is also the default name of
  // every deck this helper creates, so once the account persists decks - which
  // it now does, since auth.setup.ts signs in as a real user - the text selector
  // resolves to the header button *and* every matching deck card. page.click
  // silently takes the first, so a run could open an existing deck, pass
  // waitForURL and its assertions, and create nothing at all.
  await page.getByRole("button", { name: "New Deck", exact: true }).click();
  await page.waitForURL(/\/builder\//);
  await page
    .getByRole("link", { name: "Back to my decks" })
    .waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
}

/**
 * Builds a syntactically valid Scryfall UUID for fixture cards.
 *
 * `addCardSchema` rejects anything that is not a UUID with a 400, so ad-hoc ids
 * like "test-card-1" silently produce an empty deck.
 *
 * @param n Index of the fixture card.
 * @returns A deterministic UUID unique to `n`.
 */
function fixtureScryfallId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/**
 * Create a deck owned by the Playwright user and fill it with fixture cards.
 *
 * Tests that need a non-empty deck cannot use {@link openBuilder}, which
 * creates an empty one — a playtest of an empty deck draws no cards at all.
 *
 * @param request Playwright API context bound to the app's baseURL.
 * @param cardCount How many cards to add.
 * @returns The seeded deck id.
 */
export async function seedDeckWithCards(
  request: APIRequestContext,
  cardCount: number
): Promise<string> {
  const created = await request.post("/api/decks", {
    data: { name: `Playtest Deck ${cardCount}`, format: "commander" },
  });
  if (!created.ok()) {
    throw new Error(`deck create failed: ${created.status()} ${await created.text()}`);
  }
  const { id } = (await created.json()) as { id: string };

  for (let i = 0; i < cardCount; i++) {
    const added = await request.post(`/api/decks/${id}/cards`, {
      data: {
        scryfallId: fixtureScryfallId(i),
        name: `Fixture Card ${i}`,
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Creature — Test",
        colorIdentity: ["G"],
        category: "creature",
        quantity: 1,
      },
    });
    if (!added.ok()) {
      throw new Error(`add card ${i} failed: ${added.status()} ${await added.text()}`);
    }
  }

  // Confirm the cards actually landed: a silently empty deck makes downstream
  // failures look like UI bugs.
  const loaded = await request.get(`/api/decks/${id}`);
  const deck = (await loaded.json()) as { cards?: readonly unknown[] };
  if ((deck.cards?.length ?? 0) !== cardCount) {
    throw new Error(
      `seeded deck holds ${deck.cards?.length ?? 0} cards, expected ${cardCount}`
    );
  }

  return id;
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
