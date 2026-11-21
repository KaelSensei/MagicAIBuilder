/**
 * Reads the decks of one player that pass a card filter, in the library's
 * listing shape (I-01, the library filter line of
 * `docs/product/specs/i01-deck-editor-workflow.md`).
 *
 * Deck-building context, Prisma adapter. Owner-only: every query is scoped to
 * the player's decks by `userId`, private decks included, so another
 * account's deck cannot come back. Three reads, none per deck:
 * 1. the player's deck ids and edit dates (`@@index([userId])`);
 * 2. the card rows of those decks whose name starts with a filter name
 *    (`@@index([deckId])`), a coarse narrowing in the database;
 * 3. the passing decks of the page, in the listing shape, and their counts.
 * The exact rule (whole name or front face, committed zones) is applied in
 * between by `decksPassingCardFilter`.
 *
 * Not a snapshot read: a deck saved between the reads may be judged on
 * either version. A read-only search needs no stronger guarantee.
 *
 * @module deck/deck-library-card-search
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  cardFilterNames,
  decksPassingCardFilter,
  type DeckCardFilter,
} from "@/lib/deck/deck-card-filter";
import {
  DECK_LISTING_INCLUDE,
  DECK_LISTING_MAX_PAGE_SIZE,
  withCardCopyCounts,
} from "@/lib/deck/deck-listing-read";

/** What one search asks. */
export interface DeckLibraryCardSearch {
  /** The signed-in owner; only their decks are read. */
  readonly userId: string;
  /** At least one included or excluded name. */
  readonly filter: DeckCardFilter;
}

/**
 * Escapes a name for a `LIKE` pattern. Prisma 6.19 sends `startsWith` as
 * `ILIKE` with the operand's `%` and `_` left as wildcards (checked against
 * PostgreSQL 16 on 2026-11-20), and PostgreSQL's default escape character is
 * the backslash. A miss here only widens the narrowing; the exact rule runs
 * after it.
 */
function likeLiteral(name: string): string {
  return name.replaceAll(/[\\%_]/g, String.raw`\$&`);
}

/** Most recently edited first; the id breaks a tie, so the order is stable. */
function byMostRecentlyEdited(
  a: { readonly id: string; readonly updatedAt: Date },
  b: { readonly id: string; readonly updatedAt: Date }
): number {
  const byDate = b.updatedAt.getTime() - a.updatedAt.getTime();
  if (byDate !== 0) return byDate;
  return a.id < b.id ? -1 : 1;
}

/** Read 1: the owner's deck ids, most recently edited first. */
async function ownedDeckIds(userId: string): Promise<readonly string[]> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    select: { id: true, updatedAt: true },
  });
  return [...decks].sort(byMostRecentlyEdited).map((deck) => deck.id);
}

/** Read 2: the rows of those decks that may name a card of the filter. */
function rowsNamingFilterCards(
  deckIds: readonly string[],
  filter: DeckCardFilter
) {
  return prisma.deckCard.findMany({
    where: {
      deckId: { in: [...deckIds] },
      OR: cardFilterNames(filter).map((name) => ({
        name: {
          startsWith: likeLiteral(name),
          mode: Prisma.QueryMode.insensitive,
        },
      })),
    },
    select: {
      deckId: true,
      name: true,
      quantity: true,
      zone: true,
      isCommander: true,
      isPartner: true,
      category: true,
    },
  });
}

/** Read 3: the page's decks in the listing shape, in the page's order. */
async function listedDecks(userId: string, page: readonly string[]) {
  if (page.length === 0) return [];
  const decks = await prisma.deck.findMany({
    where: { userId, id: { in: [...page] } },
    include: DECK_LISTING_INCLUDE,
  });
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  // A deck deleted since read 1 has no row: it is left out.
  return withCardCopyCounts(page.flatMap((id) => byId.get(id) ?? []));
}

/**
 * The owner's decks that pass the filter, most recently edited first, at
 * most {@link DECK_LISTING_MAX_PAGE_SIZE} of them.
 *
 * @param search - the owner and a filter naming at least one card
 * @returns the decks, each in the listing shape with its `cardCopyCount`,
 *   and whether more decks passed than came back
 * @throws when the database fails; the caller answers 500
 */
export async function searchOwnedDecksByCard(search: DeckLibraryCardSearch) {
  const { userId, filter } = search;
  const deckIds = await ownedDeckIds(userId);
  const rows =
    deckIds.length === 0 ? [] : await rowsNamingFilterCards(deckIds, filter);
  const passing = decksPassingCardFilter(deckIds, rows, filter);
  const page = passing.slice(0, DECK_LISTING_MAX_PAGE_SIZE);
  return {
    decks: await listedDecks(userId, page),
    hasMore: passing.length > page.length,
  };
}
