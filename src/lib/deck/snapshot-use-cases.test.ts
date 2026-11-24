/**
 * The snapshot use cases on the in-memory store: list, save, delete and
 * restore a deck's saved versions, with the results the snapshot routes map
 * to status codes. The routes' own suites pin the HTTP side.
 */
import { describe, expect, it } from "vitest";

import { makeSnapshotUseCases } from "@/lib/deck/snapshot-use-cases";
import { inMemorySnapshotStore } from "@/lib/deck/testing/in-memory-snapshot-store";
import { deckCard } from "@/test/playtest-db-fake";

const DECK = {
  id: "deck-1",
  commanderId: "card-atraxa",
  commanderName: "Atraxa, Praetors' Voice",
  partnerId: null,
  companionId: null,
};

const ATRAXA = deckCard("Atraxa, Praetors' Voice", { isCommander: true });
const SOL_RING = deckCard("Sol Ring", { notes: "Turn-one play" });
const FORESTS = deckCard("Forest", { quantity: 10, zone: "sideboard" });
const ARCANE_SIGNET = deckCard("Arcane Signet");
const KENRITH = deckCard("Kenrith, the Returned King", { isCommander: true });

/** The deck after its owner swapped Atraxa for Kenrith. */
const KENRITH_DECK = {
  id: DECK.id,
  commanderId: KENRITH.scryfallId,
  commanderName: KENRITH.name,
  partnerId: null,
  companionId: null,
};

const LURRUS = deckCard("Lurrus of the Dream-Den", { category: "companion" });
const JEGANTHA = deckCard("Jegantha, the Wellspring", {
  category: "companion",
});

/** The deck after its owner swapped Lurrus for Jegantha as its companion. */
const JEGANTHA_DECK = {
  ...DECK,
  companionId: JEGANTHA.scryfallId,
};

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
        // Atraxa and Sol Ring; the ten sideboard Forests stay out.
        cardCount: 2,
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

/**
 * A 100-card Commander deck stored as 71 rows: the commander, 30 Forests in
 * one row and 69 other single cards.
 */
const HUNDRED_CARDS_IN_71_ROWS = [
  ATRAXA,
  deckCard("Forest", { quantity: 30 }),
  ...Array.from({ length: 69 }, (_, index) => deckCard(`Spell ${index + 1}`)),
];

/** @returns the card count the history list shows for a snapshot of `cards` */
async function listedCountOfSnapshot(
  cards: ReturnType<typeof deckCard>[]
): Promise<number | undefined> {
  const fake = inMemorySnapshotStore(DECK, cards);
  const snapshots = makeSnapshotUseCases(fake.snapshots);
  await snapshots.saveSnapshot({ deckId: DECK.id, rawName: "Counted" });
  const [listed] = await snapshots.listSnapshots(DECK.id);
  return listed?.cardCount;
}

