/**
 * In-memory `Deck` and `DeckCard` tables with the commit rule of a Prisma
 * interactive transaction, for the card routes under `/api/decks/[id]/cards`.
 *
 * Why: those routes must change a card and the deck's `updatedAt` together or
 * not at all (B2-09). A test can only see that through what stays stored when
 * the second write fails. So a write made outside `$transaction` lands in the
 * stored tables at once, and a write made through the `tx` client lands only
 * when the transaction's callback resolves; a throw discards it.
 *
 * Rows reuse the deck-card shape of {@link deckCard} from the playtest fake.
 * `select` and `include` are ignored: a lookup returns the whole row.
 */
import {
  deckCard,
  FAKE_DECK,
  type FakeDeckCard,
} from "@/test/playtest-db-fake";

/** The `Deck` columns the card routes read or write. */
export type FakeCardsDeck = {
  readonly id: string;
  readonly userId: string;
  readonly commanderId: string | null;
  readonly partnerId: string | null;
  readonly updatedAt: Date;
};

/** The deck every reset starts from: owned by `FAKE_DECK.userId`, last edited 2026-11-01. */
export const CARDS_DECK: FakeCardsDeck = {
  id: FAKE_DECK.id,
  userId: FAKE_DECK.userId,
  commanderId: null,
  partnerId: null,
  updatedAt: new Date("2026-11-01T10:00:00.000Z"),
};

type Filter = Readonly<Record<string, unknown>>;

/** The two tables. Writes replace a field, never mutate a row or an array. */
interface Tables {
  deck: FakeCardsDeck;
  cards: readonly FakeDeckCard[];
}

/**
 * @param row - Stored row.
 * @param where - Equality filter on top-level columns.
 * @returns Whether the row holds every value of the filter.
 */
function matches(row: Filter, where: Filter): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

/**
 * Builds a fresh fake database.
 *
 * @returns The Prisma-shaped client plus helpers to seed, break and inspect it.
 */
function createDeckCardsDb() {
  const stored: Tables = { deck: CARDS_DECK, cards: [] };
  let failDeckTouch = false;
  let createdCount = 0;

  /** Prisma-shaped delegates that read and write one copy of the tables. */
  const delegatesOver = (tables: Tables) => ({
    deck: {
      findUnique: async ({
        where,
      }: {
        readonly where: { readonly id: string };
      }) => (tables.deck.id === where.id ? tables.deck : null),
      update: async ({
        where,
        data,
      }: {
        readonly where: { readonly id: string };
        readonly data: Partial<FakeCardsDeck>;
      }) => {
        if (failDeckTouch) {
          failDeckTouch = false;
          throw new Error("deck update failed");
        }
        if (tables.deck.id !== where.id)
          throw new Error("Record to update not found.");
        tables.deck = { ...tables.deck, ...data };
        return tables.deck;
      },
    },
    deckCard: {
      findFirst: async ({ where }: { readonly where: Filter }) =>
        tables.cards.find((card) => matches(card, where)) ?? null,
      create: async ({ data }: { readonly data: Partial<FakeDeckCard> }) => {
        createdCount += 1;
        const card: FakeDeckCard = {
          ...deckCard(`created ${createdCount}`),
          ...data,
          id: `card-created-${createdCount}`,
        };
        tables.cards = [...tables.cards, card];
        return card;
      },
      update: async ({
        where,
        data,
      }: {
        readonly where: { readonly id: string };
        readonly data: Partial<FakeDeckCard>;
      }) => {
        const current = tables.cards.find((card) => card.id === where.id);
        if (!current) throw new Error("Record to update not found.");
        const next: FakeDeckCard = { ...current, ...data };
        tables.cards = tables.cards.map((card) =>
          card.id === where.id ? next : card
        );
        return next;
      },
      delete: async ({
        where,
      }: {
        readonly where: { readonly id: string };
      }) => {
        const current = tables.cards.find((card) => card.id === where.id);
        if (!current) throw new Error("Record to delete does not exist.");
        tables.cards = tables.cards.filter((card) => card.id !== where.id);
        return current;
      },
      deleteMany: async ({ where }: { readonly where: Filter }) => {
        const kept = tables.cards.filter((card) => !matches(card, where));
        const count = tables.cards.length - kept.length;
        tables.cards = kept;
        return { count };
      },
    },
  });

  const outside = delegatesOver(stored);

  const prisma = {
    ...outside,
    user: {
      findUnique: async ({
        where,
      }: {
        readonly where: { readonly id: string };
      }) => ({
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
     * Stores {@link CARDS_DECK} with `cards` and clears any planned failure.
     *
     * @param cards - The deck's card rows.
     */
    reset(cards: readonly FakeDeckCard[]): void {
      stored.deck = CARDS_DECK;
      stored.cards = cards;
      failDeckTouch = false;
      createdCount = 0;
    },
    /** Makes the next `deck.update` throw, as a lost connection or a deck deleted mid-request would. */
    failNextDeckTouch(): void {
      failDeckTouch = true;
    },
    /** @returns The stored deck row. */
    deck: (): FakeCardsDeck => stored.deck,
    /** @returns Every stored card row, in insertion order. */
    cards: (): readonly FakeDeckCard[] => stored.cards,
  };
}

/** The shared fake; call `reset` in `beforeEach`. */
export const deckCardsDb = createDeckCardsDb();
