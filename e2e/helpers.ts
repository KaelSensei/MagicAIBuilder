/**
 * Shared steps for the Playwright specs: page set-up, and the deck and card
 * calls that seed test data through the app's own API.
 *
 * The e2e Postgres volume is wiped between gate runs, so every test seeds what
 * it needs. Write calls work because `PLAYWRIGHT_TEST=1` bypasses auth on the
 * server. `fixtures.ts` wraps the deck calls in the `seededDeck` fixture, which
 * also deletes the deck after the test.
 *
 * @module e2e/helpers
 */
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
  await page.getByRole("banner").getByRole("button", { name: "New Deck", exact: true }).click();
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
 * One card row for `POST /api/decks/:id/cards`. A field left out takes the
 * route's default (`addCardSchema`): zone "main", quantity 1, category "other".
 */
export interface DeckCardSeed {
  /** A UUID: `addCardSchema` answers 400 to anything else. */
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost?: string;
  readonly cmc?: number;
  readonly typeLine?: string;
  readonly colorIdentity?: readonly string[];
  readonly category?: string;
  readonly quantity?: number;
  readonly zone?: "main" | "sideboard" | "maybeboard";
  readonly isCommander?: boolean;
  readonly imageUri?: string;
}

/** A Commander deck to seed: its name and the card rows it holds (none when omitted). */
export interface DeckSeed {
  readonly name: string;
  readonly cards?: readonly DeckCardSeed[];
}

/**
 * Retries for the teardown `DELETE` of a seeded deck, on a connection reset only.
 *
 * Why: the teardown is the `request` context's first call after the browser
 * phase. It reuses a keep-alive socket that has been idle for longer than the
 * dev server's keep-alive timeout (it answers `keep-alive: timeout=5`). When the
 * server closes that socket just as the `DELETE` is written on it, the call
 * fails with `read ECONNRESET` although the test itself passed. The gate failed
 * that way on `deck-open-retry.authed.spec.ts:27` on 2026-11-10 (audit TT-02).
 *
 * Playwright's `maxRetries` resends on a fresh socket after `ECONNRESET` only,
 * waiting 250 ms then 500 ms (playwright-core 1.65,
 * `APIRequestContext._sendRequestWithRetries`; documented at
 * https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-delete,
 * read 2026-11-11). It never retries an HTTP error status, and a server that
 * is down answers `ECONNREFUSED`, which still fails at once. So this adds no
 * test retry and cannot hide a broken route.
 *
 * Two, as TT-02 sets: the first resend covers the race; the second covers a
 * resend that meets a server still busy, as it was during the 2026-11-10
 * reset. The worst case adds 750 ms to a teardown.
 */
const TEARDOWN_MAX_RETRIES = 2;

/** Narrows a parsed JSON body to an object, so its fields can be read without a cast. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Builds `count` interchangeable one-mana green creatures named "Fixture Card 0",
 * "Fixture Card 1" and so on, for a test that needs a non-empty deck but no
 * particular card.
 *
 * @param count How many distinct cards; each is one row of quantity 1.
 * @returns The card rows, in name order.
 */
export function fixtureCards(count: number): readonly DeckCardSeed[] {
  return Array.from({ length: count }, (_, index) => ({
    scryfallId: fixtureScryfallId(index),
    name: `Fixture Card ${index}`,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature — Test",
    colorIdentity: ["G"],
    category: "creature",
    quantity: 1,
  }));
}

/**
 * Creates an empty Commander deck owned by the Playwright user.
 *
 * @param request Playwright API context bound to the app's baseURL.
 * @param name The deck name shown in the builder and the deck list.
 * @returns The new deck's id.
 * @throws Error when the API refuses the deck or answers without an id.
 */
export async function createDeckThroughApi(
  request: APIRequestContext,
  name: string
): Promise<string> {
  const created = await request.post("/api/decks", {
    data: { name, format: "commander" },
  });
  if (!created.ok()) {
    throw new Error(
      `deck create failed: ${created.status()} ${await created.text()}`
    );
  }
  const body: unknown = await created.json();
  if (!isRecord(body) || typeof body.id !== "string") {
    throw new Error("deck create response did not include an id");
  }
  return body.id;
}

/**
 * Adds card rows to a deck, then checks that the deck holds exactly that many.
 *
 * The final check exists because a silently short deck makes the failures
 * further down look like UI bugs.
 *
 * @param request Playwright API context bound to the app's baseURL.
 * @param deckId A deck the Playwright user owns.
 * @param cards The rows to add, in order.
 * @throws Error when a card is refused, or the deck then holds another number of rows.
 */
export async function addCardsThroughApi(
  request: APIRequestContext,
  deckId: string,
  cards: readonly DeckCardSeed[]
): Promise<void> {
  for (const [index, card] of cards.entries()) {
    const added = await request.post(`/api/decks/${deckId}/cards`, {
      data: card,
    });
    if (!added.ok()) {
      throw new Error(
        `add card ${index} failed: ${added.status()} ${await added.text()}`
      );
    }
  }

  const loaded = await request.get(`/api/decks/${deckId}`);
  if (!loaded.ok()) {
    throw new Error(
      `seeded deck load failed: ${loaded.status()} ${await loaded.text()}`
    );
  }
  const deck: unknown = await loaded.json();
  const held =
    isRecord(deck) && Array.isArray(deck.cards) ? deck.cards.length : 0;
  if (held !== cards.length) {
    throw new Error(
      `seeded deck holds ${held} cards, expected ${cards.length}`
    );
  }
}

/**
 * Deletes a deck after its test, resending once or twice if the connection
 * resets (see {@link TEARDOWN_MAX_RETRIES}).
 *
 * A 404 counts as deleted: the deck is gone, whether a reset hid the answer to
 * a first attempt the server did handle, or the test deleted the deck itself.
 *
 * @param request Playwright API context bound to the app's baseURL.
 * @param deckId The deck to delete.
 * @throws Error on any other error status, or when every attempt resets.
 */
export async function deleteDeckThroughApi(
  request: APIRequestContext,
  deckId: string
): Promise<void> {
  const deleted = await request.delete(`/api/decks/${deckId}`, {
    maxRetries: TEARDOWN_MAX_RETRIES,
  });
  if (deleted.ok() || deleted.status() === 404) return;
  throw new Error(
    `deck delete failed: ${deleted.status()} ${await deleted.text()}`
  );
}

/**
 * Create a deck owned by the Playwright user and fill it with fixture cards.
 *
 * Tests that need a non-empty deck cannot use {@link openBuilder}, which
 * creates an empty one — a playtest of an empty deck draws no cards at all.
 * The deck is not deleted afterwards; a test that wants that uses the
 * `seededDeck` fixture from `fixtures.ts` with {@link fixtureCards}.
 *
 * @param request Playwright API context bound to the app's baseURL.
 * @param cardCount How many cards to add.
 * @returns The seeded deck id.
 */
export async function seedDeckWithCards(
  request: APIRequestContext,
  cardCount: number
): Promise<string> {
  const deckId = await createDeckThroughApi(
    request,
    `Playtest Deck ${cardCount}`
  );
  await addCardsThroughApi(request, deckId, fixtureCards(cardCount));
  return deckId;
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
