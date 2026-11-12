/**
 * In-memory `Deck` and `DeckCard` tables with the commit rule of a Prisma
 * interactive transaction, for the card routes under `/api/decks/[id]/cards`
 * and the command-zone route `/api/decks/[id]/command-zone`.
 *
 * Why: those routes must change a card, the deck's `updatedAt` and its
 * `version` together or not at all (B2-09, and the optimistic lock of
 * `lib/deck/deck-repository.ts`). A test can only see that through what stays
 * stored when one of the writes fails. So a write made outside `$transaction`
 * lands in the stored tables at once, and a write made through the `tx`
 * client lands only when the transaction's callback resolves; a throw
 * discards it.
 *
 * Rows reuse the deck-card shape of {@link deckCard} from the playtest fake.
 * `select` and `include` are ignored: a lookup returns the whole row. A
 * `where` value of `undefined` filters nothing, and `{ in: [...] }` matches
 * any listed value, as in Prisma.
 */
import {
  deckCard,
  FAKE_DECK,
  type FakeDeckCard,
} from "@/test/playtest-db-fake";
import { prismaQuery } from "@/test/prisma-query";

/** The `Deck` columns the card and command-zone routes read or write. */
export type FakeCardsDeck = {
  readonly id: string;
  readonly userId: string;
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: string;
  readonly updatedAt: Date;
  /** The optimistic-lock counter: how many card writes the deck has saved. */
  readonly version: number;
};

/**
 * The deck every reset starts from: owned by `FAKE_DECK.userId`, with an
 * empty command zone, last edited 2026-11-01, after seven saved writes.
 */
export const CARDS_DECK: FakeCardsDeck = {
  id: FAKE_DECK.id,
  userId: FAKE_DECK.userId,
  commanderId: null,
  commanderName: null,
  partnerId: null,
  companionId: null,
  pairingType: "none",
  updatedAt: new Date("2026-11-01T10:00:00.000Z"),
  version: 7,
};

type Filter = Readonly<Record<string, unknown>>;

/** The two tables. Writes replace a field, never mutate a row or an array. */
interface Tables {
  deck: FakeCardsDeck;
  cards: readonly FakeDeckCard[];
}

/** Prisma's `{ in: [...] }` list filter on one column. */
function isInFilter(
  value: unknown
): value is { readonly in: readonly unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "in" in value &&
    Array.isArray(value.in)
  );
}

/**
 * @param row - Stored row.
 * @param where - Filter on top-level columns: a value to equal, or `{ in: [...] }`.
 * @returns Whether the row holds every value of the filter.
 */
function matches(row: Filter, where: Filter): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (isInFilter(value)) return value.in.includes(row[key]);
    return row[key] === value;
  });
}

/** The `where` and `data` of the version claim (`deck.updateMany`). */
interface VersionClaim {
  readonly where: { readonly id: string; readonly version?: number };
  readonly data: {
    readonly version: { readonly increment: number };
    readonly updatedAt: Date;
  };
}

/**
 * Builds a fresh fake database.
 *
 * @returns The Prisma-shaped client plus helpers to seed, break and inspect it.
 */
