/**
 * Playwright fixtures shared by the e2e specs. Specs that use them import
 * `test` and `expect` from here instead of from `@playwright/test`.
 *
 * `seededDeck` owns the life of the decks a test seeds: it creates them through
 * the app's API and deletes them when the test ends, passed or failed. Specs
 * therefore need no `try { … } finally { request.delete(…) }`, and the teardown
 * survives the connection reset that used to fail it (audit TT-02; the retry
 * policy is documented on `IDEMPOTENT_MAX_RETRIES` in `helpers.ts`).
 *
 * `seededCollection` does the same for the Playwright user's collection, by
 * card name: the collection is one per account, so a row a test adds through
 * the page would otherwise outlive it and change what the next test sees.
 *
 * `scryfallStandIn` runs for every test of this `test`: when the stack sets
 * `SCRYFALL_API_BASE_URL`, the browser's requests to api.scryfall.com are
 * forwarded to that address, the stand-in the server already talks to
 * (`scryfall-stand-in.ts`). Browser code cannot read the variable, and the
 * E2E container resolves api.scryfall.com to nowhere, so without this fixture
 * every on-page Scryfall call would fail. A spec's own `page.route` for a
 * Scryfall URL still wins: Playwright tries the last registered route first.
 *
 * @module e2e/fixtures
 */
import { test as base, type BrowserContext } from "@playwright/test";
import {
  addCardsThroughApi,
  addCollectionCardThroughApi,
  createDeckThroughApi,
  deleteCollectionCardsThroughApi,
  deleteDeckThroughApi,
  type CollectionCardSeed,
  type DeckSeed,
} from "./helpers";

/** The decks one test seeds. Each is deleted after the test, in creation order. */
export interface SeededDecks {
  /**
   * Creates a Commander deck owned by the Playwright user, adds `seed.cards`
   * and returns the deck's id.
   *
   * The deck is booked for deletion as soon as it exists, so a card that fails
   * to seed leaves no deck behind.
   *
   * @throws Error when the API refuses the deck or a card, or the deck then
   *   holds another number of rows.
   */
  readonly create: (seed: DeckSeed) => Promise<string>;
  /**
   * Books for deletion after the test a deck the test created another way, for
   * example through the builder's "New Deck" button.
   */
  readonly adopt: (deckId: string) => void;
}

/** The collection rows one test owns. Rows with these names are deleted after the test. */
export interface SeededCollection {
  /**
   * Adds a card to the collection through the API and books its name for
   * deletion.
   *
   * @throws Error when the API refuses the row.
   */
  readonly add: (card: CollectionCardSeed) => Promise<void>;
  /**
   * Books for deletion every collection row of that name, for a card the test
   * adds another way, for example through the "Add Card" dialog. Call it before
   * the add, so a test that fails midway still cleans up.
   */
  readonly adoptName: (name: string) => void;
}

/** Fixtures this module adds to Playwright's built-in ones. */
interface E2eFixtures {
  readonly seededDeck: SeededDecks;
  readonly seededCollection: SeededCollection;
  /** Automatic; see the module header. */
  readonly scryfallStandIn: void;
}

/** The browser's Scryfall origin, which `src/lib/scryfall/constants.ts` fixes. */
const BROWSER_SCRYFALL_API = "https://api.scryfall.com";

/**
 * Forwards every request the context sends to api.scryfall.com to the
 * stand-in at `standInOrigin`, same method, path, query and body, and
 * fulfills it with the stand-in's answer. Only the two headers Scryfall
 * requires travel; the browser's others are meaningless to the stand-in.
 */
async function forwardScryfallTo(
  context: BrowserContext,
  standInOrigin: string
): Promise<void> {
  await context.route(`${BROWSER_SCRYFALL_API}/**`, async (route) => {
    const request = route.request();
    const { pathname, search } = new URL(request.url());
    const headers = request.headers();
    const body = request.postDataBuffer();
    const answer = await fetch(`${standInOrigin}${pathname}${search}`, {
      method: request.method(),
      headers: {
        accept: headers["accept"] ?? "application/json",
        "content-type": headers["content-type"] ?? "application/json",
      },
      body: body === null ? undefined : new Uint8Array(body),
    });
    await route.fulfill({
      status: answer.status,
      contentType: answer.headers.get("content-type") ?? "application/json",
      body: Buffer.from(await answer.arrayBuffer()),
    });
  });
}

/** Playwright's `test`, extended with {@link SeededDecks} as `seededDeck`. */
export const test = base.extend<E2eFixtures>({
  scryfallStandIn: [
    async ({ context }, provide) => {
      const standInOrigin = process.env.SCRYFALL_API_BASE_URL;
      if (standInOrigin) await forwardScryfallTo(context, standInOrigin);
      await provide();
    },
    { auto: true },
  ],
  // `provide` is Playwright's `use` callback. It is renamed because the React
  // Hooks lint rule reads any call to `use(…)` as React's `use` hook.
  seededDeck: async ({ request }, provide) => {
    // A Set: adopting a deck twice must not send a second DELETE.
    const deckIds = new Set<string>();

    await provide({
      create: async (seed) => {
        const deckId = await createDeckThroughApi(request, seed.name);
        deckIds.add(deckId);
        await addCardsThroughApi(request, deckId, seed.cards ?? []);
        return deckId;
      },
      adopt: (deckId) => {
        deckIds.add(deckId);
      },
    });

    for (const deckId of deckIds) {
      await deleteDeckThroughApi(request, deckId);
    }
  },
  seededCollection: async ({ request }, provide) => {
    const names = new Set<string>();

    await provide({
      add: async (card) => {
        names.add(card.name);
        await addCollectionCardThroughApi(request, card);
      },
      adoptName: (name) => {
        names.add(name);
      },
    });

    await deleteCollectionCardsThroughApi(request, names);
  },
});

export { expect } from "@playwright/test";
