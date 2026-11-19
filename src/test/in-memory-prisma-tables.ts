/**
 * An in-memory database behind `@/lib/db/prisma`, read-only, for sociable
 * route tests that read many tables: the account export walks every table a
 * player owns.
 *
 * Why: the route-policy suite proved the shape (one row list per Prisma
 * delegate, the real client as a `Proxy` target so no query reaches a
 * database). This kit adds the two things an owner-scoped read depends on and
 * a stub would hide: `where` filters rows, so another player's rows stay out
 * only if the query asks for the caller's; and `select` projects rows, so a
 * column the query does not name (a password hash, a token) never comes back.
 *
 * Supported: `findMany`, `findUnique` and `findFirst`; in a `where`, equality
 * and `{ in: [...] }` per column; a flat `select` of `true` columns. Anything
 * else throws, so a query this fake cannot answer faithfully fails the test
 * instead of passing it. `orderBy` is ignored: rows come back in seeded order.
 *
 * ```ts
 * vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
 *   const { inMemoryPrisma } = await import("@/test/in-memory-prisma-tables");
 *   return inMemoryPrisma(await importOriginal(), tables);
 * });
 * ```
 *
 * @module test/in-memory-prisma-tables
 */
import type { PrismaClient } from "@prisma/client";
import { prismaQuery } from "@/test/prisma-query";

/** One stored row, column by column, as Prisma returns it. */
export type TableRow = Readonly<Record<string, unknown>>;

/** The seeded tables, keyed by Prisma delegate name (`deck`, `userFollow`). */
export type InMemoryTables = Map<string, readonly TableRow[]>;

/** @returns whether `value` is a plain object whose keys can be read */
function isRecord(value: unknown): value is TableRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @returns whether a stored column passes one `where` entry */
function columnMatches(stored: unknown, filter: unknown): boolean {
  if (!isRecord(filter)) return stored === filter;
  if (Array.isArray(filter.in) && Object.keys(filter).length === 1) {
    return filter.in.includes(stored);
  }
  throw new Error(
    `in-memory-prisma-tables: unsupported filter ${JSON.stringify(filter)}`
  );
}

/** @returns the rows that pass every entry of the call's `where` */
function rowsWhere(rows: readonly TableRow[], args: unknown): TableRow[] {
  const where = isRecord(args) && isRecord(args.where) ? args.where : {};
  return rows.filter((row) =>
    Object.entries(where).every(([column, filter]) =>
      columnMatches(row[column], filter)
    )
  );
}

/** @returns the row cut down to the call's `select`, or whole without one */
function project(row: TableRow, args: unknown): TableRow {
  const select = isRecord(args) ? args.select : undefined;
  if (select === undefined) return row;
  if (!isRecord(select)) {
    throw new Error("in-memory-prisma-tables: select must be an object");
  }
  return Object.fromEntries(
    Object.entries(select).map(([column, picked]) => {
      if (picked !== true) {
        throw new Error(
          `in-memory-prisma-tables: only flat selects are supported (${column})`
        );
      }
      return [column, row[column]];
    })
  );
}

/** A read-only delegate over one table. */
function tableDelegate(rows: readonly TableRow[]) {
  const first = (args: unknown) =>
    prismaQuery(() => {
      const [row] = rowsWhere(rows, args);
      return row === undefined ? null : project(row, args);
    });
  return {
    findMany: (args: unknown) =>
      prismaQuery(() => rowsWhere(rows, args).map((row) => project(row, args))),
    findUnique: first,
    findFirst: first,
  };
}

/**
 * Builds the `@/lib/db/prisma` module a mock factory returns.
 *
 * @param original - The real module, from the factory's `importOriginal()`;
 *   its client is only the `Proxy` target and is never called.
 * @param tables - The rows each delegate answers. Read on every call, so a
 *   test may reseed the map between calls. A delegate with no entry answers
 *   an empty table; client methods (`$transaction`…) read as `undefined`.
 * @returns The module, whose `prisma` reads only `tables`.
 */
export function inMemoryPrisma(
  original: { readonly prisma: PrismaClient },
  tables: InMemoryTables
): { prisma: PrismaClient } {
  return {
    prisma: new Proxy(original.prisma, {
      get: (_client, property) => {
        if (typeof property !== "string" || property.startsWith("$")) {
          return undefined;
        }
        return tableDelegate(tables.get(property) ?? []);
      },
    }),
  };
}