function createDeckCardsDb() {
  const stored: Tables = { deck: CARDS_DECK, cards: [] };
  let failDeckTouch = false;
  let failCardWrite = false;
  let createdCount = 0;

  /** Throws once when a test planned the deck write to fail. */
  const throwIfDeckTouchFails = (): void => {
    if (!failDeckTouch) return;
    failDeckTouch = false;
    throw new Error("deck update failed");
  };

  /** Throws once when a test planned the card write to fail. */
  const throwIfCardWriteFails = (): void => {
    if (!failCardWrite) return;
    failCardWrite = false;
    throw new Error("card write failed");
  };

  /**
   * Prisma-shaped delegates that read and write one copy of the tables. A
   * write that can fail goes through {@link prismaQuery}, so the failure
   * rejects the returned promise as Prisma's would.
   */
  const delegatesOver = (tables: Tables) => ({
    deck: {
      findUnique: ({ where }: { readonly where: { readonly id: string } }) =>
        Promise.resolve(tables.deck.id === where.id ? tables.deck : null),
      update: ({
        where,
        data,
      }: {
        readonly where: { readonly id: string };
        readonly data: Partial<FakeCardsDeck>;
      }) =>
        prismaQuery(() => {
          throwIfDeckTouchFails();
          if (tables.deck.id !== where.id)
            throw new Error("Record to update not found.");
          tables.deck = { ...tables.deck, ...data };
          return tables.deck;
        }),
      /** The compare-and-swap of the deck version: 1 when the filter matched. */
      updateMany: ({ where, data }: VersionClaim) =>
        prismaQuery(() => {
          throwIfDeckTouchFails();
          if (!matches(tables.deck, where)) return { count: 0 };
          tables.deck = {
            ...tables.deck,
            version: tables.deck.version + data.version.increment,
            updatedAt: data.updatedAt,
          };
          return { count: 1 };
        }),
    },
    deckCard: {
      findFirst: ({ where }: { readonly where: Filter }) =>
        Promise.resolve(
          tables.cards.find((card) => matches(card, where)) ?? null
        ),
      findMany: ({ where }: { readonly where: Filter }) =>
        Promise.resolve(tables.cards.filter((card) => matches(card, where))),
      create: ({ data }: { readonly data: Partial<FakeDeckCard> }) =>
        prismaQuery(() => {
          throwIfCardWriteFails();
          createdCount += 1;
          const card: FakeDeckCard = {
            ...deckCard(`created ${createdCount}`),
            ...data,
            id: `card-created-${createdCount}`,
          };
          tables.cards = [...tables.cards, card];
          return card;
        }),
      update: ({
        where,
        data,
      }: {
        readonly where: Filter;
        readonly data: Partial<FakeDeckCard>;
      }) =>
        prismaQuery(() => {
          throwIfCardWriteFails();
          const current = tables.cards.find((card) => matches(card, where));
          if (!current) throw new Error("Record to update not found.");
          const next: FakeDeckCard = { ...current, ...data };
          tables.cards = tables.cards.map((card) =>
            card === current ? next : card
          );
          return next;
        }),
      /** Changes every matching row; the count says how many, as in Prisma. */
      updateMany: ({
        where,
        data,
      }: {
        readonly where: Filter;
        readonly data: Partial<FakeDeckCard>;
      }) =>
        prismaQuery(() => {
          throwIfCardWriteFails();
          const changed = tables.cards.filter((card) => matches(card, where));
          tables.cards = tables.cards.map((card) =>
            changed.includes(card) ? { ...card, ...data } : card
          );
          return { count: changed.length };
        }),
      delete: ({ where }: { readonly where: Filter }) =>
        prismaQuery(() => {
          throwIfCardWriteFails();
          const current = tables.cards.find((card) => matches(card, where));
          if (!current) throw new Error("Record to delete does not exist.");
          tables.cards = tables.cards.filter((card) => card !== current);
          return current;
        }),
      deleteMany: ({ where }: { readonly where: Filter }) =>
        prismaQuery(() => {
          throwIfCardWriteFails();
          const kept = tables.cards.filter((card) => !matches(card, where));
          const count = tables.cards.length - kept.length;
          tables.cards = kept;
          return { count };
        }),
    },
  });

  const outside = delegatesOver(stored);

  const prisma = {
    ...outside,
    user: {
      findUnique: ({ where }: { readonly where: { readonly id: string } }) =>
        Promise.resolve({
          id: where.id,
          name: null,
          email: null,
          image: null,
        }),
    },
    /** Runs `run` on a draft and stores the draft only if `run` resolves. */
    $transaction: async <Result>(
      run: (tx: ReturnType<typeof delegatesOver>) => Promise<Result>
    ): Promise<Result> => {
      const draft: Tables = { deck: stored.deck, cards: stored.cards };
      const result = await run(delegatesOver(draft));
      stored.deck = draft.deck;
      stored.cards = draft.cards;
      return result;
    },
  };

  return {
    prisma,
    /**
     * Stores `deck` ({@link CARDS_DECK} by default) with `cards` and clears
     * any planned failure.
     *
     * @param cards - The deck's card rows.
     * @param deck - The deck row, for a test that starts from a filled command zone.
     */
    reset(
      cards: readonly FakeDeckCard[],
      deck: FakeCardsDeck = CARDS_DECK
    ): void {
      stored.deck = deck;
      stored.cards = cards;
      failDeckTouch = false;
      failCardWrite = false;
      createdCount = 0;
    },
    /**
     * Makes the next deck write (`deck.update`, or the version claim
     * `deck.updateMany`) throw, as a lost connection or a deck deleted
     * mid-request would.
     */
    failNextDeckTouch(): void {
      failDeckTouch = true;
    },
    /**
     * Makes the next card write (`deckCard.create`, `update`, `updateMany`,
     * `delete` or `deleteMany`) throw, as a constraint violation or a lost
     * connection would.
     */
    failNextCardWrite(): void {
      failCardWrite = true;
    },
    /** @returns The stored deck row. */
    deck: (): FakeCardsDeck => stored.deck,
    /** @returns Every stored card row, in insertion order. */
    cards: (): readonly FakeDeckCard[] => stored.cards,
  };
}

/** The shared fake; call `reset` in `beforeEach`. */
export const deckCardsDb = createDeckCardsDb();
