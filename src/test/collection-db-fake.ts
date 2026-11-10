/**
 * In-memory `collectionCard` table, so a test can follow a collection edit
 * from the client store through the real `/api/collection/[id]` route to the
 * stored row. Supports the lookups that route makes: by `id`, and by the
 * `scryfallId_foil_userId` compound unique key.
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
  let rows: readonly FakeCollectionRow[] = [];

  const locate = (where: UniqueWhere): FakeCollectionRow | undefined => {
    if ("id" in where) return rows.find((row) => row.id === where.id);
    const key = where.scryfallId_foil_userId;
    return rows.find(
      (row) =>
        row.scryfallId === key.scryfallId &&
        row.foil === key.foil &&
        row.userId === key.userId
    );
  };

  const collectionCard = {
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
      rows = rows.map((row) => (row.id === current.id ? next : row));
      return next;
    },
    delete: async ({ where }: { readonly where: UniqueWhere }) => {
      const current = locate(where);
      if (!current) throw new Error("Record to delete does not exist.");
      rows = rows.filter((row) => row.id !== current.id);
      return current;
    },
  };

  return {
    prisma: { collectionCard },
    /** Replaces the table contents. */
    reset(seed: readonly FakeCollectionRow[]): void {
      rows = [...seed];
    },
    /** @returns The row with this id, if it is still stored. */
    row(id: string): FakeCollectionRow | undefined {
      return rows.find((row) => row.id === id);
    },
    /** @returns Every stored row, in insertion order. */
    all(): readonly FakeCollectionRow[] {
      return rows;
    },
  };
}

/** The shared fake; call `reset` in `beforeEach`. */
export const collectionDb = createCollectionDb();
