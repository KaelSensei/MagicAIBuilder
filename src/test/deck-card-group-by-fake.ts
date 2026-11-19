/**
 * An in-memory `prisma.deckCard.groupBy` over stored `DeckCard` rows, for the
 * route tests that stub Prisma with `stubPrisma`.
 *
 * Why: the deck listings sum card copies in the database with one `groupBy`
 * per page. A stub that returns ready-made groups would let the test write the
 * answer it checks; this fake groups real rows the way PostgreSQL does, so a
 * test states a deck as its stored rows (one row of 30 Forests) and reads the
 * count the route makes of them.
 *
 * Supports what the listings send: `by` any list of columns, `where` a
 * `deckId: { in }` filter and `_sum` of `quantity`.
 *
 * @module test/deck-card-group-by-fake
 */
import { deckCard, type FakeDeckCard } from "@/test/playtest-db-fake";

/**
 * A 100-card Commander deck as stored, in 74 rows: its commander, one row of
 * 30 Forests and 69 single cards, plus a sideboard row of 3, a maybeboard row
 * of 2 and a companion, none of which count toward the 100.
 *
 * @param deckId - the deck the rows belong to
 * @returns the deck's rows
 */
export function storedHundredCardDeck(deckId: string): FakeDeckCard[] {
  const row = (name: string, overrides: Partial<FakeDeckCard> = {}) =>
    deckCard(name, { deckId, ...overrides });
  return [
    row("Talrand, Sky Summoner", { isCommander: true, category: "commander" }),
    row("Forest", { quantity: 30, category: "land" }),
    ...Array.from({ length: 69 }, (_, index) => row(`Spell ${index + 1}`)),
    row("Negate", { zone: "sideboard", quantity: 3 }),
    row("Counterspell", { zone: "maybeboard", quantity: 2 }),
    row("Lutri, the Spellchaser", { category: "companion" }),
  ];
}

/** The `groupBy` arguments the fake reads. */
export interface DeckCardGroupByArgs {
  readonly by: readonly (keyof FakeDeckCard)[];
  readonly where: { readonly deckId: { readonly in: readonly string[] } };
}

/** One group, as Prisma answers it: the `by` columns and the summed quantity. */
export type DeckCardGroup = Readonly<Record<string, unknown>> & {
  readonly _sum: { readonly quantity: number };
};

/**
 * @param rows - the stored rows, of any number of decks
 * @returns a `groupBy` that answers from `rows`, and records how often it ran
 */
export function deckCardGroupByFake(rows: readonly FakeDeckCard[]): {
  readonly groupBy: (args: DeckCardGroupByArgs) => Promise<DeckCardGroup[]>;
  readonly calls: () => number;
} {
  let calls = 0;
  const groupBy = (args: DeckCardGroupByArgs): Promise<DeckCardGroup[]> => {
    calls += 1;
    const deckIds = new Set(args.where.deckId.in);
    const groups = new Map<string, { row: FakeDeckCard; quantity: number }>();
    for (const row of rows.filter((stored) => deckIds.has(stored.deckId))) {
      const key = JSON.stringify(args.by.map((column) => row[column]));
      const quantity = (groups.get(key)?.quantity ?? 0) + row.quantity;
      groups.set(key, { row: groups.get(key)?.row ?? row, quantity });
    }
    return Promise.resolve(
      [...groups.values()].map(({ row, quantity }) => ({
        ...Object.fromEntries(args.by.map((column) => [column, row[column]])),
        _sum: { quantity },
      }))
    );
  };
  return { groupBy, calls: () => calls };
}
