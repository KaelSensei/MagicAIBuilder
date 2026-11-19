/**
 * The snapshot use cases on the in-memory store: list, save, delete and
 * restore a deck's saved versions, with the results the snapshot routes map
 * to status codes. The routes' own suites pin the HTTP side.
 */
import { describe, expect, it } from "vitest";

import { makeSnapshotUseCases } from "@/lib/deck/snapshot-use-cases";
import { inMemorySnapshotStore } from "@/lib/deck/testing/in-memory-snapshot-store";
import { deckCard } from "@/test/playtest-db-fake";

const DECK = { id: "deck-1", commanderId: "card-atraxa" };

const ATRAXA = deckCard("Atraxa, Praetors' Voice", { isCommander: true });
const SOL_RING = deckCard("Sol Ring", { notes: "Turn-one play" });
const FORESTS = deckCard("Forest", { quantity: 10, zone: "sideboard" });
const ARCANE_SIGNET = deckCard("Arcane Signet");

/** @returns the use cases over a fresh fake holding Atraxa, Sol Ring and ten Forests */
function setUp() {
  const fake = inMemorySnapshotStore(DECK, [ATRAXA, SOL_RING, FORESTS]);
  return { fake, snapshots: makeSnapshotUseCases(fake.snapshots) };
}

describe("listSnapshots", () => {
  it("lists the deck's snapshots newest first, without their card lists", async () => {
    const { snapshots } = setUp();
    await snapshots.saveSnapshot({ deckId: DECK.id, rawName: "First" });
    await snapshots.saveSnapshot({ deckId: DECK.id, rawName: "Second" });

    const listed = await snapshots.listSnapshots(DECK.id);

    expect(listed.map((snapshot) => snapshot.name)).toEqual([
      "Second",
      "First",
    ]);
    expect(listed[0]).not.toHaveProperty("cardList");
  });
});

describe("saveSnapshot", () => {
  it("stores the deck's saved card rows under the cleaned name", async () => {
    const { fake, snapshots } = setUp();

    const result = await snapshots.saveSnapshot({
      deckId: DECK.id,
      rawName: " <b>Before</b> the cuts ",
    });

    expect(result).toEqual({
      kind: "saved",
      snapshot: expect.objectContaining({
        deckId: DECK.id,
        name: "Before the cuts",
        commander: "Atraxa, Praetors' Voice",
        cardCount: 3,
        cardList: [ATRAXA, SOL_RING, FORESTS],
      }),
    });
    expect(fake.storedSnapshots()).toHaveLength(1);
  });

  it("cuts the name to 100 characters", async () => {
    const { snapshots } = setUp();

    const result = await snapshots.saveSnapshot({
      deckId: DECK.id,
      rawName: "x".repeat(150),
    });

    expect(result.kind === "saved" && result.snapshot.name).toBe(
      "x".repeat(100)
    );
  });

  it("refuses a name that is blank once its tags are stripped, before reading the deck", async () => {
    const { fake, snapshots } = setUp();
    fake.deleteDeck();

    const result = await snapshots.saveSnapshot({
      deckId: DECK.id,
      rawName: " <i></i> ",
    });

    expect(result).toEqual({ kind: "blank-name" });
    expect(fake.storedSnapshots()).toEqual([]);
  });

  it("answers deck-not-found when the deck is gone, and stores nothing", async () => {
    const { fake, snapshots } = setUp();
    fake.deleteDeck();

    const result = await snapshots.saveSnapshot({
      deckId: DECK.id,
      rawName: "Before the cuts",
    });

    expect(result).toEqual({ kind: "deck-not-found" });
    expect(fake.storedSnapshots()).toEqual([]);
  });
});

describe("deleteSnapshot", () => {
  it("deletes a snapshot of the deck", async () => {
    const { fake, snapshots } = setUp();
    await snapshots.saveSnapshot({ deckId: DECK.id, rawName: "Doomed" });
    const [{ id }] = fake.storedSnapshots();

    const result = await snapshots.deleteSnapshot({
      deckId: DECK.id,
      snapshotId: id,
    });

    expect(result).toEqual({ kind: "deleted" });
    expect(fake.storedSnapshots()).toEqual([]);
  });

  it("answers snapshot-not-found for another deck's snapshot, and deletes nothing", async () => {
    const { fake, snapshots } = setUp();
    const other = await fake.snapshots.create({
      deckId: "deck-2",
      name: "Not yours",
      cardList: [],
      commander: null,
      cardCount: 0,
    });

    const result = await snapshots.deleteSnapshot({
      deckId: DECK.id,
      snapshotId: other.id,
    });

    expect(result).toEqual({ kind: "snapshot-not-found" });
    expect(fake.storedSnapshots()).toHaveLength(1);
  });
});

describe("restoreSnapshot", () => {
  it("puts the snapshot's card rows back, zones and notes included, and answers the deck", async () => {
    const { fake, snapshots } = setUp();
    await snapshots.saveSnapshot({ deckId: DECK.id, rawName: "Before" });
    const [{ id }] = fake.storedSnapshots();
    fake.saveCards([ATRAXA, ARCANE_SIGNET]);

    const result = await snapshots.restoreSnapshot({
      deckId: DECK.id,
      snapshotId: id,
    });

    const restored = fake.savedCards();
    expect(restored.map((card) => card.name)).toEqual([
      "Atraxa, Praetors' Voice",
      "Sol Ring",
      "Forest",
    ]);
    expect(restored[2]).toEqual(
      expect.objectContaining({ zone: "sideboard", quantity: 10 })
    );
    expect(restored[1]).toEqual(
      expect.objectContaining({ notes: "Turn-one play" })
    );
    expect(result).toEqual({
      kind: "restored",
      deck: expect.objectContaining({ id: DECK.id, cards: restored }),
    });
  });

  it("answers snapshot-not-found and leaves the deck as it is", async () => {
    const { fake, snapshots } = setUp();

    const result = await snapshots.restoreSnapshot({
      deckId: DECK.id,
      snapshotId: "missing",
    });

    expect(result).toEqual({ kind: "snapshot-not-found" });
    expect(fake.savedCards()).toEqual([ATRAXA, SOL_RING, FORESTS]);
  });

  it("throws on a malformed card list before touching the deck", async () => {
    const { fake, snapshots } = setUp();
    const broken = await fake.snapshots.create({
      deckId: DECK.id,
      name: "Broken",
      cardList: { not: "a list" },
      commander: null,
      cardCount: 0,
    });

    await expect(
      snapshots.restoreSnapshot({ deckId: DECK.id, snapshotId: broken.id })
    ).rejects.toThrow("Snapshot card list is not an array");
    expect(fake.savedCards()).toEqual([ATRAXA, SOL_RING, FORESTS]);
  });
});
