/**
 * Runs the deck repository contract against the in-memory fake, so the tests
 * that use the fake can trust it to behave like PostgreSQL.
 */
import { describe } from "vitest";

import { describeDeckRepositoryContract } from "./deck-repository-contract";
import { inMemoryDeckRepository } from "./in-memory-deck-repository";

describe("in-memory deck repository — DeckRepository contract", () => {
  describeDeckRepositoryContract(() => {
    const fake = inMemoryDeckRepository();
    return {
      repository: fake,
      seedDeck: async (cards) => fake.seedDeck(cards),
      storedDeck: async (deckId) => fake.storedDeck(deckId),
    };
  });
});
