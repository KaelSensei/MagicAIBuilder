/**
 * In-memory stand-ins for the shared Scryfall cache tables (`CardCache` and
 * `ScryfallSearchCache`), so route tests can follow a request to the stored row.
 * Supports the calls the cache routes make: `findUnique`, `upsert`, `count`, and
 * a `deleteMany` whose `where` is an `OR` of `cachedAt: { lt }` and
 * `NOT: { <key>: { startsWith } }`. `select` is ignored.
 */

/** One stored cache row. */
export type FakeCacheRow = {
  readonly data: unknown;
  readonly cachedAt: Date;
};

type KeyFilter = { readonly startsWith: string };

type PruneClause =
  | { readonly cachedAt: { readonly lt: Date } }
  | { readonly NOT: Readonly<Record<string, KeyFilter>> };

/** The fake table, its rows exposed for seeding and assertions. */
export type FakeCacheTable = {
  readonly rows: Map<string, FakeCacheRow>;
  readonly findUnique: (args: {
    readonly where: Readonly<Record<string, string>>;
  }) => Promise<(FakeCacheRow & Record<string, unknown>) | null>;
  readonly upsert: (args: {
    readonly where: Readonly<Record<string, string>>;
    readonly create: Readonly<Record<string, unknown>>;
    readonly update: Readonly<Record<string, unknown>>;
  }) => Promise<void>;
  readonly count: () => Promise<number>;
  readonly deleteMany: (args: {
    readonly where: { readonly OR: readonly PruneClause[] };
  }) => Promise<{ count: number }>;
};

function keyOf(
  where: Readonly<Record<string, string>>,
  keyField: string
): string {
  const key = where[keyField];
  if (key === undefined) throw new Error(`where.${keyField} is required`);
  return key;
}

function rowFrom(values: Readonly<Record<string, unknown>>): FakeCacheRow {
  const cachedAt = values.cachedAt;
  return {
    data: values.data,
    cachedAt: cachedAt instanceof Date ? cachedAt : new Date(),
  };
}

function matches(
  clause: PruneClause,
  key: string,
  row: FakeCacheRow,
  keyField: string
): boolean {
  if ("cachedAt" in clause) return row.cachedAt < clause.cachedAt.lt;
  const filter = clause.NOT[keyField];
  return filter !== undefined && !key.startsWith(filter.startsWith);
}

/**
 * @param keyField - the table's primary-key column (`cacheKey` or `scryfallId`)
 * @returns an empty table
 */
export function createFakeCacheTable(keyField: string): FakeCacheTable {
  const rows = new Map<string, FakeCacheRow>();
  return {
    rows,
    findUnique: async ({ where }) => {
      const key = keyOf(where, keyField);
      const row = rows.get(key);
      return row ? { ...row, [keyField]: key } : null;
    },
    upsert: async ({ where, create, update }) => {
      const key = keyOf(where, keyField);
      rows.set(key, rowFrom(rows.has(key) ? update : create));
    },
    count: async () => rows.size,
    deleteMany: async ({ where }) => {
      const doomed = [...rows].filter(([key, row]) =>
        where.OR.some((clause) => matches(clause, key, row, keyField))
      );
      for (const [key] of doomed) rows.delete(key);
      return { count: doomed.length };
    },
  };
}

const search = createFakeCacheTable("cacheKey");
const cards = createFakeCacheTable("scryfallId");

/** Both cache tables, one instance per test file, plus a reset between tests. */
export const scryfallCacheDb = {
  search,
  cards,
  /** The tables under the names the Prisma client gives them. */
  prisma: { scryfallSearchCache: search, cardCache: cards },
  /** Empties both tables. */
  reset(): void {
    search.rows.clear();
    cards.rows.clear();
  },
};
