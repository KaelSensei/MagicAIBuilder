/**
 * The card copies of a page of decks, summed in PostgreSQL.
 *
 * Why one `groupBy`: a deck list shows up to 50 decks (`GET /api/decks`) or
 * 100 (`GET /api/v1/decks`), and a count per deck would be one query per row
 * of the page. One grouped query sums `quantity` for every deck of the page at
 * once; the groups are few (one per deck, slot flags, category and zone), and
 * `countStoredCardCopies` classifies them with the same rule as the editor.
 *
 * @module deck/prisma-deck-card-copies
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";

import {
  countStoredCardCopies,
  type StoredCardCopies,
} from "@/lib/deck/stored-card-count";

/**
 * Counts the cards of each deck as the editor counts them
 * (`countStoredCardCopies`), in one query for the whole page.
 *
 * @param client - the Prisma client; only `deckCard.groupBy` is called
 * @param deckIds - the decks of the page; an empty page sends no query
 * @returns each deck's card count, 0 for a deck with no rows
 * @throws whatever the query rejects with; the caller reports it
 */
export async function countDeckCardCopies(
  client: Pick<PrismaClient, "deckCard">,
  deckIds: readonly string[]
): Promise<ReadonlyMap<string, number>> {
  if (deckIds.length === 0) return new Map();
  const groups = await client.deckCard.groupBy({
    by: ["deckId", "isCommander", "isPartner", "category", "zone"],
    where: { deckId: { in: [...deckIds] } },
    _sum: { quantity: true },
  });
  const rowsByDeck = new Map<string, StoredCardCopies[]>();
  for (const group of groups) {
    const rows = rowsByDeck.get(group.deckId) ?? [];
    rows.push({
      isCommander: group.isCommander,
      isPartner: group.isPartner,
      category: group.category,
      zone: group.zone,
      quantity: group._sum.quantity ?? 0,
    });
    rowsByDeck.set(group.deckId, rows);
  }
  return new Map(
    deckIds.map((deckId) => [
      deckId,
      countStoredCardCopies(rowsByDeck.get(deckId) ?? []),
    ])
  );
}
