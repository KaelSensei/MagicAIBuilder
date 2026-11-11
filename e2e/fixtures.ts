/**
 * Playwright fixtures shared by the e2e specs. Specs that use them import
 * `test` and `expect` from here instead of from `@playwright/test`.
 *
 * `seededDeck` owns the life of the decks a test seeds: it creates them through
 * the app's API and deletes them when the test ends, passed or failed. Specs
 * therefore need no `try { … } finally { request.delete(…) }`, and the teardown
 * survives the connection reset that used to fail it (audit TT-02; the retry
 * policy is documented on `TEARDOWN_MAX_RETRIES` in `helpers.ts`).
 *
 * @module e2e/fixtures
 */
import { test as base } from "@playwright/test";
import {
  addCardsThroughApi,
  createDeckThroughApi,
  deleteDeckThroughApi,
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

/** Fixtures this module adds to Playwright's built-in ones. */
interface E2eFixtures {
  readonly seededDeck: SeededDecks;
}

/** Playwright's `test`, extended with {@link SeededDecks} as `seededDeck`. */
export const test = base.extend<E2eFixtures>({
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
});

export { expect } from "@playwright/test";
