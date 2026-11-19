/**
 * Which snapshot a recorded playtest is filed under, on the in-memory store:
 * a snapshot that already holds the deck as saved, or a new one named after
 * the run. The playtest route's deck-version suite pins the same journeys
 * through HTTP.
 */
import { describe, expect, it } from "vitest";

import { forEachSequential } from "@/lib/async/sequential";
import {
  playtestSnapshotName,
  snapshotOfSavedDeck,
  VERSION_MATCH_WINDOW,
} from "@/lib/deck/snapshot-of-saved-deck";
import { inMemorySnapshotStore } from "@/lib/deck/testing/in-memory-snapshot-store";
import { deckCard } from "@/test/playtest-db-fake";

const DECK = { id: "deck-1", commanderId: "card-atraxa" };
const RECORDED_AT = new Date("2026-11-09T14:32:45Z");

const VERSION_ONE = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Sol Ring"),
];
const VERSION_TWO = [
  deckCard("Atraxa, Praetors' Voice", { isCommander: true }),
  deckCard("Arcane Signet"),
];

describe("snapshotOfSavedDeck", () => {
  it("creates a snapshot of the saved deck, named after the run, when none holds it", async () => {
    const fake = inMemorySnapshotStore(DECK, VERSION_ONE);

    const id = await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);

    expect(fake.storedSnapshots()).toEqual([
      expect.objectContaining({
        id,
        deckId: DECK.id,
        name: "Playtest · 2026-11-09 14:32 UTC",
        commander: "Atraxa, Praetors' Voice",
        cardCount: 2,
        cardList: VERSION_ONE,
      }),
    ]);
  });

  it("reuses the snapshot that already holds the deck as saved", async () => {
    const fake = inMemorySnapshotStore(DECK, VERSION_ONE);
    const first = await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);

    const second = await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);

    expect(second).toBe(first);
    expect(fake.storedSnapshots()).toHaveLength(1);
  });

  it("files a reverted deck under the earlier version's snapshot", async () => {
    const fake = inMemorySnapshotStore(DECK, VERSION_ONE);
    const first = await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);
    fake.saveCards(VERSION_TWO);
    await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);
    fake.saveCards(VERSION_ONE);

    expect(await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT)).toBe(
      first
    );
    expect(fake.storedSnapshots()).toHaveLength(2);
  });

  it("compares only the most recent snapshots, so an older match gets a fresh snapshot", async () => {
    const fake = inMemorySnapshotStore(DECK, VERSION_ONE);
    const oldest = await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);
    const newerVersions = Array.from(
      { length: VERSION_MATCH_WINDOW },
      (_, index) => [deckCard("Forest", { quantity: index + 2 })]
    );
    await forEachSequential(newerVersions, (cards) => {
      fake.saveCards(cards);
      return snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);
    });
    fake.saveCards(VERSION_ONE);

    const id = await snapshotOfSavedDeck(fake.versions, DECK, RECORDED_AT);

    expect(id).not.toBe(oldest);
    expect(fake.storedSnapshots()).toHaveLength(VERSION_MATCH_WINDOW + 2);
  });
});

describe("playtestSnapshotName", () => {
  it("reads the same in every locale: the untranslated label and a UTC minute", () => {
    expect(playtestSnapshotName(RECORDED_AT)).toBe(
      "Playtest · 2026-11-09 14:32 UTC"
    );
  });
});
