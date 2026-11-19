/**
 * Runs the snapshot port contracts against the in-memory fake, so the
 * use-case tests that rely on it rely on the same promises as the Prisma
 * adapter keeps.
 */
import { describe, expect, it } from "vitest";

import {
  DECK_VERSION_STORE_CONTRACT_CASES,
  SNAPSHOT_STORE_CONTRACT_CASES,
  type SnapshotStoreHarness,
} from "@/lib/deck/testing/snapshot-store-contract";
import { inMemorySnapshotStore } from "@/lib/deck/testing/in-memory-snapshot-store";
import type { FakeDeckCard } from "@/test/playtest-db-fake";

const DECK = { id: "deck-1", commanderId: null };

/** @returns both fake ports over a deck that holds `cards` */
function harness(cards: readonly FakeDeckCard[]): SnapshotStoreHarness {
  const fake = inMemorySnapshotStore(DECK, cards);
  return {
    deckId: DECK.id,
    snapshots: fake.snapshots,
    versions: fake.versions,
  };
}

describe("in-memory snapshot store", () => {
  describe("SnapshotStore contract", () => {
    for (const contractCase of SNAPSHOT_STORE_CONTRACT_CASES) {
      it(contractCase.name, async () => {
        await expect(
          contractCase.run(harness(contractCase.deckCards))
        ).resolves.toBeUndefined();
      });
    }
  });

  describe("DeckVersionStore contract", () => {
    for (const contractCase of DECK_VERSION_STORE_CONTRACT_CASES) {
      it(contractCase.name, async () => {
        await expect(
          contractCase.run(harness(contractCase.deckCards))
        ).resolves.toBeUndefined();
      });
    }
  });
});
