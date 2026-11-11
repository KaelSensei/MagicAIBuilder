/**
 * In-memory Prisma tables behind recorded playtests (one deck, its cards,
 * snapshots and sessions), so tests can follow a run to the stored rows.
 * Supports equality `where`, `orderBy` on `createdAt` and `take`; `select`
 * and `include` are ignored, and a deck comes back with its cards.
 */
import { prismaQuery } from "@/test/prisma-query";

/** One `DeckCard` row, with the columns a snapshot copies. */
export type FakeDeckCard = {
  readonly id: string;
  readonly deckId: string;
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly power: string | null;
  readonly toughness: string | null;
  readonly colorIdentity: readonly string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly notes: string | null;
  readonly zone: string;
};

/** One `Deck` row, reduced to the columns the playtest routes read. */
export type FakeDeck = {
  readonly id: string;
  readonly userId: string;
  readonly commanderId: string | null;
};

/** One stored `DeckSnapshot` row. */
export type FakeSnapshot = {
  readonly id: string;
  readonly deckId: string;
  readonly name: string;
  readonly cardList: unknown;
  readonly commander: string | null;
  readonly cardCount: number;
  readonly createdAt: Date;
};

/** One stored `PlaytestSession` row. */
export type FakeSession = {
  readonly id: string;
  readonly deckId: string;
  readonly userId: string;
  readonly result: string;
  readonly turns: number;
  readonly mulliganCount: number;
  readonly difficulty: string | null;
  readonly notes: string | null;
  readonly proposedChange: string | null;
  readonly snapshotId: string | null;
  readonly cardsSeen: number | null;
  readonly additionalCardsSeen: number | null;
  readonly createdAt: Date;
};

type Row = Readonly<Record<string, unknown>>;

interface FindArgs {
  readonly where?: Row;
  readonly orderBy?: { readonly createdAt?: "asc" | "desc" };
  readonly take?: number;
}

interface CreateArgs {
  readonly data: Row;
}

/** The deck every fake starts from. */
export const FAKE_DECK: FakeDeck = {
  id: "deck-1",
  userId: "owner-1",
  commanderId: null,
};

/**
 * @param name - Card name; the Scryfall id and row id are derived from it.
 * @param overrides - Columns that differ from a one-copy main-deck card.
 * @returns A deck card row of {@link FAKE_DECK}.
 */
export function deckCard(
  name: string,
  overrides: Partial<FakeDeckCard> = {}
): FakeDeckCard {
  const slug = name.toLowerCase().replaceAll(/\W+/g, "-");
  return {
    id: `card-${slug}`,
    deckId: FAKE_DECK.id,
    scryfallId: `scryfall-${slug}`,
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
    notes: null,
    zone: "main",
    ...overrides,
  };
}

/**
 * @param row - Stored row.
 * @param where - Equality filter; undefined values are ignored, as Prisma does.
 * @returns Whether the row satisfies every filter field.
 */
function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(
    ([key, value]) => value === undefined || row[key] === value
  );
}

/**
 * @param rows - Table contents in insertion order.
 * @param args - Prisma-style find arguments.
 * @returns The matching rows, ordered and limited.
 */
function find<T extends Row & { readonly createdAt: Date }>(
  rows: readonly T[],
  args: FindArgs
): T[] {
  const found = rows.filter((row) => matches(row, args.where));
  const direction = args.orderBy?.createdAt;
  if (direction) {
    const sign = direction === "asc" ? 1 : -1;
    found.sort(
      (left, right) =>
        sign * (left.createdAt.getTime() - right.createdAt.getTime())
    );
  }
  return args.take === undefined ? found : found.slice(0, args.take);
}

/** @returns A copy of `value` as a JSON column would store it. */
function asStoredJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

