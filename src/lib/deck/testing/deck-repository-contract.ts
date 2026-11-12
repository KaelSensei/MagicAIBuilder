/**
 * The shared contract suite of the deck repository port (ADR 0005: one suite
 * per owned port, run against the in-memory fake and the real adapter).
 *
 * It pins what every `DeckRepository` must do: one version step per saved
 * write, the compare-and-swap on `expectedVersion`, nothing stored on `stale`
 * or `not-found`, all or nothing when the card write fails, card ids scoped
 * to their deck, and one winner among concurrent writers that read the same
 * version. Callers: `in-memory-deck-repository.test.ts` and
 * `deck-repository.prisma.test.ts`.
 *
 * @module deck/testing/deck-repository-contract
 */
import { beforeEach, describe, expect, it } from "vitest";

import { forEachSequential } from "@/lib/async/sequential";
import type {
  DeckRepository,
  NewDeckCard,
  StoredDeckCard,
} from "@/lib/deck/deck-repository-port";
import { compareCodeUnits } from "@/lib/text/code-unit-order";

/** A deck the harness stored for one test. */
export interface SeededDeck {
  readonly deckId: string;
  readonly version: number;
  /** The ids of its card rows, in the order they were given. */
  readonly cardIds: readonly string[];
}

/** What the harness reads back for a deck, outside any write. */
export interface StoredDeckState {
  readonly version: number;
  readonly updatedAt: Date;
  readonly cards: readonly StoredDeckCard[];
}

/** One adapter under test, with the seeding and inspection the suite needs. */
export interface DeckRepositoryHarness {
  readonly repository: DeckRepository;
  /**
   * Stores a new deck at version 0 with `updatedAt` = {@link SEEDED_AT}
   * and these cards.
   */
  readonly seedDeck: (cards: readonly NewDeckCard[]) => Promise<SeededDeck>;
  /** @returns the stored deck, or `undefined` when no deck has this id. */
  readonly storedDeck: (deckId: string) => Promise<StoredDeckState | undefined>;
}

/** The `updatedAt` of a seeded deck: far enough back that any write moves it. */
export const SEEDED_AT = new Date("2026-01-01T00:00:00.000Z");

/**
 * @param name - Card name; the rest of the row is a one-copy main-deck card.
 * @returns The columns of a new card row.
 */
export function newDeckCard(
  name: string,
  overrides: Partial<NewDeckCard> = {}
): NewDeckCard {
  return {
    scryfallId: `scryfall-${name.toLowerCase().replaceAll(/\W+/g, "-")}`,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    power: null,
    toughness: null,
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    zone: "main",
    ...overrides,
  };
}

/**
 * Card names in code-unit order: adapters need not keep insertion order, and
 * the comparison must not depend on the machine's locale.
 */
function namesOf(cards: readonly StoredDeckCard[]): readonly string[] {
  return cards.map((card) => card.name).toSorted(compareCodeUnits);
}

const SIGNET = newDeckCard("Arcane Signet", { category: "ramp" });
const FOREST = newDeckCard("Forest", { quantity: 10, category: "land" });
const SOL_RING = newDeckCard("Sol Ring", { category: "ramp" });
const ISLAND = newDeckCard("Island", { category: "land" });

/**
 * One card per writer racing on one version: four, within Prisma's default
 * pool on a two-core machine (2 × cores + 1 = 5 connections), so each holds
 * a connection at once.
 */
const RACING_CARDS = ["Writer 1", "Writer 2", "Writer 3", "Writer 4"].map(
  (name) => newDeckCard(name)
);

/** Races run per case, each on a fresh deck. */
const RACE_ROUNDS = [1, 2, 3, 4, 5];

/**
 * Checks that a harness seeds a deck the way the contract cases assume: at
 * version 0, dated {@link SEEDED_AT}, with one row per card and `cardIds` in
 * the order the cards were given. Cases such as `const [, forestId] =
 * deck.cardIds` act on the wrong row when a harness breaks that order.
 *
 * Each harness is written for its adapter, so each adapter's test file runs
 * this in a case of its own.
 *
 * @param harness - the harness under test
 * @returns resolves when the seeded deck matches; rejects with the mismatch
 */