describe("the card count of a snapshot", () => {
  it("counts every copy: a snapshot of a deck with 30 Forests in one row counts 100 cards", async () => {
    const fake = inMemorySnapshotStore(DECK, HUNDRED_CARDS_IN_71_ROWS);
    const snapshots = makeSnapshotUseCases(fake.snapshots);

    const saved = await snapshots.saveSnapshot({
      deckId: DECK.id,
      rawName: "Hundred",
    });
    const listed = await snapshots.listSnapshots(DECK.id);

    expect(saved.kind === "saved" && saved.snapshot.cardCount).toBe(100);
    expect(listed.map((snapshot) => snapshot.cardCount)).toEqual([100]);
  });

  it("leaves the sideboard and the Considering rows out", async () => {
    const count = await listedCountOfSnapshot([
      ATRAXA,
      SOL_RING,
      FORESTS,
      deckCard("Arcane Signet", { quantity: 2, zone: "maybeboard" }),
    ]);

    expect(count).toBe(2);
  });

  it("leaves a companion out", async () => {
    const count = await listedCountOfSnapshot([
      ATRAXA,
      SOL_RING,
      deckCard("Lurrus of the Dream-Den", { category: "companion" }),
    ]);

    expect(count).toBe(2);
  });

  it("counts a partner pair as two cards", async () => {
    const count = await listedCountOfSnapshot([
      deckCard("Thrasios, Triton Hero", { isCommander: true }),
      deckCard("Tymna the Weaver", { isPartner: true }),
      SOL_RING,
    ]);

    expect(count).toBe(3);
  });

  it("lists the copies of a snapshot saved when the stored count was its rows", async () => {
    const { fake, snapshots } = setUp();
    await fake.snapshots.create({
      deckId: DECK.id,
      name: "Saved before copies were counted",
      cardList: HUNDRED_CARDS_IN_71_ROWS,
      commander: "Atraxa, Praetors' Voice",
      cardCount: 71,
    });

    const [listed] = await snapshots.listSnapshots(DECK.id);

    expect(listed?.cardCount).toBe(100);
  });

  it.each([
    ["is not a list", { not: "a list" }],
    ["holds a card without a name", [{ scryfallId: "x", quantity: 4 }]],
  ])(
    "keeps the stored number of a snapshot whose card list %s",
    async (_case, cardList) => {
      const { fake, snapshots } = setUp();
      await fake.snapshots.create({
        deckId: DECK.id,
        name: "Unreadable",
        cardList,
        commander: null,
        cardCount: 7,
      });

      const [listed] = await snapshots.listSnapshots(DECK.id);

      expect(listed?.cardCount).toBe(7);
    }
  );
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

  it("puts back the commander the snapshot was taken under, on the deck as well as in its cards", async () => {
    const fake = inMemorySnapshotStore(KENRITH_DECK, [KENRITH, SOL_RING]);
    const snapshots = makeSnapshotUseCases(fake.snapshots);
    const underAtraxa = await fake.snapshots.create({
      deckId: DECK.id,
      name: "Atraxa build",
      cardList: [ATRAXA, SOL_RING],
      commander: ATRAXA.name,
      cardCount: 2,
    });

    const result = await snapshots.restoreSnapshot({
      deckId: DECK.id,
      snapshotId: underAtraxa.id,
    });

    expect(result).toEqual({
      kind: "restored",
      deck: expect.objectContaining({
        commanderId: ATRAXA.scryfallId,
        commanderName: ATRAXA.name,
        partnerId: null,
      }),
    });
  });

  it("clears the deck's commander when the snapshot holds no commander row", async () => {
    const { fake, snapshots } = setUp();
    const commanderless = await fake.snapshots.create({
      deckId: DECK.id,
      name: "Before a commander",
      cardList: [SOL_RING],
      commander: null,
      cardCount: 1,
    });

    await snapshots.restoreSnapshot({
      deckId: DECK.id,
      snapshotId: commanderless.id,
    });

    expect(await fake.snapshots.findDeckWithCards(DECK.id)).toEqual(
      expect.objectContaining({
        commanderId: null,
        commanderName: null,
        partnerId: null,
      })
    );
  });

  it("puts back the companion the snapshot was taken with, on the deck as well as in its cards", async () => {
    const fake = inMemorySnapshotStore(JEGANTHA_DECK, [ATRAXA, JEGANTHA]);
    const snapshots = makeSnapshotUseCases(fake.snapshots);
    const withLurrus = await fake.snapshots.create({
      deckId: DECK.id,
      name: "Lurrus build",
      cardList: [ATRAXA, SOL_RING, LURRUS],
      commander: ATRAXA.name,
      cardCount: 2,
    });

    await snapshots.restoreSnapshot({
      deckId: DECK.id,
      snapshotId: withLurrus.id,
    });

    expect(await fake.snapshots.findDeckWithCards(DECK.id)).toEqual(
      expect.objectContaining({ companionId: LURRUS.scryfallId })
    );
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
    expect(await fake.snapshots.findDeckWithCards(DECK.id)).toEqual(
      expect.objectContaining({
        commanderId: DECK.commanderId,
        commanderName: DECK.commanderName,
      })
    );
  });
});
