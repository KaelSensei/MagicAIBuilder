/**
 * An in-memory `User`, `Deck` and `DeckCard` database behind
 * `@/lib/db/prisma`, read-only, for the sociable tests of the deck library's
 * card search (`GET /api/decks/search`).
 *
 * Why a fake of its own: the search narrows card rows in the database with
 * `startsWith` in insensitive mode, which Prisma 6.19 sends as
 * `name ILIKE $1` with the operand followed by `%` and its own wildcards
 * left unescaped (checked against PostgreSQL 16 on 2026-11-20). A stub would
 * answer whatever the test wrote; this fake applies PostgreSQL's `LIKE` rules
 * (`%` any run, `_` one character, `\` escapes the next one) to stored rows,
 * so a wrong pattern returns the wrong rows here as it would in production.
 * It also answers the listing's `include` and the copy-count `groupBy`.
 *
 * Supported, and nothing else (anything else throws, so a query the fake
 * cannot answer faithfully fails the test):
 * - `where`: column equality, `{ in: [...] }`, `{ startsWith, mode }`, and
 *   `OR: [...]`;
 * - `select`: a flat object of `true` columns;
 * - `include` on `deck.findMany`: `cards` (its `where` and `select`) and
 *   `_count.cards`; `distinct` and `take` are ignored, the test rows hold one
 *   commander each;
 * - `deckCard.groupBy` as `deck-card-group-by-fake.ts` answers it.
 *
 * @module test/deck-library-db-fake
 */
import type { PrismaClient } from "@prisma/client";
import { deckCardGroupByFake } from "@/test/deck-card-group-by-fake";
import type { FakeDeckCard } from "@/test/playtest-db-fake";
import { prismaQuery } from "@/test/prisma-query";

type Row = Readonly<Record<string, unknown>>;

/** The rows the fake answers from; reseed between tests. */
export interface DeckLibraryTables {
  users: readonly Row[];
  decks: readonly Row[];
  cards: readonly FakeDeckCard[];
}

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unsupported(what: unknown): never {
  throw new Error(`deck-library-db-fake: unsupported ${JSON.stringify(what)}`);
}

/** One character as a regular expression that matches only itself. */
function literal(char: string): string {
  return char.replaceAll(/[.*+?^${}()|[\]\\/]/g, String.raw`\$&`);
}

/**
 * PostgreSQL `LIKE`/`ILIKE` with its default escape character.
 *
 * @param text - the stored value
 * @param pattern - the pattern as sent
 * @param insensitive - true for `ILIKE`
 */
function likeMatches(
  text: string,
  pattern: string,
  insensitive: boolean
): boolean {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
      source += literal(pattern[index] ?? "");
    } else if (char === "%") source += ".*";
    else if (char === "_") source += ".";
    else source += literal(char ?? "");
  }
  return new RegExp(`^${source}$`, insensitive ? "is" : "s").test(text);
}

function columnMatches(stored: unknown, filter: unknown): boolean {
  if (!isRecord(filter)) return stored === filter;
  if (Array.isArray(filter.in)) return filter.in.includes(stored);
  if (typeof filter.startsWith === "string" && typeof stored === "string") {
    const insensitive = filter.mode === "insensitive";
    return likeMatches(stored, `${filter.startsWith}%`, insensitive);
  }
  return unsupported(filter);
}

function rowMatches(row: Row, where: unknown): boolean {
  if (where === undefined) return true;
  if (!isRecord(where)) return unsupported(where);
  return Object.entries(where).every(([key, filter]) => {
    if (key !== "OR") return columnMatches(row[key], filter);
    if (!Array.isArray(filter)) return unsupported(filter);
    return filter.some((branch: unknown) => rowMatches(row, branch));
  });
}

function project(row: Row, select: unknown): Row {
  if (select === undefined) return row;
  if (!isRecord(select)) return unsupported(select);
  return Object.fromEntries(
    Object.entries(select).map(([column, picked]) =>
      picked === true
        ? [column, row[column]]
        : unsupported({ [column]: picked })
    )
  );
}

function argsOf(args: unknown): Row {
  return isRecord(args) ? args : {};
}

/** A listed deck: the row, its included card rows and its row count. */
function withInclude(
  deck: Row,
  include: unknown,
  cards: readonly FakeDeckCard[]
): Row {
  if (include === undefined) return deck;
  if (!isRecord(include) || !isRecord(include.cards))
    return unsupported(include);
  const own = cards.filter((card) => card.deckId === deck.id);
  const { where, select } = include.cards;
  return {
    ...deck,
    cards: own
      .filter((card) => rowMatches(card, where))
      .map((card) => project(card, select)),
    _count: { cards: own.length },
  };
}

function delegates(tables: DeckLibraryTables) {
  return {
    user: {
      findUnique: (args: unknown) =>
        prismaQuery(() => {
          const { where, select } = argsOf(args);
          const user = tables.users.find((row) => rowMatches(row, where));
          return user === undefined ? null : project(user, select);
        }),
    },
    deck: {
      findMany: (args: unknown) =>
        prismaQuery(() => {
          const { where, select, include } = argsOf(args);
          return tables.decks
            .filter((row) => rowMatches(row, where))
            .map((row) =>
              include === undefined
                ? project(row, select)
                : withInclude(row, include, tables.cards)
            );
        }),
    },
    deckCard: {
      findMany: (args: unknown) =>
        prismaQuery(() => {
          const { where, select } = argsOf(args);
          return tables.cards
            .filter((row) => rowMatches(row, where))
            .map((row) => project(row, select));
        }),
      groupBy: (
        args: Parameters<ReturnType<typeof deckCardGroupByFake>["groupBy"]>[0]
      ) => deckCardGroupByFake(tables.cards).groupBy(args),
    },
  };
}

/**
 * Builds the `@/lib/db/prisma` module a mock factory returns.
 *
 * @param original - the real module, from the factory's `importOriginal()`;
 *   its client is only the `Proxy` target and is never called
 * @param tables - the rows, read on every call
 * @returns the module, whose `prisma` answers only from `tables`
 */
export function deckLibraryPrisma(
  original: { readonly prisma: PrismaClient },
  tables: DeckLibraryTables
): { prisma: PrismaClient } {
  return {
    prisma: new Proxy(original.prisma, {
      get: (_client, property) => {
        const answers: Readonly<Record<string, unknown>> = delegates(tables);
        return typeof property === "string" ? answers[property] : undefined;
      },
    }),
  };
}
