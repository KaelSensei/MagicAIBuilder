/**
 * In-memory `collectionCard` table, so a test can follow a collection edit
 * from the client store through the real `/api/collection/[id]` route to the
 * stored row. Supports the lookups that route makes: by `id`, and by the
 * `scryfallId_foil_userId` compound unique key.
 *
 * `$transaction` follows Prisma's interactive transactions: the `tx` client
 * writes to a draft that is stored only when the callback resolves. A write
 * made outside a transaction is stored at once, so a test that breaks the
 * second write of a merge (`failNextDelete`) sees whether the first one stayed
 * (B2-08).
 */

/** The user who owns every row built by {@link collectionRow}. */
export const COLLECTION_OWNER = "owner-1";

/** One stored `CollectionCard` row, as Prisma returns it. */
export type FakeCollectionRow = {
  readonly id: string;
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly foil: boolean;
  readonly condition: string | null;
  readonly acquiredAt: Date | null;
  readonly price: number | null;
  readonly imageUri: string;
  readonly userId: string | null;
  readonly createdAt: Date;
};

/** The unique `where` clauses the collection routes pass to Prisma. */
type UniqueWhere =
  | { readonly id: string }
  | {
      readonly scryfallId_foil_userId: {
        readonly scryfallId: string;
        readonly foil: boolean;
        readonly userId: string;
      };
    };

/**
 * @param overrides - Columns that differ from one near-mint, non-foil Sol Ring.
 * @returns A row owned by {@link COLLECTION_OWNER}.
 */
export function collectionRow(
  overrides: Partial<FakeCollectionRow> = {}
): FakeCollectionRow {
  return {
    id: "row-sol-ring",
    scryfallId: "printing-sol-ring",
    name: "Sol Ring",
    quantity: 1,
    foil: false,
    condition: "NM",
    acquiredAt: null,
    price: 1.5,
    imageUri: "",
    userId: COLLECTION_OWNER,
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    ...overrides,
  };
}

/**
 * @param row - A stored row.
 * @returns The same row as the JSON wire carries it, with dates as strings.
 */
export function wireRow(row: FakeCollectionRow): unknown {
  return JSON.parse(JSON.stringify(row));
}

/**
 * Builds a fresh fake table.
 *
 * @returns The Prisma-shaped client plus helpers to seed and inspect it.
 */
function createCollectionDb() {
  const stored: { rows: readonly FakeCollectionRow[] } = { rows: [] };
  let failDelete = false;

  /** Prisma-shaped delegate that reads and writes one copy of the table. */
  const delegateOver = (table: { rows: readonly FakeCollectionRow[] }) => {
    const locate = (where: UniqueWhere): FakeCollectionRow | undefined => {
      if ("id" in where) return table.rows.find((row) => row.id === where.id);
      const key = where.scryfallId_foil_userId;
      return table.rows.find(
        (row) =>
          row.scryfallId === key.scryfallId &&
          row.foil === key.foil &&
          row.userId === key.userId
      );
    };

    return {
      findUnique: async ({ where }: { readonly where: UniqueWhere }) =>
        locate(where) ?? null,
      update: async ({
        where,
        data,
      }: {
        readonly where: UniqueWhere;
        readonly data: Partial<FakeCollectionRow>;
      }) => {
        const current = locate(where);
        if (!current) throw new Error("Record to update not found.");
        const next: FakeCollectionRow = { ...current, ...data };
        table.rows = table.rows.map((row) =>
          row.id === current.id ? next : row
        );
        return next;
      },
      delete: async ({ where }: { readonly where: UniqueWhere }) => {
        if (failDelete) {
          failDelete = false;
          throw new Error("delete failed");
        }
        const current = locate(where);
        if (!current) throw new Error("Record to delete does not exist.");
        table.rows = table.rows.filter((row) => row.id !== current.id);
        return current;
      },
    };
  };

  const collectionCard = delegateOver(stored);

  return {
    prisma: {
      collectionCard,
      /** Runs `run` on a draft and stores the draft only if `run` resolves. */
      $transaction: async <Result>(
        run: (tx: {
          readonly collectionCard: ReturnType<typeof delegateOver>;
        }) => Promise<Result>
      ): Promise<Result> => {
        const draft = { rows: stored.rows };
        const result = await run({ collectionCard: delegateOver(draft) });
        stored.rows = draft.rows;
        return result;
      },
    },
    /** Replaces the table contents and clears any planned failure. */
    reset(seed: readonly FakeCollectionRow[]): void {
      stored.rows = [...seed];
      failDelete = false;
    },
    /** Makes the next `delete` throw, as a lost connection would. */
    failNextDelete(): void {
      failDelete = true;
    },
    /** @returns The row with this id, if it is still stored. */
    row(id: string): FakeCollectionRow | undefined {
      return stored.rows.find((row) => row.id === id);
    },
    /** @returns Every stored row, in insertion order. */
    all(): readonly FakeCollectionRow[] {
      return stored.rows;
    },
  };
}

/** The shared fake; call `reset` in `beforeEach`. */
export const collectionDb = createCollectionDb();
