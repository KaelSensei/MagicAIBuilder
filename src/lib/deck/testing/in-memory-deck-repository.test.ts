/**
 * Runs the deck repository contract against the in-memory fake, so the tests
 * that use the fake can trust it to behave like PostgreSQL.
 */
import { describe, expect, it } from "vitest";

import {
  describeDeckRepositoryContract,
  expectSeedsAsTheContractAssumes,
  newDeckCard,
  type DeckRepositoryHarness,
} from "./deck-repository-contract";
import { inMemoryDeckRepository } from "./in-memory-deck-repository";

/** @returns a harness on a new, empty fake */
function inMemoryHarness(): DeckRepositoryHarness {
  const fake = inMemoryDeckRepository();
  return {
    repository: fake,
    seedDeck: async (cards) => fake.seedDeck(cards),
    storedDeck: async (deckId) => fake.storedDeck(deckId),
  };
}

describe("in-memory deck repository — DeckRepository contract", () => {
  it("seeds a deck the way the contract cases assume", async () => {
    await expectSeedsAsTheContractAssumes(inMemoryHarness());
  });

  it("gives each harness its own decks, so no case sees another's rows", async () => {
    const seeded = await inMemoryHarness().seedDeck([newDeckCard("Sol Ring")]);

    expect(await inMemoryHarness().storedDeck(seeded.deckId)).toBeUndefined();
  });

  describeDeckRepositoryContract(inMemoryHarness);
});