/** @returns `value` when it is a string, otherwise `fallback`. */
function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/** @returns `value` when it is a string, otherwise null. */
function nullableText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** @returns `value` when it is a number, otherwise `fallback`. */
function count(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

/** @returns `value` when it is a number, otherwise null. */
function nullableCount(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/**
 * Builds a fresh fake database.
 *
 * @returns The Prisma-shaped client plus helpers to seed, edit and inspect it.
 */
function createPlaytestDb() {
  const deck = FAKE_DECK;
  let cards: readonly FakeDeckCard[] = [];
  let snapshots: FakeSnapshot[] = [];
  let sessions: FakeSession[] = [];
  let sequence = 0;

  /** Strictly increasing timestamps, so "newest first" is never a tie. */
  const nextCreatedAt = (): Date =>
    new Date(Date.UTC(2026, 10, 9, 12, 0, 0, ++sequence));

  /**
   * Prisma-shaped delegates. Reads resolve directly; writes go through
   * {@link prismaQuery}, so a write that throws rejects as Prisma's would.
   */
  const tables = {
    user: {
      findUnique: ({ where }: { readonly where: { readonly id?: string } }) =>
        Promise.resolve({
          id: where.id ?? deck.userId,
          name: null,
          email: null,
          image: null,
        }),
    },
    deck: {
      findUnique: ({ where }: FindArgs) =>
        Promise.resolve(
          matches(deck, where) ? { ...deck, cards: [...cards] } : null
        ),
    },
    deckCard: {
      findMany: ({ where }: FindArgs) =>
        Promise.resolve(cards.filter((card) => matches(card, where))),
    },
    deckSnapshot: {
      findFirst: (args: FindArgs) =>
        Promise.resolve(find(snapshots, args)[0] ?? null),
      findMany: (args: FindArgs) => Promise.resolve(find(snapshots, args)),
      create: ({ data }: CreateArgs) =>
        prismaQuery(() => {
          const snapshot: FakeSnapshot = {
            id: `snapshot-${snapshots.length + 1}`,
            deckId: text(data.deckId, ""),
            name: text(data.name, ""),
            cardList: asStoredJson(data.cardList),
            commander: nullableText(data.commander),
            cardCount: count(data.cardCount, 0),
            createdAt: nextCreatedAt(),
          };
          snapshots.push(snapshot);
          return snapshot;
        }),
    },
    playtestSession: {
      findMany: (args: FindArgs) => Promise.resolve(find(sessions, args)),
      create: ({ data }: CreateArgs) =>
        prismaQuery(() => {
          const session: FakeSession = {
            id: `session-${sessions.length + 1}`,
            deckId: text(data.deckId, ""),
            userId: text(data.userId, ""),
            result: text(data.result, ""),
            turns: count(data.turns, 0),
            mulliganCount: count(data.mulliganCount, 0),
            difficulty: nullableText(data.difficulty),
            notes: nullableText(data.notes),
            proposedChange: nullableText(data.proposedChange),
            snapshotId: nullableText(data.snapshotId),
            cardsSeen: nullableCount(data.cardsSeen),
            additionalCardsSeen: nullableCount(data.additionalCardsSeen),
            createdAt: nextCreatedAt(),
          };
          sessions.push(session);
          return session;
        }),
    },
  };

  const prisma = {
    ...tables,
    /** Interactive transactions run against the same tables, without rollback. */
    $transaction: async <T>(
      run: (tx: typeof tables) => Promise<T>
    ): Promise<T> => run(tables),
  };

  return {
    prisma,
    /**
     * Empties every table and stores {@link FAKE_DECK} with `deckCards`.
     *
     * @param deckCards - The deck's saved card rows.
     */
    reset(deckCards: readonly FakeDeckCard[]): void {
      cards = deckCards;
      snapshots = [];
      sessions = [];
      sequence = 0;
    },
    /**
     * Replaces the deck's saved cards, as an edit in the builder would.
     *
     * @param deckCards - The new card rows.
     */
    saveCards(deckCards: readonly FakeDeckCard[]): void {
      cards = deckCards;
    },
    /** @returns Every stored snapshot, oldest first. */
    snapshots: (): readonly FakeSnapshot[] => [...snapshots],
    /** @returns Every stored session, oldest first. */
    sessions: (): readonly FakeSession[] => [...sessions],
  };
}

/** The shared fake; call `reset` in `beforeEach`. */
export const playtestDb = createPlaytestDb();
