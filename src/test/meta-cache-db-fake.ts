/**
 * In-memory `metaCache` table, so a test can follow a meta answer from the
 * Prisma repository adapter to the stored row without a database. Supports
 * the two calls the adapter makes: `findUnique` by the `commanderSlug_source`
 * compound unique key, and `upsert` on the same key. `select` is ignored.
 *
 * `failNext` makes the next call reject as a lost connection would, so the
 * adapter's silence on a failed read or write can be pinned (B2-12).
 */
import { prismaQuery } from "@/test/prisma-query";

/** One stored `MetaCache` row, as Prisma returns it. */
export type FakeMetaCacheRow = {
  readonly id: string;
  readonly commanderSlug: string;
  readonly source: string;
  readonly data: unknown;
  readonly cachedAt: Date;
  readonly expiresAt: Date;
};

/** The compound unique key the adapter looks a row up by. */
type UniqueWhere = {
  readonly commanderSlug_source: {
    readonly commanderSlug: string;
    readonly source: string;
  };
};

/** The columns a `create` or `update` sets; `commanderSlug` and `source` come from the key. */
type RowValues = {
  readonly data: unknown;
  readonly cachedAt: Date;
  readonly expiresAt: Date;
};

/** The fake table, its rows exposed for seeding and assertions. */
export type FakeMetaCacheTable = {
  readonly rows: Map<string, FakeMetaCacheRow>;
  /** Stores a row as written by an older version of the code, bypassing the adapter. */
  readonly seed: (
    commanderSlug: string,
    source: string,
    values: RowValues
  ) => void;
  /** The next `findUnique` or `upsert` rejects with `error`. */
  readonly failNext: (error: Error) => void;
  readonly findUnique: (args: {
    readonly where: UniqueWhere;
  }) => Promise<FakeMetaCacheRow | null>;
  readonly upsert: (args: {
    readonly where: UniqueWhere;
    readonly create: RowValues & {
      readonly commanderSlug: string;
      readonly source: string;
    };
    readonly update: RowValues;
  }) => Promise<FakeMetaCacheRow>;
};

function keyOf(commanderSlug: string, source: string): string {
  return `${source}:${commanderSlug}`;
}

/** @returns an empty table */
export function createFakeMetaCacheTable(): FakeMetaCacheTable {
  const rows = new Map<string, FakeMetaCacheRow>();
  let pendingFailure: Error | null = null;
  let nextId = 1;

  function takeFailure(): void {
    if (pendingFailure === null) return;
    const failure = pendingFailure;
    pendingFailure = null;
    throw failure;
  }

  function store(
    commanderSlug: string,
    source: string,
    values: RowValues
  ): FakeMetaCacheRow {
    const key = keyOf(commanderSlug, source);
    const row: FakeMetaCacheRow = {
      id: rows.get(key)?.id ?? `meta-cache-${nextId++}`,
      commanderSlug,
      source,
      data: values.data,
      cachedAt: values.cachedAt,
      expiresAt: values.expiresAt,
    };
    rows.set(key, row);
    return row;
  }

  return {
    rows,
    seed: (commanderSlug, source, values) => {
      store(commanderSlug, source, values);
    },
    failNext: (error) => {
      pendingFailure = error;
    },
    findUnique: ({ where }) =>
      prismaQuery(() => {
        takeFailure();
        const { commanderSlug, source } = where.commanderSlug_source;
        return rows.get(keyOf(commanderSlug, source)) ?? null;
      }),
    upsert: ({ where, create, update }) =>
      prismaQuery(() => {
        takeFailure();
        const { commanderSlug, source } = where.commanderSlug_source;
        const exists = rows.has(keyOf(commanderSlug, source));
        return store(commanderSlug, source, exists ? update : create);
      }),
  };
}