export async function expectSeedsAsTheContractAssumes(
  harness: DeckRepositoryHarness
): Promise<void> {
  const deck = await harness.seedDeck([SIGNET, FOREST]);
  const stored = await harness.storedDeck(deck.deckId);

  expect(deck.version).toBe(0);
  expect(stored).toMatchObject({ version: 0, updatedAt: SEEDED_AT });
  const nameOfRow = new Map(stored?.cards.map((card) => [card.id, card.name]));
  expect(deck.cardIds.map((id) => nameOfRow.get(id))).toEqual([
    "Arcane Signet",
    "Forest",
  ]);
}

/**
 * Registers the contract cases in the current `describe` block.
 *
 * @param makeHarness - Builds the adapter under test; called before each
 *   case, so a case may seed what it needs without seeing another case's rows.
 */
export function describeDeckRepositoryContract(
  makeHarness: () => DeckRepositoryHarness
): void {
  let harness: DeckRepositoryHarness;

  beforeEach(() => {
    harness = makeHarness();
  });

  /** @returns the stored deck; fails the case when it is missing */
  async function stored(deckId: string): Promise<StoredDeckState> {
    const deck = await harness.storedDeck(deckId);
    if (deck === undefined) throw new Error(`deck ${deckId} is not stored`);
    return deck;
  }

  describe("addCard", () => {
    it("stores the card and moves the version by one when no version is expected", async () => {
      const deck = await harness.seedDeck([SIGNET]);

      const result = await harness.repository.addCard(
        { deckId: deck.deckId },
        SOL_RING
      );

      expect(result).toMatchObject({
        kind: "saved",
        version: deck.version + 1,
        value: { name: "Sol Ring", deckId: deck.deckId, notes: null },
      });
      const after = await stored(deck.deckId);
      expect(namesOf(after.cards)).toEqual(["Arcane Signet", "Sol Ring"]);
      expect(after.version).toBe(deck.version + 1);
      expect(after.updatedAt.getTime()).toBeGreaterThan(SEEDED_AT.getTime());
    });

    it("stores the card when the expected version is the stored one", async () => {
      const deck = await harness.seedDeck([SIGNET]);

      const result = await harness.repository.addCard(
        { deckId: deck.deckId, expectedVersion: deck.version },
        SOL_RING
      );

      expect(result).toMatchObject({
        kind: "saved",
        version: deck.version + 1,
      });
      expect((await stored(deck.deckId)).version).toBe(deck.version + 1);
    });

    it("stores nothing and answers stale when the expected version is outdated", async () => {
      const deck = await harness.seedDeck([SIGNET]);
      await harness.repository.addCard({ deckId: deck.deckId }, ISLAND);

      const result = await harness.repository.addCard(
        { deckId: deck.deckId, expectedVersion: deck.version },
        SOL_RING
      );

      expect(result).toEqual({ kind: "stale" });
      const after = await stored(deck.deckId);
      expect(namesOf(after.cards)).toEqual(["Arcane Signet", "Island"]);
      expect(after.version).toBe(deck.version + 1);
    });

    it("lets exactly one of several writers that read the same version through", async () => {
      // Several writers, several rounds: a check made outside the database
      // (read, compare, then write) lets two writers through only when their
      // reads interleave, which concurrent calls do now and then, not always.
      // A correct adapter passes every round.
      await forEachSequential(RACE_ROUNDS, async () => {
        const deck = await harness.seedDeck([]);
        const target = { deckId: deck.deckId, expectedVersion: deck.version };

        const results = await Promise.all(
          RACING_CARDS.map((card) => harness.repository.addCard(target, card))
        );

        const saved = results.filter((result) => result.kind === "saved");
        const stale = results.filter((result) => result.kind === "stale");
        expect(saved).toHaveLength(1);
        expect(stale).toHaveLength(RACING_CARDS.length - 1);
        const after = await stored(deck.deckId);
        expect(after.cards).toHaveLength(1);
        expect(after.version).toBe(deck.version + 1);
      });
    });
  });

  describe("editCard", () => {
    it("changes only the given columns and moves the version", async () => {
      const deck = await harness.seedDeck([SIGNET, FOREST]);
      const [, forestId] = deck.cardIds;

      const result = await harness.repository.editCard(
        { deckId: deck.deckId, expectedVersion: deck.version },
        forestId,
        { quantity: 12, notes: "Cut for duals" }
      );

      expect(result).toMatchObject({
        kind: "saved",
        version: deck.version + 1,
        value: { ...FOREST, quantity: 12, notes: "Cut for duals" },
      });
      const forest = (await stored(deck.deckId)).cards.find(
        (card) => card.id === forestId
      );
      expect(forest).toMatchObject({
        ...FOREST,
        quantity: 12,
        notes: "Cut for duals",
      });
    });

    it("stores nothing and answers stale when the expected version is outdated", async () => {
      const deck = await harness.seedDeck([FOREST]);
      const [forestId] = deck.cardIds;

      const result = await harness.repository.editCard(
        { deckId: deck.deckId, expectedVersion: deck.version + 1 },
        forestId,
        { quantity: 12 }
      );

      expect(result).toEqual({ kind: "stale" });
      const after = await stored(deck.deckId);
      expect(after.cards).toMatchObject([{ quantity: 10 }]);
      expect(after.version).toBe(deck.version);
      expect(after.updatedAt).toEqual(SEEDED_AT);
    });

    it("rejects a card of another deck and keeps both decks as they were", async () => {
      const deck = await harness.seedDeck([SIGNET]);
      const other = await harness.seedDeck([FOREST]);
      const [otherForestId] = other.cardIds;

      await expect(
        harness.repository.editCard({ deckId: deck.deckId }, otherForestId, {
          quantity: 1,
        })
      ).rejects.toThrow();

      const after = await stored(deck.deckId);
      expect(after.version).toBe(deck.version);
      expect(after.updatedAt).toEqual(SEEDED_AT);
      expect((await stored(other.deckId)).cards).toMatchObject([
        { quantity: 10 },
      ]);
    });
  });

  describe("removeCard", () => {
    it("removes that row only, answers it and moves the version", async () => {
      const deck = await harness.seedDeck([SIGNET, FOREST]);
      const [signetId] = deck.cardIds;

      const result = await harness.repository.removeCard(
        { deckId: deck.deckId, expectedVersion: deck.version },
        signetId
      );

      expect(result).toMatchObject({
        kind: "saved",
        version: deck.version + 1,
        value: { id: signetId, name: "Arcane Signet" },
      });
      expect(namesOf((await stored(deck.deckId)).cards)).toEqual(["Forest"]);
    });

    it("rejects a card id the deck does not hold and keeps the version", async () => {
      const deck = await harness.seedDeck([SIGNET]);

      await expect(
        harness.repository.removeCard({ deckId: deck.deckId }, "no-such-card")
      ).rejects.toThrow();

      const after = await stored(deck.deckId);
      expect(namesOf(after.cards)).toEqual(["Arcane Signet"]);
      expect(after.version).toBe(deck.version);
    });
  });

  describe("removeAllCards", () => {
    it("removes this deck's rows only and answers how many", async () => {
      const deck = await harness.seedDeck([SIGNET, FOREST]);
      const other = await harness.seedDeck([ISLAND]);

      const result = await harness.repository.removeAllCards({
        deckId: deck.deckId,
        expectedVersion: deck.version,
      });

      expect(result).toEqual({
        kind: "saved",
        value: 2,
        version: deck.version + 1,
      });
      expect((await stored(deck.deckId)).cards).toEqual([]);
      expect(namesOf((await stored(other.deckId)).cards)).toEqual(["Island"]);
    });

    it("keeps every row when the expected version is outdated", async () => {
      const deck = await harness.seedDeck([SIGNET, FOREST]);

      const result = await harness.repository.removeAllCards({
        deckId: deck.deckId,
        expectedVersion: deck.version + 3,
      });

      expect(result).toEqual({ kind: "stale" });
      expect((await stored(deck.deckId)).cards).toHaveLength(2);
    });
  });

  it("answers not-found for a deck that does not exist and stores nothing", async () => {
    const result = await harness.repository.addCard(
      { deckId: "no-such-deck" },
      SOL_RING
    );

    expect(result).toEqual({ kind: "not-found" });
    expect(await harness.storedDeck("no-such-deck")).toBeUndefined();
  });
}
